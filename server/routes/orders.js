const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const MAX_QTY = 10;
const MAX_LINES = 50;

// Errors with a status are shown to the user; anything else becomes a generic 500
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

const getProduct = db.prepare('SELECT id, title, price_cents, stock FROM products WHERE id = ?');
const insertOrder = db.prepare('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)');
const insertItem = db.prepare(
  'INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?)'
);
const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
const getOrder = db.prepare('SELECT id, total_cents, status, created_at FROM orders WHERE id = ?');

// Everything below happens in one transaction: any thrown error rolls it all back
const placeOrder = db.transaction((userId, items) => {
  let total = 0;
  const lines = [];

  for (const item of items) {
    const product = getProduct.get(item.product_id);
    if (!product) throw httpError(404, 'One of the products no longer exists');
    if (product.stock < item.quantity) {
      throw httpError(409, `Not enough stock for "${product.title}" (${product.stock} left)`);
    }
    lines.push({ product, quantity: item.quantity });
    total += product.price_cents * item.quantity; // price always comes from the database
  }

  const orderId = insertOrder.run(userId, total).lastInsertRowid;

  for (const { product, quantity } of lines) {
    insertItem.run(orderId, product.id, quantity, product.price_cents);
    const result = reduceStock.run(quantity, product.id, quantity);
    if (result.changes === 0) {
      throw httpError(409, `Not enough stock for "${product.title}"`);
    }
  }

  return getOrder.get(orderId);
});

// POST /api/orders
router.post('/', requireAuth, (req, res, next) => {
  try {
    const items = req.body && req.body.items;

    if (!Array.isArray(items) || items.length < 1 || items.length > MAX_LINES) {
      return res.status(400).json({ error: `Send between 1 and ${MAX_LINES} items` });
    }

    const seen = new Set();
    for (const item of items) {
      const valid =
        item &&
        Number.isInteger(item.product_id) &&
        item.product_id > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= MAX_QTY;
      if (!valid) {
        return res.status(400).json({ error: `Each item needs a product_id and a quantity from 1 to ${MAX_QTY}` });
      }
      if (seen.has(item.product_id)) {
        return res.status(400).json({ error: 'Each product can appear only once' });
      }
      seen.add(item.product_id);
    }

    // Only product_id and quantity are used; any price sent by the client is ignored
    const clean = items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
    res.status(201).json(placeOrder(req.user.id, clean));
  } catch (err) {
    if (err.expose) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// GET /api/orders  (only the logged-in user's orders, newest first)
router.get('/', requireAuth, (req, res) => {
  const orders = db
    .prepare(
      'SELECT id, total_cents, status, created_at FROM orders WHERE user_id = ? ORDER BY id DESC'
    )
    .all(req.user.id);

  const rows = db
    .prepare(
      `SELECT oi.order_id, oi.product_id, p.title, oi.quantity, oi.unit_price_cents
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (SELECT id FROM orders WHERE user_id = ?)
       ORDER BY oi.id`
    )
    .all(req.user.id);

  const byOrder = new Map();
  for (const { order_id, ...line } of rows) {
    if (!byOrder.has(order_id)) byOrder.set(order_id, []);
    byOrder.get(order_id).push(line);
  }

  res.json(orders.map((o) => ({ ...o, items: byOrder.get(o.id) || [] })));
});

module.exports = router;
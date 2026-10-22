const express = require('express');
const db = require('../db');

const router = express.Router();

// Escape LIKE wildcards so user input is matched literally
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

// GET /api/products?q=...&category=...
router.get('/', (req, res) => {
  const { q, category } = req.query;
  const where = [];
  const params = [];

  if (q !== undefined) {
    if (typeof q !== 'string' || q.length > 100) {
      return res.status(400).json({ error: 'Invalid search text' });
    }
    if (q.trim()) {
      where.push("title LIKE ? ESCAPE '\\'");
      params.push(`%${escapeLike(q.trim())}%`);
    }
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || category.length > 50) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (category.trim()) {
      where.push('category = ?');
      params.push(category.trim());
    }
  }

  const sql =
    'SELECT id, title, price_cents, category, image_url, stock FROM products' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY id';

  res.json(db.prepare(sql).all(...params));
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const product = db
    .prepare(
      'SELECT id, title, description, price_cents, category, image_url, stock FROM products WHERE id = ?'
    )
    .get(id);

  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

module.exports = router;
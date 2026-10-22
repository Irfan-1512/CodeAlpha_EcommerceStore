import { api, formatPrice } from './api.js';
import { getCart, setQty, removeItem, clearCart, MAX_QTY } from './cart.js';

const statusEl = document.getElementById('status');
const list = document.getElementById('cart-list');
const summary = document.getElementById('summary');
const orderMsg = document.getElementById('order-msg');

let products = new Map();
let removedNotice = false;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showOrderMessage(text, kind) {
  orderMsg.className = kind ? `notice ${kind}` : 'notice';
  orderMsg.textContent = text;
}

function showEmpty() {
  list.replaceChildren();
  summary.hidden = true;
  statusEl.className = 'status';
  statusEl.textContent = 'Your cart is empty. ';
  const link = el('a', '', 'Browse products');
  link.href = '/';
  statusEl.append(link);
}

function makeRow(item, p) {
  const max = Math.min(MAX_QTY, p.stock);

  const li = el('li', 'cart-row');

  const imgBox = el('div', 'cart-img');
  const img = el('img');
  img.src = p.image_url;
  img.alt = '';
  imgBox.append(img);

  const info = el('div', 'cart-info');
  const title = el('a', 'cart-title', p.title);
  title.href = `/product.html?id=${p.id}`;
  info.append(title, el('span', 'muted', `${formatPrice(p.price_cents)} each`));

  const stepper = el('div', 'stepper');
  const minus = el('button', 'btn btn-secondary', '\u2212');
  minus.type = 'button';
  minus.setAttribute('aria-label', `Decrease quantity of ${p.title}`);
  minus.disabled = item.qty <= 1;
  minus.addEventListener('click', () => {
    setQty(p.id, item.qty - 1);
    render();
  });
  const qty = el('span', 'qty', String(item.qty));
  const plus = el('button', 'btn btn-secondary', '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `Increase quantity of ${p.title}`);
  plus.disabled = item.qty >= max;
  plus.addEventListener('click', () => {
    setQty(p.id, item.qty + 1);
    render();
  });
  stepper.append(minus, qty, plus);

  const lineTotal = el('strong', 'line-total', formatPrice(p.price_cents * item.qty));

  const remove = el('button', 'btn btn-secondary', 'Remove');
  remove.type = 'button';
  remove.setAttribute('aria-label', `Remove ${p.title} from cart`);
  remove.addEventListener('click', () => {
    removeItem(p.id);
    render();
  });

  li.append(imgBox, info, stepper, lineTotal, remove);
  return li;
}

async function placeOrder(button) {
  showOrderMessage('');
  button.disabled = true;
  try {
    // Must be logged in to order; send guests to login and bring them back here
    const { user } = await api('/auth/me');
    if (!user) {
      location.href = '/login.html?next=/cart.html';
      return;
    }

    const items = getCart().map((i) => ({ product_id: i.id, quantity: i.qty }));
    const order = await api('/orders', { method: 'POST', body: JSON.stringify({ items }) });

    clearCart();
    location.href = `/orders.html?placed=${order.id}`;
  } catch (err) {
    showOrderMessage(err.message, 'error');
    button.disabled = false;
    // Stock may have changed, so refresh the cart data
    try {
      const all = await api('/products');
      products = new Map(all.map((p) => [p.id, p]));
    } catch {
      // keep the old data
    }
    render();
  }
}

function render() {
  // Remove items whose product is gone or out of stock, and cap quantity at stock
  for (const item of getCart()) {
    const p = products.get(item.id);
    if (!p || p.stock <= 0) {
      removeItem(item.id);
      removedNotice = true;
    } else if (item.qty > p.stock) {
      setQty(item.id, p.stock);
    }
  }

  const cart = getCart();
  if (cart.length === 0) {
    showEmpty();
    return;
  }

  statusEl.className = 'status';
  statusEl.textContent = removedNotice
    ? 'Some items were removed because they are no longer available.'
    : '';

  list.replaceChildren(...cart.map((item) => makeRow(item, products.get(item.id))));

  const total = cart.reduce((sum, i) => sum + products.get(i.id).price_cents * i.qty, 0);
  const order = el('button', 'btn btn-primary place-order', 'Place Order');
  order.type = 'button';
  order.addEventListener('click', () => placeOrder(order));
  summary.replaceChildren(el('span', '', 'Total'), el('strong', 'total', formatPrice(total)), order);
  summary.hidden = false;
}

async function load() {
  statusEl.className = 'status';
  statusEl.textContent = 'Loading your cart...';
  try {
    const all = await api('/products');
    products = new Map(all.map((p) => [p.id, p]));
    render();
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = `Could not load your cart: ${err.message} `;
    const retry = el('button', 'btn btn-secondary', 'Try again');
    retry.type = 'button';
    retry.addEventListener('click', load);
    statusEl.append(retry);
  }
}

load();
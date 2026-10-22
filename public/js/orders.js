import { api, formatPrice } from './api.js';

const statusEl = document.getElementById('status');
const list = document.getElementById('orders');
const banner = document.getElementById('banner');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Dates are stored as UTC text like "2026-10-22 14:30:00"
function formatDate(text) {
  const date = new Date(text.replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

function makeOrder(order) {
  const li = el('li', 'order');

  const head = el('div', 'order-head');
  head.append(
    el('h2', 'order-title', `Order #${order.id}`),
    el('span', 'muted', formatDate(order.created_at)),
    el('span', 'status-pill', order.status)
  );

  const items = el('ul', 'order-items');
  for (const line of order.items) {
    const row = el('li');
    const name = el('a', '', line.title);
    name.href = `/product.html?id=${line.product_id}`;
    row.append(
      name,
      el('span', 'muted', ` \u00d7 ${line.quantity}`),
      el('span', 'order-line', formatPrice(line.unit_price_cents * line.quantity))
    );
    items.append(row);
  }

  const total = el('p', 'order-total');
  total.append('Total ', el('strong', '', formatPrice(order.total_cents)));

  li.append(head, items, total);
  return li;
}

function showConfirmation() {
  const placed = new URLSearchParams(location.search).get('placed');
  if (placed && /^\d+$/.test(placed)) {
    banner.textContent = `Order #${placed} placed. Thank you for shopping at MoonMart!`;
    banner.hidden = false;
  }
}

async function load() {
  statusEl.className = 'status';
  statusEl.textContent = 'Loading your orders...';
  try {
    const { user } = await api('/auth/me');
    if (!user) {
      location.href = '/login.html?next=/orders.html';
      return;
    }

    showConfirmation();
    const orders = await api('/orders');
    if (orders.length === 0) {
      statusEl.textContent = 'You have not placed any orders yet. ';
      const link = el('a', '', 'Browse products');
      link.href = '/';
      statusEl.append(link);
      return;
    }
    statusEl.textContent = '';
    list.replaceChildren(...orders.map(makeOrder));
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = `Could not load your orders: ${err.message} `;
    const retry = el('button', 'btn btn-secondary', 'Try again');
    retry.type = 'button';
    retry.addEventListener('click', load);
    statusEl.append(retry);
  }
}

load();
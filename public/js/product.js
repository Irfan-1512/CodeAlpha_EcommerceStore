import { api, formatPrice } from './api.js';
import { addItem, MAX_QTY } from './cart.js';

const statusEl = document.getElementById('status');
const root = document.getElementById('product');
const id = new URLSearchParams(location.search).get('id');

function buildBuyForm(p) {
  const max = Math.min(MAX_QTY, p.stock);

  const form = document.createElement('form');
  form.className = 'buy';

  const label = document.createElement('label');
  label.htmlFor = 'qty';
  label.textContent = 'Quantity';

  const input = document.createElement('input');
  input.id = 'qty';
  input.type = 'number';
  input.min = '1';
  input.max = String(max);
  input.value = '1';
  input.inputMode = 'numeric';

  const button = document.createElement('button');
  button.className = 'btn btn-primary';
  button.type = 'submit';
  button.textContent = 'Add to Cart';
  button.disabled = p.stock <= 0;

  const notice = document.createElement('p');
  notice.className = 'notice';
  notice.setAttribute('aria-live', 'polite');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const qty = Number(input.value);
    if (!Number.isInteger(qty) || qty < 1 || qty > max) {
      notice.className = 'notice error';
      notice.textContent = `Choose a quantity between 1 and ${max}.`;
      return;
    }
    addItem(p.id, qty, max);
    notice.className = 'notice ok';
    notice.textContent = 'Added to cart. ';
    const link = document.createElement('a');
    link.href = '/cart.html';
    link.textContent = 'View cart';
    notice.append(link);
  });

  const row = document.createElement('div');
  row.className = 'buy-row';
  row.append(label, input, button);
  form.append(row, notice);
  return form;
}

function render(p) {
  document.title = `${p.title} - MoonMart`;

  const wrap = document.createElement('div');
  wrap.className = 'detail';

  const imgBox = document.createElement('div');
  imgBox.className = 'detail-img';
  const img = document.createElement('img');
  img.src = p.image_url;
  img.alt = p.title;
  imgBox.append(img);

  const info = document.createElement('div');
  info.className = 'detail-info';

  const h1 = document.createElement('h1');
  h1.textContent = p.title;

  const cat = document.createElement('span');
  cat.className = 'category';
  cat.textContent = p.category;

  const price = document.createElement('p');
  price.className = 'price';
  price.textContent = formatPrice(p.price_cents);

  const stock = document.createElement('p');
  stock.className = p.stock > 0 ? 'stock in' : 'stock out';
  stock.textContent = p.stock > 0 ? `In stock (${p.stock} available)` : 'Out of stock';

  const desc = document.createElement('p');
  desc.textContent = p.description;

  info.append(h1, cat, price, stock, buildBuyForm(p), desc);
  wrap.append(imgBox, info);
  root.replaceChildren(wrap);
}

async function load() {
  if (!id || !/^\d+$/.test(id)) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Product not found.';
    return;
  }
  statusEl.className = 'status';
  statusEl.textContent = 'Loading product...';
  try {
    render(await api(`/products/${id}`));
    statusEl.textContent = '';
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = err.message;
  }
}

load();
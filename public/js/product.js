import { api, formatPrice } from './api.js';

const statusEl = document.getElementById('status');
const root = document.getElementById('product');
const id = new URLSearchParams(location.search).get('id');

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

  info.append(h1, cat, price, stock, desc);
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
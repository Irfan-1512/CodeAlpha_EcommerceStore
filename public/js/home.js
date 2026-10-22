import { api, formatPrice } from './api.js';

const params = new URLSearchParams(location.search);
const q = (params.get('q') || '').trim();
const category = (params.get('category') || '').trim();

const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const select = document.getElementById('category');
const heading = document.getElementById('heading');

function makeCard(p) {
  const li = document.createElement('li');
  li.className = 'card';

  const link = document.createElement('a');
  link.className = 'card-link';
  link.href = `/product.html?id=${p.id}`;

  const imgBox = document.createElement('div');
  imgBox.className = 'card-img';
  const img = document.createElement('img');
  img.src = p.image_url;
  img.alt = p.title;
  img.loading = 'lazy';
  imgBox.append(img);

  const body = document.createElement('div');
  body.className = 'card-body';
  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = p.title;
  const cat = document.createElement('span');
  cat.className = 'category';
  cat.textContent = p.category;
  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = formatPrice(p.price_cents);
  body.append(title, cat, price);

  link.append(imgBox, body);
  li.append(link);
  return li;
}

function showMessage(text, isError, onRetry) {
  statusEl.className = isError ? 'status error' : 'status';
  statusEl.textContent = text;
  if (onRetry) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.type = 'button';
    btn.textContent = 'Try again';
    btn.addEventListener('click', onRetry);
    statusEl.append(' ', btn);
  }
}

function fillCategories(all) {
  const names = [...new Set(all.map((p) => p.category))].sort();
  for (const name of names) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.append(opt);
  }
  select.value = category;
}

select.addEventListener('change', () => {
  const next = new URLSearchParams();
  if (q) next.set('q', q);
  if (select.value) next.set('category', select.value);
  location.search = next.toString();
});

async function load() {
  grid.replaceChildren();
  showMessage('Loading products...', false);
  try {
    const all = await api('/products');
    fillCategories(all);

    let products = all;
    if (q || category) {
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (category) qs.set('category', category);
      products = await api('/products?' + qs);
    }

    heading.textContent = q ? `Results for "${q}"` : category ? category : 'All products';

    if (products.length === 0) {
      showMessage('No products found. Try a different search or category.', false);
      return;
    }
    statusEl.textContent = '';
    grid.append(...products.map(makeCard));
  } catch (err) {
    showMessage(`Could not load products: ${err.message}`, true, load);
  }
}

load();
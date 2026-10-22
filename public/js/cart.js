const KEY = 'moonmart_cart';
export const MAX_QTY = 10;

export function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(data)) return [];
    return data.filter(
      (i) => Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= MAX_QTY
    );
  } catch {
    return [];
  }
}

function save(cart) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    // storage unavailable (private mode or full); the cart just won't persist
  }
  updateBadge();
}

export function addItem(id, qty, limit = MAX_QTY) {
  const max = Math.min(limit, MAX_QTY);
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) item.qty = Math.min(item.qty + qty, max);
  else cart.push({ id, qty: Math.min(qty, max) });
  save(cart);
}

export function setQty(id, qty) {
  if (!Number.isInteger(qty) || qty < 1) return removeItem(id);
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) item.qty = Math.min(qty, MAX_QTY);
  save(cart);
}

export function removeItem(id) {
  save(getCart().filter((i) => i.id !== id));
}

export function clearCart() {
  save([]);
}

export function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

export function updateBadge() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const n = cartCount();
  el.textContent = n;
  el.hidden = n === 0;
}
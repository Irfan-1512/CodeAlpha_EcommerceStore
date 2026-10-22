import { updateBadge } from './cart.js';
import { api } from './api.js';

// Shared header and footer. The markup is static (no user input), so innerHTML is safe here.
document.getElementById('site-header').innerHTML = `
  <div class="container header-inner">
    <a class="logo" href="/">MoonMart</a>
    <form class="search" role="search" action="/index.html">
      <label class="sr-only" for="search-input">Search products</label>
      <input id="search-input" name="q" type="search" placeholder="Search products" maxlength="100">
      <button class="btn btn-primary" type="submit">Search</button>
    </form>
    <nav class="site-nav" aria-label="Main">
      <a href="/login.html" id="auth-link">Login</a>
      <a href="/cart.html">Cart <span id="cart-count" class="badge" aria-live="polite" hidden>0</span></a>
    </nav>
  </div>`;

document.getElementById('site-footer').innerHTML = `
  <div class="container"><p>&copy; 2026 MoonMart. Built for CodeAlpha.</p></div>`;

// Keep the search text in the box after searching
const q = new URLSearchParams(location.search).get('q');
if (q) document.getElementById('search-input').value = q;

updateBadge();

// Show the user's name and a Logout button when logged in
async function showUser() {
  try {
    const { user } = await api('/auth/me');
    if (!user) return;

    const hello = document.createElement('span');
    hello.textContent = `Hi, ${user.name}`;

    const logout = document.createElement('button');
    logout.className = 'btn btn-secondary';
    logout.type = 'button';
    logout.textContent = 'Logout';
    logout.addEventListener('click', async () => {
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch {
        // already logged out
      }
      location.href = '/';
    });

           const orders = document.createElement('a');
       orders.href = '/orders.html';
       orders.textContent = 'Orders';

       document.getElementById('auth-link').replaceWith(hello, orders, logout);
  } catch {
    // leave the Login link in place
  }
}

showUser();
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Must be set before the app is loaded
const dbFile = path.join(os.tmpdir(), `moonmart-test-${process.pid}.db`);
process.env.DB_FILE = dbFile;
process.env.JWT_SECRET = 'test-secret-for-automated-tests-only-0123456789';
process.env.NODE_ENV = 'test';

const app = require('../server/index');
const db = require('../server/db');

let server;
let base;
let cookieA;
let cookieB;

before(async () => {
  const insert = db.prepare(
    'INSERT INTO products (id, title, description, price_cents, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insert.run(1, 'Test Shirt', 'A shirt', 1000, 'clothing', 'https://example.com/1.png', 5);
  insert.run(2, 'Test Phone', 'A phone', 500, 'electronics', 'https://example.com/2.png', 100);

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}`;
});

after(() => {
  server.close();
  db.close();
  fs.rmSync(dbFile, { force: true });
});

const send = (route, { method = 'GET', body, cookie } = {}) =>
  fetch(base + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

async function registerAndLogin(name, email) {
  await send('/api/auth/register', { method: 'POST', body: { name, email, password: 'password123' } });
  const res = await send('/api/auth/login', { method: 'POST', body: { email, password: 'password123' } });
  return res.headers.getSetCookie()[0].split(';')[0];
}

test('lists products and filters by category', async () => {
  const all = await (await send('/api/products')).json();
  assert.equal(all.length, 2);
  const filtered = await (await send('/api/products?category=electronics')).json();
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, 'Test Phone');
});

test('product detail validates the id', async () => {
  assert.equal((await send('/api/products/abc')).status, 400);
  assert.equal((await send('/api/products/999')).status, 404);
  assert.equal((await send('/api/products/1')).status, 200);
});

test('register validates input and rejects duplicate emails', async () => {
  const short = await send('/api/auth/register', {
    method: 'POST',
    body: { name: 'Sam', email: 'sam@example.com', password: 'abc' },
  });
  assert.equal(short.status, 400);

  const first = await send('/api/auth/register', {
    method: 'POST',
    body: { name: 'Sam', email: 'sam@example.com', password: 'password123' },
  });
  assert.equal(first.status, 201);
  assert.equal((await first.json()).password_hash, undefined);

  const again = await send('/api/auth/register', {
    method: 'POST',
    body: { name: 'Sam', email: 'SAM@example.com', password: 'password123' },
  });
  assert.equal(again.status, 409);
});

test('login rejects a wrong password and sets an httpOnly cookie on success', async () => {
  const bad = await send('/api/auth/login', {
    method: 'POST',
    body: { email: 'sam@example.com', password: 'wrong-password' },
  });
  assert.equal(bad.status, 401);

  const good = await send('/api/auth/login', {
    method: 'POST',
    body: { email: 'sam@example.com', password: 'password123' },
  });
  assert.equal(good.status, 200);
  assert.match(good.headers.getSetCookie()[0], /HttpOnly/i);
});

test('placing an order without logging in returns 401', async () => {
  const res = await send('/api/orders', {
    method: 'POST',
    body: { items: [{ product_id: 1, quantity: 1 }] },
  });
  assert.equal(res.status, 401);
});

test('order ignores a tampered client price and reduces stock', async () => {
  cookieA = await registerAndLogin('Alex', 'alex@example.com');
  const res = await send('/api/orders', {
    method: 'POST',
    cookie: cookieA,
    body: { items: [{ product_id: 1, quantity: 2, price_cents: 1 }] },
  });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).total_cents, 2000);
  assert.equal(db.prepare('SELECT stock FROM products WHERE id = 1').get().stock, 3);
});

test('order above available stock returns 409 and changes nothing', async () => {
  const ordersBefore = db.prepare('SELECT COUNT(*) n FROM orders').get().n;
  const res = await send('/api/orders', {
    method: 'POST',
    cookie: cookieA,
    body: { items: [{ product_id: 2, quantity: 1 }, { product_id: 1, quantity: 4 }] },
  });
  assert.equal(res.status, 409);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM orders').get().n, ordersBefore);
  assert.equal(db.prepare('SELECT stock FROM products WHERE id = 1').get().stock, 3);
  assert.equal(db.prepare('SELECT stock FROM products WHERE id = 2').get().stock, 100);
});

test('order rejects invalid bodies', async () => {
  for (const items of [[], [{ product_id: 1, quantity: 0 }], [{ product_id: 1, quantity: 11 }], [{ product_id: 1, quantity: 1 }, { product_id: 1, quantity: 1 }]]) {
    const res = await send('/api/orders', { method: 'POST', cookie: cookieA, body: { items } });
    assert.equal(res.status, 400);
  }
  const unknown = await send('/api/orders', {
    method: 'POST',
    cookie: cookieA,
    body: { items: [{ product_id: 9999, quantity: 1 }] },
  });
  assert.equal(unknown.status, 404);
});

test('users only see their own orders', async () => {
  const mine = await (await send('/api/orders', { cookie: cookieA })).json();
  assert.equal(mine.length, 1);
  assert.equal(mine[0].items[0].title, 'Test Shirt');

  cookieB = await registerAndLogin('Bo', 'bo@example.com');
  const theirs = await (await send('/api/orders', { cookie: cookieB })).json();
  assert.deepEqual(theirs, []);
});

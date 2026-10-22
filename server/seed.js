const fs = require('fs');
const path = require('path');
const db = require('./db');

const FILE = path.join(__dirname, 'products.json');

async function loadProducts() {
  // Saved copy first: works on hosts where the Fake Store API blocks requests
  if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));

  const res = await fetch('https://fakestoreapi.com/products');
  if (!res.ok) throw new Error(`Fake Store API returned ${res.status}`);
  const products = await res.json();
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || '',
    price_cents: Math.round(p.price * 100),
    category: p.category,
    image_url: p.image,
  }));
}

async function main() {
  const products = await loadProducts();

  const upsert = db.prepare(`
    INSERT INTO products (id, title, description, price_cents, category, image_url)
    VALUES (@id, @title, @description, @price_cents, @category, @image_url)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      price_cents = excluded.price_cents,
      category = excluded.category,
      image_url = excluded.image_url
  `);

  db.transaction((list) => {
    for (const p of list) upsert.run(p);
  })(products);

  console.log(`Seeded ${products.length} products`);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
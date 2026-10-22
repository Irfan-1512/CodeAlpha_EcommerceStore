# MoonMart: E-commerce Store

A full-stack e-commerce website built for **CodeAlpha Task 1** (Full Stack Development internship). Users can browse products, search and filter, add items to a cart, register and log in, place orders and view their order history.

**Live demo:** _add your deployed link here_

## Screenshots

| Home | Product | Cart |
|---|---|---|
| ![Home](docs/screenshots/home.png) | ![Product](docs/screenshots/product.png) | ![Cart](docs/screenshots/cart.png) |

## Features

- Product listing with search and category filter
- Product details page with stock status
- Shopping cart (add, remove, change quantity) that survives page reloads
- User registration and login with secure sessions
- Order processing: stock is checked and reduced in a single database transaction
- Order history for the logged-in user
- Responsive, mobile-first design with keyboard and screen-reader support

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | SQLite (`better-sqlite3`) |
| Auth | bcrypt password hashing, JWT in an httpOnly cookie |
| Security | helmet, express-rate-limit |
| Tests | Node's built-in test runner |

## Getting Started

**Requirements:** Node.js 18 or newer.

```bash
git clone https://github.com/Irfan-1512/CodeAlpha_EcommerceStore
cd CodeAlpha_EcommerceStore
npm install
```

Create a `.env` file (copy `.env.example`) and set a long random secret:

```
PORT=3000
JWT_SECRET=paste-a-long-random-string-here
NODE_ENV=development
DB_FILE=./moonmart.db
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Load the products (a one-time import from the free Fake Store API, which needs no key), then start the server:

```bash
npm run seed
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the server with auto-restart |
| `npm start` | Start the server |
| `npm run seed` | Import products into the database |
| `npm test` | Run the API tests |

## API

| Method | Route | Purpose | Login required |
|---|---|---|---|
| GET | `/api/products` | List products (`?q=` and `?category=`) | No |
| GET | `/api/products/:id` | Product details | No |
| POST | `/api/auth/register` | Create an account | No |
| POST | `/api/auth/login` | Log in | No |
| POST | `/api/auth/logout` | Log out | Yes |
| GET | `/api/auth/me` | Current user (or `null`) | No |
| POST | `/api/orders` | Place an order | Yes |
| GET | `/api/orders` | Your order history | Yes |

Prices are stored in cents. The server always recalculates totals from the database and ignores any price sent by the client.

## Project Structure

```
server/   Express app, routes, middleware, database, seed script
public/   HTML pages, CSS and browser JavaScript
test/     API tests
```

## Security

- Passwords hashed with bcrypt; hashes are never returned
- Session token in an httpOnly, SameSite cookie
- Parameterised SQL queries only
- Server-side validation on every route
- Rate limiting on login and registration
- Secure HTTP headers with helmet
- User text rendered with `textContent` to prevent XSS

## Author

Built by Irfan as part of the CodeAlpha Full Stack Development internship.
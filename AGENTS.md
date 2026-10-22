# MoonMart: AGENTS Document

**CodeAlpha Task 1: E-commerce Store** | Version 1.0 | Prepared for Irfan

This file tells any AI coding assistant how to work on MoonMart: what the project is, which rules to follow and what "done" means. Save it in the repository root as `AGENTS.md` and give it to the assistant at the start of every session.

## Project Summary

MoonMart is a simple e-commerce store built for CodeAlpha Task 1. Users browse products, add them to a cart, register and log in, and place orders. Repository name: `CodeAlpha_EcommerceStore`.

## Source Documents

Read these before writing code; they are the source of truth, and code must match them.

| Document | Covers |
| --- | --- |
| Guidelines | Scope, stack, folder structure, definition of done |
| PRD | Features, user stories, requirements |
| Design | Name, colours, typography, page layouts, accessibility |
| Architecture | Components, request flow, security design |
| Database | Tables, constraints, queries, seed plan |
| API | Endpoints, request and response shapes, status codes |

If a document is unclear or two documents disagree, ask before guessing.

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (no framework, no build step)
- **Backend:** Node.js 18+ with Express.js
- **Database:** SQLite through `better-sqlite3`
- **Auth:** bcrypt password hashing and a JWT in an httpOnly cookie
- **Security extras:** `helmet`, `express-rate-limit`, `cookie-parser`, `dotenv`

Do not add other dependencies without asking first.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run seed` | Import products from the Fake Store API into SQLite (**no key or auth required**) |
| `npm run dev` | Start the server with auto-restart (`node --watch`) |
| `npm start` | Start the server normally |
| `npm test` | Run the tests (Node's built-in test runner) |

## Folder Structure

```
CodeAlpha_EcommerceStore/
├── server/
│   ├── index.js
│   ├── db.js
│   ├── seed.js
│   ├── routes/ (auth.js, products.js, orders.js)
│   └── middleware/auth.js
├── public/
│   ├── index.html, product.html, cart.html, login.html, orders.html
│   ├── css/style.css
│   └── js/
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```

## Minimal-Code Rule (applies to every change)

Before writing code, check in this order and stop at the first "yes":

1. Does this need to exist at all?
2. Is it already in the codebase? Reuse it.
3. Does the standard library do it?
4. Does a native platform feature do it?
5. Does an already-installed dependency do it?
6. Can it be done in one line?
7. Only then write the minimum code needed.

This rule never overrides validation, error handling, security or accessibility. Those are always required.

## Coding Rules

- Use `const` and `let`, `async`/`await` and ES modules or CommonJS consistently (pick one and keep it).
- Keep files small and functions single-purpose; routes only handle HTTP, and database logic lives in `db.js` or small helpers.
- Comment the reason for non-obvious code, not what the code does.
- Use clear names; no abbreviations that need explaining.
- Return errors as `{ "error": "message" }` with the correct status code.

## Security Rules (never break these)

- Use bound parameters in every SQL query; never build SQL from strings.
- Hash passwords with bcrypt; never log, return or store plain passwords.
- Never trust client-sent prices or totals; recalculate from the database.
- Validate every request body, parameter and query on the server.
- Render user-supplied text with `textContent`, never `innerHTML`.
- Keep secrets in `.env`; commit only `.env.example`; never print secrets.
- Do not expose stack traces to the client.

## Accessibility and UI Rules

- Follow the colours, type sizes and layouts in the Design document.
- Use semantic HTML, labelled inputs, alt text and visible focus states.
- Every interactive element must work with the keyboard; touch targets are at least 44px.
- Layout is mobile-first and tested at 360px width.

## Working Agreement for the Assistant

- Work one stage or feature at a time; do not build ahead of the plan.
- Before each task, state which document sections it follows.
- Show the files you will change, then change only those.
- Do not rewrite working code or reformat unrelated files.
- After each task, say how to run and test it, and list what to check by hand.
- If something is ambiguous or out of scope (payments, admin panel, reviews), ask instead of inventing it.
- Suggest a free API from the public-apis list when one is needed, and state whether it needs no key, an API key or OAuth.

## Out of Scope

Real payments, admin dashboard, product reviews, wishlists, coupons, email notifications and shipping calculation.

## Definition of Done (per feature)

- [ ] Matches the PRD requirement and the API and Database documents
- [ ] Input validated and errors handled with clear messages
- [ ] No console errors; works on mobile and desktop
- [ ] Keyboard and screen-reader basics checked
- [ ] Tested by hand with the steps the assistant provided
- [ ] README updated if setup or behaviour changed

## Staged Build Order

Planning documents (done) then: implementation plan, project setup, frontend features, backend and auth, orders and integrations, testing, debugging, security audit, review, deployment, monitoring, final audit.

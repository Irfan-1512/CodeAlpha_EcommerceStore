require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://fakestoreapi.com'],
      },
    },
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/products', require('./routes/products'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));

// Unknown API routes return JSON, not HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler: never send stack traces to the client
app.use((err, req, res, next) => {
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: 'Invalid request' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`MoonMart running at http://localhost:${port}`));
}
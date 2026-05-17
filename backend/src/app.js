const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const reservationsRouter = require('./modules/reservations');
const productsRouter = require('./modules/products');
const categoriesRouter = require('./modules/categories');
const ordersRouter = require('./modules/orders');
const uploadsRouter = require('./modules/uploads');
const curriculumsRouter = require('./modules/curriculums');

const app = express();
const defaultAllowedOrigins = ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:4001'];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origem nao permitida pelo CORS'));
    }
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../../public-client/public/assets')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/reservations', reservationsRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/curriculums', curriculumsRouter);

module.exports = app;

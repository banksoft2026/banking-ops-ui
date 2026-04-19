import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, 'dist');

// Write runtime config from App Service Application Settings so the browser
// can read backend URLs without a rebuild.
const runtimeConfig = {
  USER_ADMIN_URL:      process.env.USER_ADMIN_URL      || 'http://localhost:8084',
  CBS_MAINTENANCE_URL: process.env.CBS_MAINTENANCE_URL || 'http://localhost:8080',
  ACCOUNT_MASTER_URL:  process.env.ACCOUNT_MASTER_URL  || 'http://localhost:8082',
  TXN_POSTING_URL:     process.env.TXN_POSTING_URL     || 'http://localhost:8083',
  CUSTOMER_ENTITY_URL: process.env.CUSTOMER_ENTITY_URL || 'http://localhost:8081',
};

fs.writeFileSync(
  path.join(DIST, 'config.js'),
  `window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig, null, 2)};`
);

const app = express();

// Hashed asset files are immutable — cache for one year
app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '1y', immutable: true }));

// config.js must never be cached so env-var changes take effect on next start
app.get('/config.js', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(DIST, 'config.js'));
});

// Everything else in dist (index.html, favicon, etc.)
app.use(express.static(DIST, { maxAge: 0 }));

// SPA fallback — all unknown routes serve index.html so React Router works
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

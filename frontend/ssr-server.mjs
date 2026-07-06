import express from 'express';
import { readFileSync, existsSync, symlinkSync } from 'fs';
import { createRequire } from 'module';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const DIST_CLIENT = path.resolve(__dirname, '../dist/client');
const DIST_SERVER = path.resolve(__dirname, '../dist/server');
const PORT = parseInt(process.env.SSR_PORT || '8120', 10);
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8112';

// Polyfill browser globals for SSR
global.window = global.window || {
  document: {
    documentElement: { style: {} },
    createElement: () => ({ setAttribute: () => {}, className: '', style: {} }),
    createTextNode: () => ({}),
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    body: { appendChild: () => {}, removeChild: () => {}, style: {} },
    cookie: '',
  },
  navigator: { userAgent: 'node' },
  location: { href: '', pathname: '/', search: '', hash: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
};

global.document = global.window.document;
Object.defineProperty(global, 'navigator', { value: global.window.navigator, writable: true, configurable: true });
global.location = global.window.location;
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;
// requestAnimationFrame globally for bundled react-helmet-async
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Import renderToString separately (Vite externalizes react-dom/server)
const { renderToString } = await import('react-dom/server');

// Ensure Node can resolve SSR bundle dependencies by adding the project root
// as a module search path
const searchPath = path.resolve(__dirname, 'node_modules');
// Create a symlink if it doesn't exist: dist/server/node_modules -> frontend/node_modules
const targetLink = path.resolve(__dirname, '../dist/server/node_modules');
if (!existsSync(targetLink)) {
  try {
    symlinkSync(searchPath, targetLink, 'dir');
    console.log(`[ssr] Created module symlink: ${targetLink}`);
  } catch (err) {
    // Symlink might already exist from a previous run
    if (err.code !== 'EEXIST') {
      console.error(`[ssr] Failed to create symlink: ${err.message}`);
    }
  }
}

// Read the client index.html template
const templatePath = path.resolve(DIST_CLIENT, 'index.html');
const template = readFileSync(templatePath, 'utf-8');

// Import the SSR render function
let ssrServer;
try {
  const serverEntry = path.resolve(DIST_SERVER, 'entry-server.js');
  ssrServer = await import(serverEntry);
  console.log(`[ssr] Loaded server entry from ${serverEntry}`);
} catch (err) {
  console.error(`[ssr] Failed to load server entry: ${err.message}`);
  ssrServer = null;
}

const app = express();

// Static files
app.use('/assets', express.static(path.resolve(DIST_CLIENT, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

// Static: screenshots directory
app.use('/screenshots', express.static(path.resolve(DIST_CLIENT, 'screenshots'), {
  maxAge: '1d',
}));

// Static: favicon, manifest, robots, sitemap
const staticFiles = ['favicon.svg', 'site.webmanifest', 'robots.txt', 'sitemap.xml'];
for (const file of staticFiles) {
  app.get(`/${file}`, (req, res) => {
    const filePath = path.resolve(DIST_CLIENT, file);
    if (existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      // Fallback: serve from frontend public
      const fallback = path.resolve(__dirname, 'public', file);
      if (existsSync(fallback)) {
        res.sendFile(fallback);
      } else {
        res.status(404).send('Not found');
      }
    }
  });
}

// API proxy to FastAPI
app.use('/api', async (req, res) => {
  const target = `${FASTAPI_URL}${req.originalUrl}`;
  try {
    const response = await fetch(target, {
      method: req.method,
      headers: { ...req.headers, host: undefined },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    res.status(response.status);
    for (const [key, val] of response.headers) {
      res.setHeader(key, val);
    }
    res.send(await response.text());
  } catch (err) {
    res.status(502).send('Bad Gateway');
  }
});

// WS proxy — handled by nginx directly in production, skip here
// SSR routes
function ssrRender(req, res) {
  const url = req.originalUrl;

  if (!ssrServer?.createApp) {
    // Fallback: serve static index.html
    res.send(template);
    return;
  }

  try {
    const url = req.originalUrl;
    const helmetContext = {};
    const appNode = ssrServer.createApp(url, helmetContext);
    const appHtml = renderToString(appNode);
    const { helmet } = helmetContext;

    // Debug: log what render returns
    console.log(`[ssr] Rendering ${url}:`);
    console.log(`[ssr]   helmet type: ${typeof helmet}`);
    console.log(`[ssr]   helmet.title: ${JSON.stringify(helmet?.title?.toString())}`);

    // Inject helmet tags into the template
    let fullHtml = template;
    if (helmet) {
      const titleStr = helmet.title?.toString();
      const metaStr = helmet.meta?.toString();
      if (titleStr) {
        fullHtml = fullHtml.replace('<title>100Bocas — App de Pedidos Colaborativos</title>', titleStr);
      }
      if (metaStr) {
        fullHtml = fullHtml.replace('</head>', `${metaStr}\n</head>`);
      }
    }

    // Replace the div#root placeholder with rendered HTML
    fullHtml = fullHtml.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );

    res.send(fullHtml);
  } catch (err) {
    console.error(`[ssr] Render error for ${url}:`, err);
    res.send(template); // fallback to client-side render
  }
}

app.get('/', ssrRender);
app.get('/app', ssrRender);
app.get(/^\/app(?:\/.*)?$/, ssrRender);
app.get('/admin', ssrRender);
app.get(/^\/admin(?:\/.*)?$/, ssrRender);

// Catch-all: serve client index.html
app.get(/^\/(?:assets\/.*)?$/, (req, res) => {
  res.send(template);
});

// Start
const server = createHttpServer(app);
server.listen(PORT, () => {
  console.log(`[ssr] SSR server running on http://localhost:${PORT}`);
});

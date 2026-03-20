import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSharePreviewResponse } from './server/sharePreviewRuntime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const DEFAULT_PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function hasFileExtension(urlPath) {
  return path.posix.extname(urlPath) !== '';
}

function writeResponse(res, statusCode, headers, body, method = 'GET') {
  res.writeHead(statusCode, headers);
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

async function tryReadFile(filePath) {
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) return null;
  return readFile(filePath);
}

async function serveStaticAsset(req, res, urlPath) {
  const normalizedPath = urlPath === '/' ? '/index.html' : urlPath;
  const assetPath = path.normalize(path.join(DIST_DIR, normalizedPath));

  if (!assetPath.startsWith(DIST_DIR)) {
    writeResponse(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden', req.method);
    return true;
  }

  try {
    const fileContents = await tryReadFile(assetPath);
    if (!fileContents) return false;

    writeResponse(
      res,
      200,
      {
        'Content-Type': getMimeType(assetPath),
      },
      fileContents,
      req.method,
    );
    return true;
  } catch {
    return false;
  }
}

async function serveSpaIndex(req, res) {
  const indexPath = path.join(DIST_DIR, 'index.html');
  const indexHtml = await readFile(indexPath);
  writeResponse(
    res,
    200,
    {
      'Content-Type': 'text/html; charset=utf-8',
    },
    indexHtml,
    req.method,
  );
}

async function handleSharePreview(req, res, pathname) {
  const match = pathname.match(/^\/share\/item(?:\/([^/]+))?\/?$/);
  if (!match) return false;

  const itemId = match[1] ? decodeURIComponent(match[1]) : '';
  const previewResponse = await createSharePreviewResponse({
    itemId,
    headers: req.headers,
  });

  writeResponse(
    res,
    previewResponse.statusCode,
    previewResponse.headers,
    previewResponse.body,
    req.method,
  );
  return true;
}

export function createServer() {
  return createHttpServer(async (req, res) => {
    try {
      const method = req.method || 'GET';
      if (method !== 'GET' && method !== 'HEAD') {
        writeResponse(
          res,
          405,
          { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' },
          'Method Not Allowed',
          method,
        );
        return;
      }

      const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = requestUrl.pathname;

      if (await handleSharePreview(req, res, pathname)) {
        return;
      }

      const servedStaticAsset = await serveStaticAsset(req, res, pathname);
      if (servedStaticAsset) {
        return;
      }

      if (hasFileExtension(pathname)) {
        writeResponse(
          res,
          404,
          { 'Content-Type': 'text/plain; charset=utf-8' },
          'Not Found',
          method,
        );
        return;
      }

      await serveSpaIndex(req, res);
    } catch (error) {
      console.error('[server] Unexpected error:', error);
      writeResponse(
        res,
        500,
        { 'Content-Type': 'text/plain; charset=utf-8' },
        'Internal Server Error',
        req.method || 'GET',
      );
    }
  });
}

if (process.argv[1] === __filename) {
  const server = createServer();
  server.listen(DEFAULT_PORT, () => {
    console.log(`[server] Listening on http://localhost:${DEFAULT_PORT}`);
  });
}

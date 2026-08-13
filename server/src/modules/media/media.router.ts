import https from 'https';
import http from 'http';
import { Router, Request, Response } from 'express';
import { logger } from '../../common/utils/logger';

const router = Router();

const ALLOWED_HOSTS = new Set(['images.unsplash.com', 'plus.unsplash.com']);

const PROXY_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
};

function fetchImage(url: string, res: Response, hops = 0): void {
  if (hops > 5) {
    if (!res.headersSent) res.status(502).end();
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    if (!res.headersSent) res.status(400).end();
    return;
  }

  const client = parsed.protocol === 'https:' ? https : http;

  const req = client.get(url, { headers: PROXY_HEADERS }, (upstream) => {
    const status = upstream.statusCode ?? 0;

    if (status >= 300 && status < 400 && upstream.headers.location) {
      upstream.resume();
      fetchImage(upstream.headers.location, res, hops + 1);
      return;
    }

    if (status < 200 || status >= 400) {
      upstream.resume();
      if (!res.headersSent) res.status(502).end();
      return;
    }

    res.setHeader('Content-Type', upstream.headers['content-type'] ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    upstream.pipe(res);
  });

  req.on('error', (err) => {
    logger.error('Image proxy error', { url, message: err.message });
    if (!res.headersSent) res.status(502).end();
  });

  req.setTimeout(15_000, () => {
    req.destroy();
    if (!res.headersSent) res.status(504).end();
  });
}

router.get('/proxy', (req: Request, res: Response): void => {
  const raw = req.query.url as string | undefined;

  if (!raw) {
    res.status(400).json({ error: { code: 'MISSING_URL', message: 'url param required' } });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    res.status(400).json({ error: { code: 'INVALID_URL', message: 'Invalid URL' } });
    return;
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    res.status(400).json({ error: { code: 'NOT_ALLOWED', message: 'URL host not allowed' } });
    return;
  }

  fetchImage(raw, res);
});

export { router as mediaRouter };

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { send, HttpError } from './http.js';
import { authRouter, sessionMiddleware } from './modules/auth.js';
import { catalogRouter, teamCatalogRouter } from './modules/catalog.js';
import { ordersRouter, teamOrdersRouter } from './modules/orders.js';
import { mediaRouter, imageDeliveryRouter } from './modules/media.js';

export function createApp({ db, config, limits = true, cloudStorage, imageFetch }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'https://tile.openstreetmap.org'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'upgrade-insecure-requests': config.production ? [] : null,
        },
      },
      strictTransportSecurity: config.production ? undefined : false,
    }),
  );
  app.use(express.json({ limit: '64kb' }), cookieParser());
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Custom header blocks cross-origin HTML forms even if Origin is omitted.
      if (req.get('X-Maison-Request') !== '1') return next(new HttpError(403, 'origin_denied'));
      const origins = new Set([config.origin]);
      if (!config.production) {
        origins.add('http://localhost:5173');
        origins.add('http://127.0.0.1:5173');
      }
      if (req.get('origin') && !origins.has(req.get('origin')))
        return next(new HttpError(403, 'origin_denied'));
      if (req.get('sec-fetch-site') === 'cross-site')
        return next(new HttpError(403, 'origin_denied'));
    }
    next();
  });
  const pass = (req, res, next) => next();
  const limiter = (limit, windowMs) =>
    limits
      ? rateLimit({
          windowMs,
          limit,
          standardHeaders: 'draft-8',
          legacyHeaders: false,
          handler: (req, res) => res.status(429).json({ success: false, error: 'rate_limited' }),
        })
      : pass;
  app.use('/api', limiter(300, 60 * 1000), sessionMiddleware(db));
  app.get('/api/v1/health', (req, res) =>
    send(res, {
      name: 'KelseTS Maison',
      mode: 'demo',
      database: db.kind === 'mongo' ? 'mongodb' : 'sqlite',
    }),
  );
  if (config.mediaStorage === 'cloudinary')
    app.use('/api/v1', imageDeliveryRouter(db, config, imageFetch));
  app.use('/api/v1/auth', authRouter(db, config, limiter(20, 15 * 60 * 1000)));
  app.use('/api/v1', catalogRouter(db), ordersRouter(db));
  app.use(
    '/api/v1/team',
    teamCatalogRouter(db, config),
    teamOrdersRouter(db),
    mediaRouter(config.uploadDir, { db, config, cloudStorage }),
  );
  app.use('/api', (req, res, next) => next(new HttpError(404, 'not_found')));
  if (!config.serverless)
    app.use(
      '/uploads',
      express.static(config.uploadDir, { dotfiles: 'deny', index: false, maxAge: '1d' }),
    );
  if (!config.serverless && existsSync(path.join(config.frontendDir, 'index.html'))) {
    app.use(express.static(config.frontendDir, { index: false }));
    app.get('/{*path}', (req, res, next) => {
      if (path.extname(req.path) || req.path.startsWith('/uploads/'))
        return next(new HttpError(404, 'not_found'));
      res.set('Cache-Control', 'no-cache').sendFile(path.join(config.frontendDir, 'index.html'));
    });
  }
  app.use((req, res, next) => next(new HttpError(404, 'not_found')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status =
      error.status ||
      (error.code === 'LIMIT_FILE_SIZE' ? 413 : error.name === 'MulterError' ? 400 : 500);
    const code =
      error instanceof HttpError
        ? error.code
        : status === 413
          ? 'file_too_large'
          : status === 400
            ? 'invalid_input'
            : 'server_error';
    if (status >= 500) console.error('Maison API:', error.message);
    res.status(status).json({ success: false, error: code });
  });
  return app;
}

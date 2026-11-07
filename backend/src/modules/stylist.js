import { Router } from 'express';
import { stylistSchema } from '@maison/contracts';
import { parse, send, HttpError } from '../http.js';
import { getLooks } from './catalog.js';
import { recommendLooks } from '../stylist/service.js';

export function stylistRouter(db, config, limiter, requestProvider) {
  const router = Router();
  router.get('/stylist/status', (req, res) =>
    send(res, {
      available: Boolean(config.stylist?.enabled),
      requiresAccount: true,
      providers: config.stylist?.enabled ? config.stylist.chain.map((item) => item.provider) : [],
    }),
  );
  router.post('/stylist', limiter, async (req, res) => {
    const preferences = parse(stylistSchema, req.body);
    if (preferences.mode === 'ai' && config.stylist?.enabled && !req.user)
      throw new HttpError(401, 'unauthorized');
    const controller = new AbortController();
    const disconnected = () => {
      if (!res.writableFinished) controller.abort();
    };
    res.on('close', disconnected);
    try {
      const result = await recommendLooks({
        db,
        config: config.stylist,
        getLooks: () => getLooks(db),
        preferences,
        requestProvider,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) send(res, result);
    } finally {
      res.removeListener('close', disconnected);
    }
  });
  return router;
}

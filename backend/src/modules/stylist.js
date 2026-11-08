import { chatRequestSchema, converseStylist } from '../stylist/conversation.js';
import { isStylistAvailable } from '../stylist/config.js';
import { Router } from 'express';
import { stylistSchema } from '@maison/contracts';
import { parse, send, HttpError } from '../http.js';
import { getLooks, allProducts } from './catalog.js';
import { recommendLooks } from '../stylist/service.js';

export function stylistRouter(db, config, limiter, requestProvider) {
  const router = Router();
  router.get('/stylist/status', (req, res) =>
    send(res, {
      available: isStylistAvailable(config.stylist),
      conversational: true,
      conversationVersion: 2,
      dailyActionLimit: config.stylist?.dailyLimit || 20,
      requiresAccount: config.stylist?.requireAccount !== false,
      providers: isStylistAvailable(config.stylist)
        ? config.stylist.chain.map((item) => item.provider)
        : [],
    }),
  );
  router.post('/stylist/chat', limiter, async (req, res) => {
    const input = parse(chatRequestSchema, req.body);
    if (isStylistAvailable(config.stylist) && config.stylist?.requireAccount !== false && !req.user)
      throw new HttpError(401, 'unauthorized');
    const controller = new AbortController();
    const close = () => {
      if (!res.writableFinished) controller.abort();
    };
    res.on('close', close);
    try {
      send(
        res,
        await converseStylist({
          db,
          config: config.stylist,
          getLooks: () => getLooks(db),
          getProducts: () => allProducts(db),
          input,
          signal: controller.signal,
          requestProvider,
        }),
      );
    } finally {
      res.removeListener('close', close);
    }
  });
  router.post('/stylist', limiter, async (req, res) => {
    const preferences = parse(stylistSchema, req.body);
    if (
      preferences.mode === 'ai' &&
      isStylistAvailable(config.stylist) &&
      config.stylist?.requireAccount !== false &&
      !req.user
    )
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
        getProducts: () => allProducts(db),
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

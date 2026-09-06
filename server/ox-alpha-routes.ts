import type { Express, Request, Response } from 'express';
import { distillWithOxAlpha } from './ox-alpha';

function fail(res: Response, error: unknown, status = 400) {
  return res.status(status).json({
    status: 'error',
    error: error instanceof Error ? error.message : String(error),
  });
}

export function registerOxAlphaRoutes(app: Express) {
  app.post('/api/knowledge/ox-alpha/distill', async (req: Request, res: Response) => {
    try {
      const { content, source, instruction } = req.body || {};
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('content is required');
      }

      const result = await distillWithOxAlpha({ content, source, instruction });
      return res.json({ status: 'ok', data: result });
    } catch (error) {
      return fail(res, error, 502);
    }
  });
}

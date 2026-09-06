import type { Express, Request, Response } from 'express';
import { listClaudeExports, listObsidianNotes, readKnowledgeAdapterItem } from './knowledge-adapters';

function fail(res: Response, error: unknown, status = 400) {
  return res.status(status).json({ status: 'error', error: error instanceof Error ? error.message : String(error) });
}

export function registerKnowledgeAdapterRoutes(app: Express) {
  app.get('/api/knowledge/adapters/obsidian/items', async (_req: Request, res: Response) => {
    try { return res.json({ status: 'ok', data: await listObsidianNotes() }); }
    catch (error) { return fail(res, error, 503); }
  });

  app.get('/api/knowledge/adapters/claude/items', async (_req: Request, res: Response) => {
    try { return res.json({ status: 'ok', data: await listClaudeExports() }); }
    catch (error) { return fail(res, error, 503); }
  });

  app.get('/api/knowledge/adapters/:sourceType/item', async (req: Request, res: Response) => {
    try {
      const sourceType = String(req.params.sourceType).toUpperCase();
      if (sourceType !== 'OBSIDIAN' && sourceType !== 'CLAUDE') throw new Error('sourceType must be OBSIDIAN or CLAUDE');
      const relativePath = String(req.query.path || '');
      if (!relativePath) throw new Error('path is required');
      return res.json({ status: 'ok', data: await readKnowledgeAdapterItem(sourceType, relativePath) });
    } catch (error) { return fail(res, error, 404); }
  });
}

import type { Express, Request, Response } from 'express';
import { globalStore } from './store';
import { ingestKnowledgeAtomic, getKnowledgeStats, listKnowledgeSources } from './knowledge';
import { distillWithOxAlpha } from './ox-alpha';
import {
  assertApprovedManifest,
  approveKnowledgeTransaction,
  createKnowledgeTransaction,
  dryRunKnowledgeTransaction,
  getKnowledgeTransaction,
  listKnowledgeTransactions,
  markKnowledgeTransactionIngested,
  rejectKnowledgeTransaction,
} from './knowledge-transactions';
import type { KnowledgeSourceType } from './knowledge-transactions';

function ok(res: Response, data: unknown) { return res.json({ status: 'ok', data }); }
function fail(res: Response, error: unknown, status = 400) {
  return res.status(status).json({ status: 'error', error: error instanceof Error ? error.message : String(error) });
}
function sourceType(value: unknown): KnowledgeSourceType {
  if (value === 'OBSIDIAN' || value === 'CLAUDE' || value === 'MANUAL') return value;
  throw new Error('sourceType must be OBSIDIAN, CLAUDE, or MANUAL');
}

export function registerKnowledgeRoutes(app: Express) {
  app.post('/api/knowledge/transactions', (req: Request, res: Response) => {
    try {
      const { sourceId, sourceName, sourceType: rawSourceType, items } = req.body || {};
      const transaction = createKnowledgeTransaction({ sourceId, sourceName, sourceType: sourceType(rawSourceType), items: Array.isArray(items) ? items : [] });
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-DISCOVERED`, name: 'KnowledgeTransactionDiscovered', type: 'MEMORY_COMMITTED', timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-transaction', name: 'Factory Knowledge Transaction Kernel', role: 'SYSTEM' }, executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId, causation: 'KNOWLEDGE_SOURCE_DISCOVERY', correlation: transaction.sourceId,
        provenance: { source: `${transaction.sourceType}:${transaction.sourceName}`, confidence: 100, chain: ['Discovery', 'Manifest', 'SHA-256 Identity'] },
        payload: { transactionId: transaction.transactionId, manifestHash: transaction.manifestHash, itemCount: transaction.manifest.length },
      });
      return ok(res, transaction);
    } catch (error) { return fail(res, error); }
  });

  app.get('/api/knowledge/transactions', (_req: Request, res: Response) => ok(res, listKnowledgeTransactions()));

  app.get('/api/knowledge/transactions/:id', (req: Request, res: Response) => {
    try { return ok(res, getKnowledgeTransaction(req.params.id)); }
    catch (error) { return fail(res, error, 404); }
  });

  app.post('/api/knowledge/transactions/:id/dry-run', (req: Request, res: Response) => {
    try {
      const transaction = dryRunKnowledgeTransaction(req.params.id);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-DRY-RUN`, name: 'KnowledgeTransactionDryRunCompleted', type: 'MEMORY_COMMITTED', timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-review', name: 'Factory Knowledge Review Kernel', role: 'SYSTEM' }, executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId, causation: 'KNOWLEDGE_DRY_RUN', correlation: transaction.sourceId,
        provenance: { source: 'Factory Knowledge Transaction Kernel', confidence: 100, chain: ['Manifest', 'DryRun', 'ReviewRequired'] },
        payload: { transactionId: transaction.transactionId, manifestHash: transaction.manifestHash },
      });
      return ok(res, transaction);
    } catch (error) { return fail(res, error); }
  });

  app.post('/api/knowledge/transactions/:id/approve', (req: Request, res: Response) => {
    try {
      const { approvalId, manifestHash } = req.body || {};
      const transaction = approveKnowledgeTransaction(req.params.id, approvalId, manifestHash);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-APPROVED`, name: 'KnowledgeTransactionApproved', type: 'HUMAN_APPROVAL', timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-approver', name: 'Factory Knowledge Approver', role: 'OPERATOR' }, executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId, causation: 'KNOWLEDGE_REVIEW_APPROVED', correlation: transaction.sourceId,
        provenance: { source: 'Knowledge Transaction Approval', confidence: 100, chain: ['DryRun', 'ManifestHashVerified', 'HumanApproval'] },
        payload: { transactionId: transaction.transactionId, approvalId: transaction.approvalId, manifestHash: transaction.manifestHash },
      });
      return ok(res, transaction);
    } catch (error) { return fail(res, error); }
  });

  app.post('/api/knowledge/transactions/:id/reject', (req: Request, res: Response) => {
    try {
      const reason = String(req.body?.reason || 'Rejected by operator');
      const transaction = rejectKnowledgeTransaction(req.params.id, reason);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-REJECTED`, name: 'KnowledgeTransactionRejected', type: 'HUMAN_APPROVAL', timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-review', name: 'Factory Knowledge Reviewer', role: 'OPERATOR' }, executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId, causation: 'KNOWLEDGE_REVIEW_REJECTED', correlation: transaction.sourceId,
        provenance: { source: 'Knowledge Transaction Review', confidence: 100, chain: ['ReviewRequired', 'HumanRejection'] },
        payload: { transactionId: transaction.transactionId, reason },
      });
      return ok(res, transaction);
    } catch (error) { return fail(res, error); }
  });

  app.post('/api/knowledge/transactions/:id/ingest', async (req: Request, res: Response) => {
    try {
      const transaction = getKnowledgeTransaction(req.params.id);
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const useOxAlpha = req.body?.processor === 'OX_ALPHA';
      assertApprovedManifest(req.params.id, items);

      const current = transaction.manifest.map((manifestItem) => {
        const item = items.find((candidate: { itemId: string }) => candidate.itemId === manifestItem.itemId);
        if (!item) throw new Error(`Approved item missing at ingestion: ${manifestItem.itemId}`);
        return { manifestItem, content: String(item.content || '') };
      });

      const processed = useOxAlpha
        ? await Promise.all(current.map(async ({ manifestItem, content }) => {
            const result = await distillWithOxAlpha({
              content,
              source: `${transaction.sourceType}:${transaction.sourceName}${manifestItem.path ? `:${manifestItem.path}` : ''}`,
            });
            return { manifestItem, content: result.content };
          }))
        : current;

      const requests = processed.map((item) => ({
        sourceType: transaction.sourceType,
        sourceName: transaction.sourceName,
        path: item.manifestItem.path,
        content: item.content,
        documentId: item.manifestItem.itemId,
        memoryType: useOxAlpha ? 'DISTILLED_KNOWLEDGE' as const : undefined,
        confidence: useOxAlpha ? 85 : undefined,
        tags: useOxAlpha ? ['ox-alpha'] : undefined,
        metadata: {
          transactionId: transaction.transactionId,
          manifestHash: transaction.manifestHash,
          approvalId: transaction.approvalId,
          version: item.manifestItem.version,
          ...(useOxAlpha ? { processor: 'OX_ALPHA' } : {}),
        },
      }));

      const results = ingestKnowledgeAtomic(requests, globalStore.memory, (event) => globalStore.appendEvent(event));
      const completed = markKnowledgeTransactionIngested(req.params.id);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-TRANSACTION-INGESTED`, name: 'KnowledgeTransactionIngested', type: 'MEMORY_COMMITTED', timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-ingest', name: 'Factory Knowledge Ingestion Kernel', role: 'SYSTEM' }, executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: completed.transactionId, causation: 'KNOWLEDGE_APPROVAL_VERIFIED', correlation: completed.sourceId,
        provenance: { source: 'Factory Knowledge Transaction Kernel', confidence: 100, chain: ['ApprovedManifest', 'DriftCheck', ...(useOxAlpha ? ['OxAlphaDistillation'] : []), 'KnowledgeIngestion', 'TransactionComplete'] },
        payload: { transactionId: completed.transactionId, approvalId: completed.approvalId, manifestHash: completed.manifestHash, items: completed.manifest.length, processor: useOxAlpha ? 'OX_ALPHA' : null },
      });
      return ok(res, { transaction: completed, results, processor: useOxAlpha ? 'OX_ALPHA' : null });
    } catch (error) { return fail(res, error); }
  });

  app.get('/api/knowledge/sources', (_req: Request, res: Response) => ok(res, listKnowledgeSources()));
  app.get('/api/knowledge/stats', (_req: Request, res: Response) => ok(res, getKnowledgeStats(globalStore.memory)));
}

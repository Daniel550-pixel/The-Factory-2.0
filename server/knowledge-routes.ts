import type { Express, Request, Response } from 'express';
import { globalStore } from './store';
import { ingestKnowledge, getKnowledgeStats, listKnowledgeSources } from './knowledge';
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

function ok(res: Response, data: unknown) {
  return res.json({ status: 'ok', data });
}

function fail(res: Response, error: unknown, status = 400) {
  return res.status(status).json({
    status: 'error',
    error: error instanceof Error ? error.message : String(error),
  });
}

function sourceType(value: unknown): KnowledgeSourceType {
  if (value === 'OBSIDIAN' || value === 'CLAUDE' || value === 'MANUAL') return value;
  throw new Error('sourceType must be OBSIDIAN, CLAUDE, or MANUAL');
}

export function registerKnowledgeRoutes(app: Express) {
  // Discovery + manifest creation. This never writes Factory Memory.
  app.post('/api/knowledge/transactions', (req: Request, res: Response) => {
    try {
      const { sourceId, sourceName, sourceType: rawSourceType, items } = req.body || {};
      const transaction = createKnowledgeTransaction({
        sourceId,
        sourceName,
        sourceType: sourceType(rawSourceType),
        items: Array.isArray(items) ? items : [],
      });

      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-DISCOVERED`,
        name: 'KnowledgeTransactionDiscovered',
        type: 'MEMORY_COMMITTED',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-transaction', name: 'Factory Knowledge Transaction Kernel', role: 'SYSTEM' },
        executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId,
        causation: 'KNOWLEDGE_SOURCE_DISCOVERY',
        correlation: transaction.sourceId,
        provenance: {
          source: `${transaction.sourceType}:${transaction.sourceName}`,
          confidence: 100,
          chain: ['Discovery', 'Manifest', 'SHA-256 Identity'],
        },
        payload: {
          transactionId: transaction.transactionId,
          manifestHash: transaction.manifestHash,
          itemCount: transaction.manifest.length,
        },
      });

      return ok(res, transaction);
    } catch (error) {
      return fail(res, error);
    }
  });

  app.get('/api/knowledge/transactions', (_req: Request, res: Response) =>
    ok(res, listKnowledgeTransactions())
  );

  app.get('/api/knowledge/transactions/:id', (req: Request, res: Response) => {
    try {
      return ok(res, getKnowledgeTransaction(req.params.id));
    } catch (error) {
      return fail(res, error, 404);
    }
  });

  // Dry-run is mandatory before approval.
  app.post('/api/knowledge/transactions/:id/dry-run', (req: Request, res: Response) => {
    try {
      const transaction = dryRunKnowledgeTransaction(req.params.id);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-DRY-RUN`,
        name: 'KnowledgeTransactionDryRunCompleted',
        type: 'MEMORY_COMMITTED',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-review', name: 'Factory Knowledge Review Kernel', role: 'SYSTEM' },
        executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId,
        causation: 'KNOWLEDGE_DRY_RUN',
        correlation: transaction.sourceId,
        provenance: {
          source: 'Factory Knowledge Transaction Kernel',
          confidence: 100,
          chain: ['Manifest', 'DryRun', 'ReviewRequired'],
        },
        payload: { transactionId: transaction.transactionId, manifestHash: transaction.manifestHash },
      });
      return ok(res, transaction);
    } catch (error) {
      return fail(res, error);
    }
  });

  // Approval is bound to the exact manifest hash reviewed by the operator.
  app.post('/api/knowledge/transactions/:id/approve', (req: Request, res: Response) => {
    try {
      const { approvalId, manifestHash } = req.body || {};
      const transaction = approveKnowledgeTransaction(req.params.id, approvalId, manifestHash);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-APPROVED`,
        name: 'KnowledgeTransactionApproved',
        type: 'HUMAN_APPROVAL',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-approver', name: 'Factory Knowledge Approver', role: 'OPERATOR' },
        executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId,
        causation: 'KNOWLEDGE_REVIEW_APPROVED',
        correlation: transaction.sourceId,
        provenance: {
          source: 'Knowledge Transaction Approval',
          confidence: 100,
          chain: ['DryRun', 'ManifestHashVerified', 'HumanApproval'],
        },
        payload: {
          transactionId: transaction.transactionId,
          approvalId: transaction.approvalId,
          manifestHash: transaction.manifestHash,
        },
      });
      return ok(res, transaction);
    } catch (error) {
      return fail(res, error);
    }
  });

  app.post('/api/knowledge/transactions/:id/reject', (req: Request, res: Response) => {
    try {
      const reason = String(req.body?.reason || 'Rejected by operator');
      const transaction = rejectKnowledgeTransaction(req.params.id, reason);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-REJECTED`,
        name: 'KnowledgeTransactionRejected',
        type: 'HUMAN_APPROVAL',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-review', name: 'Factory Knowledge Reviewer', role: 'OPERATOR' },
        executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: transaction.transactionId,
        causation: 'KNOWLEDGE_REVIEW_REJECTED',
        correlation: transaction.sourceId,
        provenance: {
          source: 'Knowledge Transaction Review',
          confidence: 100,
          chain: ['ReviewRequired', 'HumanRejection'],
        },
        payload: { transactionId: transaction.transactionId, reason },
      });
      return ok(res, transaction);
    } catch (error) {
      return fail(res, error);
    }
  });

  // Ingestion requires the approved manifest and the exact current source payload.
  // A changed/missing item fails closed and never writes partial memory.
  app.post('/api/knowledge/transactions/:id/ingest', (req: Request, res: Response) => {
    try {
      const transaction = getKnowledgeTransaction(req.params.id);
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      assertApprovedManifest(req.params.id, items);

      const results = transaction.manifest.map((manifestItem) => {
        const current = items.find((item: { itemId: string }) => item.itemId === manifestItem.itemId);
        if (!current) throw new Error(`Approved item missing at ingestion: ${manifestItem.itemId}`);

        return ingestKnowledge(
          {
            sourceType: transaction.sourceType,
            sourceName: transaction.sourceName,
            path: manifestItem.path,
            content: current.content,
            documentId: manifestItem.itemId,
            metadata: {
              transactionId: transaction.transactionId,
              manifestHash: transaction.manifestHash,
              approvalId: transaction.approvalId,
              version: manifestItem.version,
            },
          },
          globalStore.memory,
          (event) => globalStore.appendEvent(event),
        );
      });

      const completed = markKnowledgeTransactionIngested(req.params.id);
      globalStore.appendEvent({
        id: `EVT-${Date.now()}-KNOWLEDGE-TRANSACTION-INGESTED`,
        name: 'KnowledgeTransactionIngested',
        type: 'MEMORY_COMMITTED',
        timestamp: new Date().toISOString(),
        actor: { id: 'act-knowledge-ingest', name: 'Factory Knowledge Ingestion Kernel', role: 'SYSTEM' },
        executionId: 'EX-KNOWLEDGE-TRANSACTION',
        traceId: completed.transactionId,
        causation: 'KNOWLEDGE_APPROVAL_VERIFIED',
        correlation: completed.sourceId,
        provenance: {
          source: 'Factory Knowledge Transaction Kernel',
          confidence: 100,
          chain: ['ApprovedManifest', 'DriftCheck', 'KnowledgeIngestion', 'TransactionComplete'],
        },
        payload: {
          transactionId: completed.transactionId,
          approvalId: completed.approvalId,
          manifestHash: completed.manifestHash,
          items: completed.manifest.length,
        },
      });

      return ok(res, { transaction: completed, results });
    } catch (error) {
      return fail(res, error);
    }
  });

  app.get('/api/knowledge/sources', (_req: Request, res: Response) =>
    ok(res, listKnowledgeSources())
  );

  app.get('/api/knowledge/stats', (_req: Request, res: Response) =>
    ok(res, getKnowledgeStats(globalStore.memory))
  );
}

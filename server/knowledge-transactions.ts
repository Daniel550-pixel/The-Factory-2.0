import crypto from 'node:crypto';

export type KnowledgeTransactionState =
  | 'DISCOVERED'
  | 'MANIFESTED'
  | 'DRY_RUN'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'INGESTED'
  | 'REJECTED'
  | 'FAILED';

export type KnowledgeSourceType = 'OBSIDIAN' | 'CLAUDE' | 'MANUAL';

export interface KnowledgeManifestItem {
  itemId: string;
  sourceId: string;
  sourceType: KnowledgeSourceType;
  sourceName: string;
  path?: string;
  contentHash: string;
  byteLength: number;
  version: number;
  discoveredAt: string;
  state: KnowledgeTransactionState;
  approvedHash?: string;
  ingestedAt?: string;
  rejectionReason?: string;
}

export interface KnowledgeTransaction {
  transactionId: string;
  sourceId: string;
  sourceType: KnowledgeSourceType;
  sourceName: string;
  createdAt: string;
  state: KnowledgeTransactionState;
  manifest: KnowledgeManifestItem[];
  manifestHash: string;
  approvalId?: string;
  approvedAt?: string;
  completedAt?: string;
  error?: string;
}

const transactions = new Map<string, KnowledgeTransaction>();
const latestByItem = new Map<string, KnowledgeManifestItem>();

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function stableManifestHash(items: KnowledgeManifestItem[]): string {
  const canonical = items
    .map((item) => ({
      itemId: item.itemId,
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      path: item.path || null,
      contentHash: item.contentHash,
      byteLength: item.byteLength,
      version: item.version,
    }))
    .sort((a, b) => a.itemId.localeCompare(b.itemId));

  return sha256(JSON.stringify(canonical));
}

export function createKnowledgeTransaction(input: {
  sourceId: string;
  sourceType: KnowledgeSourceType;
  sourceName: string;
  items: Array<{
    itemId?: string;
    path?: string;
    content: string;
  }>;
}): KnowledgeTransaction {
  if (!input.sourceId.trim()) throw new Error('sourceId is required');
  if (!input.sourceName.trim()) throw new Error('sourceName is required');
  if (!input.items.length) throw new Error('At least one knowledge item is required');

  const transactionId = `KTX-${Date.now().toString(36)}-${sha256(input.sourceId).slice(0, 8)}`;
  const now = new Date().toISOString();

  const manifest = input.items.map((item, index) => {
    const contentHash = sha256(item.content);
    const itemId = item.itemId || `${input.sourceId}:${item.path || index}`;
    const previous = latestByItem.get(itemId);
    const version = previous && previous.contentHash === contentHash ? previous.version : (previous?.version || 0) + 1;

    const manifestItem: KnowledgeManifestItem = {
      itemId,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      sourceName: input.sourceName,
      path: item.path,
      contentHash,
      byteLength: Buffer.byteLength(item.content, 'utf8'),
      version,
      discoveredAt: now,
      state: 'DISCOVERED',
    };

    latestByItem.set(itemId, manifestItem);
    return manifestItem;
  });

  const transaction: KnowledgeTransaction = {
    transactionId,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
    sourceName: input.sourceName,
    createdAt: now,
    state: 'MANIFESTED',
    manifest,
    manifestHash: stableManifestHash(manifest),
  };

  transactions.set(transactionId, transaction);
  return transaction;
}

export function dryRunKnowledgeTransaction(transactionId: string): KnowledgeTransaction {
  const transaction = getKnowledgeTransaction(transactionId);
  if (!['MANIFESTED', 'DRY_RUN', 'REVIEW_REQUIRED'].includes(transaction.state)) {
    throw new Error(`Transaction ${transactionId} cannot be dry-run from state ${transaction.state}`);
  }

  transaction.manifest = transaction.manifest.map((item) => ({
    ...item,
    state: 'DRY_RUN',
  }));
  transaction.state = 'REVIEW_REQUIRED';
  return transaction;
}

export function approveKnowledgeTransaction(transactionId: string, approvalId: string, expectedManifestHash: string): KnowledgeTransaction {
  const transaction = getKnowledgeTransaction(transactionId);
  if (transaction.state !== 'REVIEW_REQUIRED') {
    throw new Error(`Transaction ${transactionId} requires a completed dry-run before approval`);
  }
  if (!approvalId.trim()) throw new Error('approvalId is required');
  if (expectedManifestHash !== transaction.manifestHash) {
    throw new Error('Manifest hash mismatch: approval target is stale');
  }

  transaction.manifest = transaction.manifest.map((item) => ({
    ...item,
    state: 'APPROVED',
    approvedHash: item.contentHash,
  }));
  transaction.state = 'APPROVED';
  transaction.approvalId = approvalId;
  transaction.approvedAt = new Date().toISOString();
  return transaction;
}

export function assertApprovedManifest(transactionId: string, currentItems: Array<{ itemId: string; content: string }>): KnowledgeTransaction {
  const transaction = getKnowledgeTransaction(transactionId);
  if (transaction.state !== 'APPROVED') {
    throw new Error(`Transaction ${transactionId} is not approved`);
  }

  const currentById = new Map(currentItems.map((item) => [item.itemId, item]));
  for (const manifestItem of transaction.manifest) {
    const current = currentById.get(manifestItem.itemId);
    if (!current) {
      throw new Error(`Drift detected: approved item is missing: ${manifestItem.itemId}`);
    }
    const currentHash = sha256(current.content);
    if (currentHash !== manifestItem.approvedHash) {
      throw new Error(`Drift detected: approved item changed: ${manifestItem.itemId}`);
    }
  }

  return transaction;
}

export function markKnowledgeTransactionIngested(transactionId: string): KnowledgeTransaction {
  const transaction = getKnowledgeTransaction(transactionId);
  if (transaction.state !== 'APPROVED') {
    throw new Error(`Transaction ${transactionId} cannot be ingested from state ${transaction.state}`);
  }

  const now = new Date().toISOString();
  transaction.manifest = transaction.manifest.map((item) => ({
    ...item,
    state: 'INGESTED',
    ingestedAt: now,
  }));
  transaction.state = 'INGESTED';
  transaction.completedAt = now;
  return transaction;
}

export function rejectKnowledgeTransaction(transactionId: string, reason: string): KnowledgeTransaction {
  const transaction = getKnowledgeTransaction(transactionId);
  transaction.manifest = transaction.manifest.map((item) => ({
    ...item,
    state: 'REJECTED',
    rejectionReason: reason,
  }));
  transaction.state = 'REJECTED';
  transaction.error = reason;
  return transaction;
}

export function getKnowledgeTransaction(transactionId: string): KnowledgeTransaction {
  const transaction = transactions.get(transactionId);
  if (!transaction) throw new Error(`Knowledge transaction not found: ${transactionId}`);
  return transaction;
}

export function listKnowledgeTransactions(): KnowledgeTransaction[] {
  return Array.from(transactions.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

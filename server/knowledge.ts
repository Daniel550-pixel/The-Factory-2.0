import crypto from 'node:crypto';
import type { MemoryRecord, MemoryType } from '../src/types';

export type KnowledgeSourceType = 'OBSIDIAN' | 'CLAUDE' | 'MANUAL';

export interface KnowledgeSource {
  id: string;
  type: KnowledgeSourceType;
  name: string;
  path?: string;
  status: 'CONNECTED' | 'INGESTING' | 'READY' | 'ERROR';
  documents: number;
  chunks: number;
  lastIngested?: string;
  lastHash?: string;
  error?: string;
}

export interface KnowledgeIngestRequest {
  sourceType: KnowledgeSourceType;
  sourceName: string;
  path?: string;
  content: string;
  documentId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface KnowledgeIngestResult {
  source: KnowledgeSource;
  documentId: string;
  contentHash: string;
  chunksCreated: number;
  memoryIds: string[];
}

const sources = new Map<string, KnowledgeSource>();
const documentHashes = new Map<string, string>();

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function chunkMarkdown(content: string, maxChars = 2400): string[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const sections = normalized.split(/\n(?=#{1,6}\s)/g);
  const chunks: string[] = [];
  let current = '';

  for (const section of sections) {
    if (!current) {
      current = section;
    } else if ((current + '\n\n' + section).length <= maxChars) {
      current += '\n\n' + section;
    } else {
      chunks.push(current.trim());
      current = section;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChars) {
      finalChunks.push(chunk);
      continue;
    }
    for (let i = 0; i < chunk.length; i += maxChars) {
      finalChunks.push(chunk.slice(i, i + maxChars).trim());
    }
  }
  return finalChunks.filter(Boolean);
}

export function ingestKnowledge(
  request: KnowledgeIngestRequest,
  memory: Map<string, MemoryRecord>,
  appendEvent: (event: any) => any,
): KnowledgeIngestResult {
  if (!request.content?.trim()) throw new Error('Knowledge content is empty');
  if (!request.sourceName?.trim()) throw new Error('sourceName is required');

  const sourceId = `knowledge-${request.sourceType.toLowerCase()}-${sha256(request.sourceName).slice(0, 10)}`;
  const documentId = request.documentId || `doc-${sha256((request.path || request.sourceName) + request.content).slice(0, 16)}`;
  const contentHash = sha256(request.content);
  const existingHash = documentHashes.get(documentId);

  let source = sources.get(sourceId);
  if (!source) {
    source = {
      id: sourceId,
      type: request.sourceType,
      name: request.sourceName,
      path: request.path,
      status: 'INGESTING',
      documents: 0,
      chunks: 0,
    };
    sources.set(sourceId, source);
  }
  source.status = 'INGESTING';

  if (existingHash === contentHash) {
    source.status = 'READY';
    source.lastIngested = new Date().toISOString();
    source.lastHash = contentHash;
    return { source, documentId, contentHash, chunksCreated: 0, memoryIds: [] };
  }

  const chunks = chunkMarkdown(request.content);
  const memoryIds: string[] = [];
  const baseTags = [
    'knowledge',
    request.sourceType.toLowerCase(),
    ...(request.tags || []),
  ];

  chunks.forEach((chunk, index) => {
    const memoryId = `kmem-${sha256(`${documentId}:${contentHash}:${index}`).slice(0, 20)}`;
    const type: MemoryType = request.sourceType === 'CLAUDE' ? 'DISTILLED_KNOWLEDGE' : 'RAW_OBSERVATION';
    const record: MemoryRecord = {
      id: memoryId,
      type,
      content: chunk,
      source: `${request.sourceName}${request.path ? `:${request.path}` : ''}`,
      provenance: {
        sourceId: documentId,
        traceId: `knowledge-ingest-${contentHash.slice(0, 12)}`,
        chain: [
          request.sourceType,
          'Document Ingestion',
          'SHA-256 Content Identity',
          'Markdown Chunking',
          type,
        ],
      },
      timestamp: new Date().toISOString(),
      confidence: request.sourceType === 'CLAUDE' ? 85 : 95,
      relevance: 100,
      tags: [...baseTags, `document:${documentId}`, `chunk:${index + 1}/${chunks.length}`],
    };
    memory.set(memoryId, record);
    memoryIds.push(memoryId);
  });

  documentHashes.set(documentId, contentHash);
  source.documents += 1;
  source.chunks += chunks.length;
  source.status = 'READY';
  source.lastIngested = new Date().toISOString();
  source.lastHash = contentHash;
  source.error = undefined;

  appendEvent({
    id: `EVT-${Date.now()}-KNOWLEDGE-INGEST`,
    name: 'KnowledgeSourceIngested',
    type: 'MEMORY_COMMITTED',
    timestamp: new Date().toISOString(),
    actor: { id: 'act-knowledge-ingest', name: 'Factory Knowledge Ingestion Kernel', role: 'SYSTEM' },
    executionId: 'EX-KNOWLEDGE-INGEST',
    traceId: `knowledge-ingest-${contentHash.slice(0, 12)}`,
    causation: 'KNOWLEDGE_SOURCE_SUBMITTED',
    correlation: sourceId,
    provenance: {
      source: `${request.sourceType}:${request.sourceName}`,
      confidence: 100,
      chain: ['Source', 'ContentHash', 'Chunking', 'MemoryCommit'],
    },
    payload: {
      sourceId,
      documentId,
      contentHash,
      chunksCreated: chunks.length,
      path: request.path,
      metadata: request.metadata || {},
    },
  });

  return { source, documentId, contentHash, chunksCreated: chunks.length, memoryIds };
}

export function listKnowledgeSources(): KnowledgeSource[] {
  return Array.from(sources.values()).sort((a, b) =>
    (b.lastIngested || '').localeCompare(a.lastIngested || '')
  );
}

export function getKnowledgeStats(memory: Map<string, MemoryRecord>) {
  const records = Array.from(memory.values()).filter((m) => m.tags.includes('knowledge'));
  return {
    sources: sources.size,
    documents: Array.from(sources.values()).reduce((sum, s) => sum + s.documents, 0),
    chunks: records.length,
    obsidianRecords: records.filter((m) => m.tags.includes('obsidian')).length,
    claudeRecords: records.filter((m) => m.tags.includes('claude')).length,
    lastIngested: listKnowledgeSources()[0]?.lastIngested || null,
  };
}

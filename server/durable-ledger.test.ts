import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DurableEventLedger } from './durable-ledger';
import type { CanonicalEvent } from '../src/types';

function makeEvent(): CanonicalEvent {
  return {
    id: 'ledger-test-event',
    name: 'ledger.test',
    type: 'EXECUTION_COMPLETED',
    timestamp: '2026-01-01T00:00:00.000Z',
    actor: { id: 'system-test', name: 'System Test', role: 'SYSTEM' },
    executionId: 'ledger-test-execution',
    traceId: 'ledger-test-trace',
    causation: 'ledger-test-causation',
    correlation: 'ledger-test-correlation',
    provenance: { source: 'durable-ledger.test', confidence: 100, chain: ['test'] },
    previousEventHash: 'IGNORED',
    currentEventHash: 'IGNORED',
    payload: { ok: true },
    integrityStatus: 'VALID',
  };
}

describe('DurableEventLedger', () => {
  it('rejects malformed event hashes without throwing from verify', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'the-factory-ledger-'));
    const filePath = path.join(directory, 'ledger.jsonl');

    try {
      const ledger = new DurableEventLedger(filePath);
      const committed = await ledger.append(makeEvent());
      const raw = await readFile(filePath, 'utf8');
      const malformed = JSON.parse(raw.trim()) as CanonicalEvent;
      malformed.currentEventHash = 'not-a-valid-sha256-hash';
      await writeFile(filePath, `${JSON.stringify(malformed)}\n`, 'utf8');

      const result = await ledger.verify();
      expect(result.valid).toBe(false);
      expect(result.failureIndex).toBe(0);
      expect(result.reason).toBe('EVENT_HASH_MISMATCH');
      expect(committed.currentEventHash).toHaveLength(64);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

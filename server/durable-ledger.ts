import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { CanonicalEvent } from '../src/types';
import { calculateEventHash } from './kernel';

export interface LedgerIntegrityResult {
  valid: boolean;
  eventCount: number;
  lastSequence: number;
  failureIndex?: number;
  reason?: string;
}

/** Append-only JSONL ledger. Verification never rewrites historical events. */
export class DurableEventLedger {
  constructor(private readonly filePath: string) {}

  async append(event: CanonicalEvent): Promise<CanonicalEvent> {
    const verification = await this.verify();
    if (!verification.valid) throw new Error('LEDGER_QUARANTINED');

    const events = await this.read();
    const previousHash = events.at(-1)?.currentEventHash ?? 'GENESIS';
    const normalized = { ...event, previousEventHash: previousHash };
    const currentEventHash = calculateEventHash(previousHash, normalized);
    const committed = { ...normalized, currentEventHash, integrityStatus: 'VALID' as const };
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(committed)}\n`, 'utf8');
    return committed;
  }

  async read(): Promise<CanonicalEvent[]> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      return raw.split('\n').filter(Boolean).map((line) => JSON.parse(line) as CanonicalEvent);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return [];
      throw error;
    }
  }

  async verify(): Promise<LedgerIntegrityResult> {
    const events = await this.read();
    let previousHash = 'GENESIS';
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      if (event.previousEventHash !== previousHash) {
        return { valid: false, eventCount: events.length, lastSequence: index, failureIndex: index, reason: 'PREVIOUS_HASH_MISMATCH' };
      }
      const { currentEventHash: _ignored, integrityStatus: _status, ...unsigned } = event;
      const expected = calculateEventHash(previousHash, unsigned);
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(event.currentEventHash))) {
        return { valid: false, eventCount: events.length, lastSequence: index, failureIndex: index, reason: 'EVENT_HASH_MISMATCH' };
      }
      previousHash = event.currentEventHash;
    }
    return { valid: true, eventCount: events.length, lastSequence: events.length - 1 };
  }
}

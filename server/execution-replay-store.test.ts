import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DurableExecutionReplayStore } from './execution-replay-store';

let tempDirectory: string | undefined;

afterEach(async () => {
  if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
  tempDirectory = undefined;
});

describe('durable execution replay store', () => {
  it('persists a nonce claim across store instances', async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'factory-replay-'));
    const claim = {
      nonce: 'durable-test-nonce',
      executionId: 'exec-durable-test',
      proposalId: 'proposal-durable-test',
      claimedAt: new Date().toISOString(),
    };

    const firstStore = new DurableExecutionReplayStore(tempDirectory);
    const secondStore = new DurableExecutionReplayStore(tempDirectory);

    expect(await firstStore.claim(claim)).toBe(true);
    expect(await secondStore.claim(claim)).toBe(false);
  });

  it('does not expose nonce values through the claim filename', async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'factory-replay-'));
    const nonce = 'nonce-with-sensitive-looking-content';
    const store = new DurableExecutionReplayStore(tempDirectory);

    await store.claim({
      nonce,
      executionId: 'exec-filename-test',
      proposalId: 'proposal-filename-test',
      claimedAt: new Date().toISOString(),
    });

    const entries = await import('node:fs/promises').then(({ readdir }) => readdir(tempDirectory!));
    expect(entries).toHaveLength(1);
    expect(entries[0]).not.toContain(nonce);
    expect(entries[0]).toMatch(/^[0-9a-f]{64}\.claim$/);
  });
});

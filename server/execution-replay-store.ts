import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface ExecutionReplayClaim {
  nonce: string;
  executionId: string;
  proposalId: string;
  claimedAt: string;
}

/**
 * Durable, cross-process single-use claims for execution authorizations.
 * A nonce is hashed into a filesystem-safe filename and claimed with O_EXCL
 * semantics (`flag: wx`), making the claim atomic across broker processes.
 */
export class DurableExecutionReplayStore {
  constructor(private readonly directory = path.resolve('.runtime', 'execution-replay')) {}

  async claim(claim: ExecutionReplayClaim): Promise<boolean> {
    await mkdir(this.directory, { recursive: true });
    const nonceKey = crypto.createHash('sha256').update(claim.nonce).digest('hex');
    const claimPath = path.join(this.directory, `${nonceKey}.claim`);

    try {
      await writeFile(claimPath, `${JSON.stringify(claim)}\n`, { encoding: 'utf8', flag: 'wx' });
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
      throw error;
    }
  }
}

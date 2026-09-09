import { describe, expect, it } from 'vitest';
import {
  issueExecutionAuthorization,
  verifyExecutionAuthorization,
  type AuthenticatedPrincipal,
} from './security';

const principal: AuthenticatedPrincipal = {
  subject: 'factory-system-test',
  roles: ['SYSTEM'],
  authenticatedAt: new Date().toISOString(),
  authMethod: 'SERVICE_IDENTITY',
};

const input = {
  executionId: 'exec-test-1',
  proposalId: 'proposal-test-1',
  capability: 'test:execute',
};

const secret = 'test-secret';

describe('execution authorization', () => {
  it('issues and verifies a valid authorization', () => {
    const token = issueExecutionAuthorization(principal, input, secret);
    expect(verifyExecutionAuthorization(token, secret)).toBe(true);
  });

  it('rejects a tampered authorization', () => {
    const token = issueExecutionAuthorization(principal, input, secret);
    token.proposalId = 'proposal-tampered';
    expect(verifyExecutionAuthorization(token, secret)).toBe(false);
  });

  it('rejects expired authorizations', () => {
    const token = issueExecutionAuthorization(principal, input, secret,);
    expect(verifyExecutionAuthorization(token, secret, Date.parse(token.expiresAt))).toBe(false);
  });

  it('rejects malformed signatures without throwing', () => {
    const token = issueExecutionAuthorization(principal, input, secret);
    token.signature = 'not-a-valid-signature';
    expect(verifyExecutionAuthorization(token, secret)).toBe(false);
  });

  it('rejects future-dated tokens beyond the allowed clock skew', () => {
    const token = issueExecutionAuthorization(principal, input, secret);
    const issuedAt = Date.parse(token.issuedAt) + 60_000;
    const expiresAt = Date.parse(token.expiresAt) + 60_000;
    token.issuedAt = new Date(issuedAt).toISOString();
    token.expiresAt = new Date(expiresAt).toISOString();
    expect(verifyExecutionAuthorization(token, secret)).toBe(false);
  });

  it('rejects authorization TTLs above the kernel maximum', () => {
    expect(() => issueExecutionAuthorization(principal, input, secret, 30_001)).toThrow('EXECUTION_AUTHORIZATION_TTL_INVALID');
  });
});

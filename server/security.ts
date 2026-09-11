import crypto from 'node:crypto';

export type FactoryRole = 'OPERATOR' | 'SECURITY_ADMIN' | 'COMPLIANCE_OFFICER' | 'SYSTEM';

export interface AuthenticatedPrincipal {
  subject: string;
  roles: readonly FactoryRole[];
  authenticatedAt: string;
  authMethod: 'LOCAL_SIGNED' | 'OIDC' | 'SERVICE_IDENTITY';
}

const ROLE_CAPABILITIES: Record<FactoryRole, readonly string[]> = {
  OPERATOR: ['execution:request', 'execution:approve:low-risk'],
  SECURITY_ADMIN: ['execution:request', 'execution:approve:low-risk', 'execution:approve:high-risk', 'policy:manage', 'security:manage'],
  COMPLIANCE_OFFICER: ['execution:request', 'execution:approve:low-risk', 'execution:approve:high-risk', 'audit:read'],
  SYSTEM: ['execution:request', 'execution:execute'],
};

const MAX_AUTHORIZATION_TTL_MS = 30_000;
const MAX_CLOCK_SKEW_MS = 5_000;

export function hasCapability(principal: AuthenticatedPrincipal, capability: string): boolean {
  return principal.roles.some((role) => ROLE_CAPABILITIES[role]?.includes(capability));
}

export function assertAuthenticated(principal: AuthenticatedPrincipal | null | undefined): asserts principal is AuthenticatedPrincipal {
  if (!principal?.subject || !principal.authenticatedAt || !principal.authMethod) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }
}

export function assertCapability(principal: AuthenticatedPrincipal, capability: string): void {
  assertAuthenticated(principal);
  if (!hasCapability(principal, capability)) {
    throw new Error(`AUTHORIZATION_DENIED:${capability}`);
  }
}

export interface ExecutionAuthorization {
  executionId: string;
  proposalId: string;
  policyDecisionId: string;
  capability: string;
  subject: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  signature: string;
}

function signingPayload(token: Omit<ExecutionAuthorization, 'signature'>): string {
  return JSON.stringify(token);
}

export function issueExecutionAuthorization(
  principal: AuthenticatedPrincipal,
  input: { executionId: string; proposalId: string; policyDecisionId: string; capability: string; ttlMs?: number },
  secret: string,
  ttlMsOverride?: number
): ExecutionAuthorization {
  assertCapability(principal, 'execution:execute');
  if (!secret) throw new Error('EXECUTION_AUTH_SECRET_REQUIRED');
  if (!input.policyDecisionId) throw new Error('EXECUTION_POLICY_DECISION_REQUIRED');

  const ttlMs = ttlMsOverride ?? input.ttlMs ?? MAX_AUTHORIZATION_TTL_MS;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > MAX_AUTHORIZATION_TTL_MS) {
    throw new Error('EXECUTION_AUTHORIZATION_TTL_INVALID');
  }

  const issuedAt = new Date();
  const token: Omit<ExecutionAuthorization, 'signature'> = {
    executionId: input.executionId,
    proposalId: input.proposalId,
    policyDecisionId: input.policyDecisionId,
    capability: input.capability,
    subject: principal.subject,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + ttlMs).toISOString(),
    nonce: crypto.randomUUID(),
  };
  const signature = crypto.createHmac('sha256', secret).update(signingPayload(token)).digest('hex');
  return { ...token, signature };
}

export function verifyExecutionAuthorization(token: ExecutionAuthorization, secret: string, now = Date.now()): boolean {
  if (!secret || !token || typeof token.signature !== 'string' || token.signature.length !== 64) return false;

  const issuedAt = Date.parse(token.issuedAt);
  const expiresAt = Date.parse(token.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return false;
  if (issuedAt > now + MAX_CLOCK_SKEW_MS) return false;
  if (expiresAt <= now || expiresAt <= issuedAt) return false;
  if (expiresAt - issuedAt > MAX_AUTHORIZATION_TTL_MS) return false;
  if (!token.executionId || !token.proposalId || !token.policyDecisionId || !token.capability || !token.subject || !token.nonce) return false;

  const expected = crypto.createHmac('sha256', secret).update(signingPayload({
    executionId: token.executionId,
    proposalId: token.proposalId,
    policyDecisionId: token.policyDecisionId,
    capability: token.capability,
    subject: token.subject,
    issuedAt: token.issuedAt,
    expiresAt: token.expiresAt,
    nonce: token.nonce,
  })).digest('hex');

  const actual = Buffer.from(token.signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

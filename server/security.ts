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
  input: { executionId: string; proposalId: string; capability: string; ttlMs?: number },
  secret: string
): ExecutionAuthorization {
  assertCapability(principal, 'execution:execute');
  const issuedAt = new Date();
  const token: Omit<ExecutionAuthorization, 'signature'> = {
    executionId: input.executionId,
    proposalId: input.proposalId,
    capability: input.capability,
    subject: principal.subject,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + (input.ttlMs ?? 30_000)).toISOString(),
    nonce: crypto.randomUUID(),
  };
  const signature = crypto.createHmac('sha256', secret).update(signingPayload(token)).digest('hex');
  return { ...token, signature };
}

export function verifyExecutionAuthorization(token: ExecutionAuthorization, secret: string, now = Date.now()): boolean {
  if (Date.parse(token.expiresAt) <= now) return false;
  const expected = crypto.createHmac('sha256', secret).update(signingPayload({
    executionId: token.executionId,
    proposalId: token.proposalId,
    capability: token.capability,
    subject: token.subject,
    issuedAt: token.issuedAt,
    expiresAt: token.expiresAt,
    nonce: token.nonce,
  })).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token.signature), Buffer.from(expected));
}

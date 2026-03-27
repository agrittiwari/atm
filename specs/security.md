# Task 5: Security System - Detailed Specification

## Overview

Implement JWT authentication, rate limiting, WAF configuration, and the verified upvote system.

## Required Skills

**MUST load before starting:**
```bash
skill name=cloudflare
skill name=wrangler
```

| Skill | Purpose |
|-------|---------|
| `cloudflare` | WAF rules, Workers secrets, JWT validation |
| `wrangler` | Configure rate limiting, secrets, environment |

---

## Deliverables

### 1. JWT Authentication

Create `packages/registry/src/middleware/auth.ts`:

```typescript
interface JWTPayload {
  sub: string;      // User ID
  username: string;
  verified: boolean;
  exp: number;
  iat: number;
}

// Verify JWT from Authorization header
async function verifyJWT(token: string): Promise<JWTPayload>;

// Generate JWT (for CLI login)
function generateJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>): string;

// Auth middleware factory
function authMiddleware(): Middleware;
```

**Implementation:**
- Support `Bearer <token>` in Authorization header
- Verify signature using Cloudflare secret
- Check expiration
- Extract and attach user info to request context
- Return 401 on invalid/missing token

### 2. Rate Limiting

Create `packages/registry/src/middleware/rate-limit.ts`:

```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: Request) => string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Rate limiter by agent_id (not just IP)
function rateLimitByAgent(config: RateLimitConfig): Middleware;

// Different limits for different operations
const LIMITS = {
  read: { windowMs: 60000, maxRequests: 1000 },   // 1 min, 1000 reqs
  write: { windowMs: 60000, maxRequests: 10 },     // 1 min, 10 reqs
  upvote: { windowMs: 3600000, maxRequests: 10 },  // 1 hour, 10 votes
};
```

### 3. Verified Upvote System

Create `packages/registry/src/middleware/verified-upvote.ts`:

```typescript
// Only verified agents can upvote
async function verifyUpvotePermission(voterId: string): Promise<boolean> {
  // 1. Check if voter is verified agent
  // 2. Return true if verified, false otherwise
  // 3. Log attempt for audit
}

// Upvote with verification
async function verifiedUpvote(
  agentName: string,
  voterId: string
): Promise<{ success: boolean; reason?: string }>;
```

### 4. WAF Configuration

Configure in `wrangler.toml`:

```toml
[env.production.vars]
WAF_ENABLED = "true"

# Rate limiting rules
# Block requests exceeding limits
```

**Rules:**
- Rate limit by `agent_id` for API calls
- Block clearly abusive patterns
- Challenge suspicious traffic

### 5. CLI Login Command

Create `packages/cli/src/commands/login.ts`:

```bash
atm login
# Opens browser for OAuth or prompts for credentials
# Stores JWT in ~/.atm/auth.json
```

**Behavior:**
1. User authenticates (API key or OAuth)
2. Registry validates and returns JWT
3. CLI stores token locally
4. Subsequent commands use token automatically

---

## Security Flow

```
Request to /agents/:name/publish
         │
         ▼
    ┌─────────────┐
    │ Auth Check │ ◄── Valid JWT required
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ Rate Limit  │ ◄── Per user, per agent
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   Handler   │ ◄── Execute operation
    └─────────────┘
```

---

## Acceptance Criteria

- [ ] JWT required for all write operations
- [ ] Invalid JWT returns 401 with clear message
- [ ] Rate limiting enforced per agent_id
- [ ] Rate limit headers included in responses
- [ ] Only verified agents can upvote
- [ ] Non-verified upvote returns 403 with reason
- [ ] `atm login` successfully stores JWT
- [ ] CLI commands use stored JWT automatically

---

## Implementation Notes

- Use Cloudflare Workers Secrets for JWT signing key
- Rate limiting can use KV or in-memory for local dev
- Token stored at `~/.atm/credentials` (not `auth.json` to avoid conflicts)
- Implement token refresh flow
- Log all auth failures for security monitoring

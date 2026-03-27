# Task 4: Dynamic Runtime - Detailed Specification

## Overview

Implement the Dynamic Worker Loading system that executes agents on-the-fly from R2 tarballs in isolated V8 sandboxes.

---

## Deliverables

### 1. Code Loader

Create `packages/registry/src/runtime/loader.ts`:

```typescript
// Pull agent code from R2
async function loadAgentCode(agentName: string, version: string): Promise<string> {
  // 1. Get tarball from R2
  // 2. Extract/unzip the code
  // 3. Load main entry point
  // 4. Return executable code
}
```

### 2. V8 Sandbox

Create `packages/registry/src/runtime/sandbox.ts`:

```typescript
interface SandboxConfig {
  memoryLimitMB: number;
  cpuLimitMs: number;
  timeoutMs: number;
}

class V8Sandbox {
  constructor(config: SandboxConfig);
  
  // Initialize isolate
  async initialize(): Promise<void>;
  
  // Execute code with context
  async execute(
    code: string,
    context: object,
    handler: string
  ): Promise<unknown>;
  
  // Cleanup isolate
  async dispose(): Promise<void>;
}
```

### 3. Isolate Manager

Create `packages/registry/src/runtime/isolate-manager.ts`:

```typescript
interface IsolatePoolConfig {
  maxIsolates: number;
  idleTimeoutMs: number;
}

class IsolatePool {
  constructor(config: IsolatePoolConfig);
  
  // Acquire isolate from pool
  async acquire(): Promise<V8Sandbox>;
  
  // Release isolate back to pool
  async release(sandbox: V8Sandbox): void;
  
  // Get or create isolate
  async getIsolate(agentName: string): Promise<V8Sandbox>;
}
```

### 4. Request Handler

Create `packages/registry/src/handlers/call.ts`:

```typescript
// Handle A2A call to dynamic agent
async function handleDynamicCall(
  agentName: string,
  message: A2AMessage
): Promise<A2AResponse> {
  // 1. Parse agent name to get version (default: latest)
  // 2. Load code from R2 via loader
  // 3. Get isolate from pool
  // 4. Execute in sandbox
  // 5. Return response
  // 6. Release isolate (or keep warm for reuse)
}
```

### 5. Lifecycle Management

Implement in `packages/registry/src/runtime/lifecycle.ts`:

```typescript
// Warm up isolate pool on startup
async function warmUpPool(): Promise<void>;

// Graceful shutdown
async function shutdownPool(): Promise<void>;

// Metrics collection
function getPoolMetrics(): {
  activeIsolates: number;
  idleIsolates: number;
  totalExecuted: number;
}
```

---

## Execution Flow

```
A2A Request: /call/@user/agent
         │
         ▼
    ┌─────────┐
    │  Parse  │ ─── Extract agent name & version
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Loader  │ ─── Fetch tarball from R2
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │Isolate  │ ─── Get from pool (or create)
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │Sandbox  │ ─── Execute in V8 isolate
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Response│ ─── Return A2A response
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Release │ ─── Return isolate to pool
    └─────────┘
```

---

## Acceptance Criteria

- [ ] Agent code loads from R2 tarballs
- [ ] V8 sandbox executes code in isolation
- [ ] Memory and CPU limits enforced
- [ ] Timeout kills long-running code
- [ ] Isolate pool manages resources efficiently
- [ ] Hot path reuse for frequently called agents

---

## Implementation Notes

- Use Cloudflare's built-in V8 isolate support via `new Worker()` pattern
- Implement circuit breaker for failing agents
- Cache loaded code in memory (LRU cache)
- Track execution metrics for cost optimization
- Default limits: 128MB memory, 1000ms CPU, 5000ms timeout

import { V8Sandbox, type SandboxConfig } from './sandbox';

export interface IsolatePoolConfig {
  maxIsolates: number;
  idleTimeoutMs: number;
  defaultSandboxConfig: SandboxConfig;
}

interface PooledIsolate {
  sandbox: V8Sandbox;
  agentName: string;
  lastUsed: number;
  isExecuting: boolean;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

export class IsolatePool {
  private config: IsolatePoolConfig;
  private idlePool: PooledIsolate[] = [];
  private activeIsolates: Map<string, PooledIsolate> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private warmIsolates: number = 0;

  constructor(config: Partial<IsolatePoolConfig> = {}) {
    this.config = {
      maxIsolates: config.maxIsolates ?? 10,
      idleTimeoutMs: config.idleTimeoutMs ?? 60000,
      defaultSandboxConfig: {
        memoryLimitMB: config.defaultSandboxConfig?.memoryLimitMB ?? 128,
        cpuLimitMs: config.defaultSandboxConfig?.cpuLimitMs ?? 1000,
        timeoutMs: config.defaultSandboxConfig?.timeoutMs ?? 5000,
      },
    };
  }

  async acquire(agentName?: string): Promise<V8Sandbox> {
    if (agentName && this.isCircuitOpen(agentName)) {
      throw new Error(`Circuit breaker open for agent: ${agentName}`);
    }

    const pooled = this.idlePool.find(
      (iso) => !iso.isExecuting && iso.agentName === agentName
    );

    if (pooled) {
      this.idlePool = this.idlePool.filter((iso) => iso !== pooled);
      pooled.isExecuting = true;
      pooled.lastUsed = Date.now();
      
      if (agentName) {
        this.activeIsolates.set(agentName, pooled);
      }
      
      return pooled.sandbox;
    }

    const totalActive = this.activeIsolates.size + this.warmIsolates;
    if (totalActive < this.config.maxIsolates) {
      const sandbox = new V8Sandbox(this.config.defaultSandboxConfig);
      await sandbox.initialize();
      
      const pooledIsolate: PooledIsolate = {
        sandbox,
        agentName: agentName || 'generic',
        lastUsed: Date.now(),
        isExecuting: true,
      };

      if (agentName) {
        this.activeIsolates.set(agentName, pooledIsolate);
      }

      return sandbox;
    }

    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const waiting = this.idlePool.find((iso) => !iso.isExecuting);
      if (waiting) {
        this.idlePool = this.idlePool.filter((iso) => iso !== waiting);
        waiting.isExecuting = true;
        waiting.lastUsed = Date.now();
        
        if (agentName && waiting.agentName === agentName) {
          this.activeIsolates.set(agentName, waiting);
        }
        
        return waiting.sandbox;
      }
    }

    throw new Error('No isolates available');
  }

  async release(sandbox: V8Sandbox, agentName?: string): Promise<void> {
    const pooled = Array.from(this.activeIsolates.values()).find(
      (iso) => iso.sandbox === sandbox
    );

    if (pooled) {
      pooled.isExecuting = false;
      pooled.lastUsed = Date.now();
      
      if (agentName) {
        this.activeIsolates.delete(agentName);
      }
    }

    if (!this.idlePool.some((iso) => iso.sandbox === sandbox)) {
      const releaseIsolate: PooledIsolate = {
        sandbox,
        agentName: agentName || pooled?.agentName || 'generic',
        lastUsed: Date.now(),
        isExecuting: false,
      };
      this.idlePool.push(releaseIsolate);
    }

    this.cleanupIdle();
  }

  async getIsolate(agentName: string): Promise<V8Sandbox> {
    return this.acquire(agentName);
  }

  private isCircuitOpen(agentName: string): boolean {
    const cb = this.circuitBreakers.get(agentName);
    if (!cb) return false;
    
    if (cb.isOpen) {
      const timeSinceFailure = Date.now() - cb.lastFailure;
      if (timeSinceFailure > 30000) {
        cb.isOpen = false;
        cb.failures = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(agentName: string): void {
    const cb = this.circuitBreakers.get(agentName);
    if (cb) {
      cb.failures = 0;
      cb.isOpen = false;
    }
  }

  recordFailure(agentName: string): void {
    let cb = this.circuitBreakers.get(agentName);
    if (!cb) {
      cb = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreakers.set(agentName, cb);
    }
    
    cb.failures++;
    cb.lastFailure = Date.now();
    
    if (cb.failures >= 5) {
      cb.isOpen = true;
    }
  }

  private cleanupIdle(): void {
    const now = Date.now();
    const validIdle: PooledIsolate[] = [];
    
    for (const iso of this.idlePool) {
      if (now - iso.lastUsed < this.config.idleTimeoutMs) {
        validIdle.push(iso);
      } else {
        iso.sandbox.dispose();
      }
    }
    
    this.idlePool = validIdle;
  }

  async warmUp(agents: string[]): Promise<void> {
    const toCreate = Math.min(agents.length, this.config.maxIsolates);
    
    for (let i = 0; i < toCreate; i++) {
      try {
        const sandbox = new V8Sandbox(this.config.defaultSandboxConfig);
        await sandbox.initialize();
        
        this.idlePool.push({
          sandbox,
          agentName: agents[i],
          lastUsed: Date.now(),
          isExecuting: false,
        });
        
        this.warmIsolates++;
      } catch (err) {
        console.error(`Failed to warm up isolate for ${agents[i]}:`, err);
      }
    }
  }

  async shutdown(): Promise<void> {
    for (const iso of this.idlePool) {
      await iso.sandbox.dispose();
    }
    this.idlePool = [];
    
    for (const [, iso] of this.activeIsolates) {
      await iso.sandbox.dispose();
    }
    this.activeIsolates.clear();
    
    this.circuitBreakers.clear();
    this.warmIsolates = 0;
  }

  getMetrics(): {
    activeIsolates: number;
    idleIsolates: number;
    totalIsolates: number;
    circuitBreakers: Record<string, { failures: number; isOpen: boolean }>;
  } {
    return {
      activeIsolates: this.activeIsolates.size,
      idleIsolates: this.idlePool.length,
      totalIsolates: this.activeIsolates.size + this.idlePool.length,
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([k, v]) => [
          k,
          { failures: v.failures, isOpen: v.isOpen },
        ])
      ),
    };
  }
}

export const isolatePool = new IsolatePool();

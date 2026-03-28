import { codeLoader, type CodeLoader } from './loader';
import { isolatePool, type IsolatePool } from './isolate-manager';

export interface LifecycleMetrics {
  activeIsolates: number;
  idleIsolates: number;
  totalExecuted: number;
  codeCacheSize: number;
  codeCacheHitRate: number;
  poolMetrics: {
    activeIsolates: number;
    idleIsolates: number;
    totalIsolates: number;
    circuitBreakers: Record<string, { failures: number; isOpen: boolean }>;
  };
}

class RuntimeLifecycle {
  private initialized: boolean = false;
  private totalExecuted: number = 0;
  private warmUpAgents: string[] = [];

  async warmUpPool(agents?: string[]): Promise<void> {
    if (this.initialized) {
      console.log('Pool already initialized');
      return;
    }

    const agentsToWarm = agents || this.warmUpAgents;
    
    if (agentsToWarm.length > 0) {
      console.log(`Warming up isolate pool with ${agentsToWarm.length} agents...`);
      await isolatePool.warmUp(agentsToWarm);
    }

    this.initialized = true;
    console.log('Runtime lifecycle initialized');
  }

  async shutdownPool(): Promise<void> {
    console.log('Shutting down isolate pool...');
    await isolatePool.shutdown();
    codeLoader.clearCache();
    this.initialized = false;
    console.log('Runtime lifecycle shutdown complete');
  }

  getPoolMetrics(): LifecycleMetrics {
    const cacheStats = codeLoader.getCacheStats();
    const poolMetrics = isolatePool.getMetrics();

    return {
      activeIsolates: poolMetrics.activeIsolates,
      idleIsolates: poolMetrics.idleIsolates,
      totalExecuted: this.totalExecuted,
      codeCacheSize: cacheStats.size,
      codeCacheHitRate: cacheStats.hitRate,
      poolMetrics,
    };
  }

  incrementExecuted(): void {
    this.totalExecuted++;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  setWarmUpAgents(agents: string[]): void {
    this.warmUpAgents = agents;
  }

  getCodeLoader(): CodeLoader {
    return codeLoader;
  }

  getIsolatePool(): IsolatePool {
    return isolatePool;
  }
}

export const runtimeLifecycle = new RuntimeLifecycle();

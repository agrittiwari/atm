export interface SandboxConfig {
  memoryLimitMB: number;
  cpuLimitMs: number;
  timeoutMs: number;
}

export class V8Sandbox {
  private config: SandboxConfig;
  private initialized: boolean = false;
  private executing: boolean = false;
  private cpuStartTime: number = 0;

  constructor(config: SandboxConfig) {
    this.config = {
      memoryLimitMB: config.memoryLimitMB ?? 128,
      cpuLimitMs: config.cpuLimitMs ?? 1000,
      timeoutMs: config.timeoutMs ?? 5000,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async execute(code: string, context: object, handler: string): Promise<unknown> {
    if (!this.initialized) {
      throw new Error('Sandbox not initialized');
    }

    if (this.executing) {
      throw new Error('Sandbox is already executing');
    }

    this.executing = true;
    this.cpuStartTime = Date.now();

    const timeoutMs = this.config.timeoutMs;
    const memoryLimitMB = this.config.memoryLimitMB;
    const cpuLimitMs = this.config.cpuLimitMs;

    const cpuMonitorInterval = 10;
    let cpuExceeded = false;
    let memoryMonitorInterval: ReturnType<typeof setInterval> | undefined;
    let worker: any = null;

    const checkCpuLimit = (): boolean => {
      const cpuTimeUsed = Date.now() - this.cpuStartTime;
      if (cpuTimeUsed > cpuLimitMs) {
        cpuExceeded = true;
        return true;
      }
      return false;
    };

    const startCpuMonitoring = (): void => {
      const interval = setInterval(() => {
        if (checkCpuLimit()) {
          clearInterval(interval);
        }
      }, cpuMonitorInterval);
    };

    const startMemoryMonitoring = (w: any): void => {
      memoryMonitorInterval = setInterval(() => {
        try {
          const memory = w.getMemoryUsage?.();
          if (memory) {
            const memoryMB = memory / (1024 * 1024);
            if (memoryMB > memoryLimitMB) {
              w.terminate();
            }
          }
        } catch {
        }
      }, 50);
    };

    try {
      const workerCode = this.generateWorkerCode(code, handler, context);
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const blobUrl = (URL as any).createObjectURL(blob);

      const WorkerClass: any = (globalThis as any).Worker;
      worker = new WorkerClass(blobUrl);
      (URL as any).revokeObjectURL(blobUrl);

      startCpuMonitoring();
      startMemoryMonitoring(worker);

      const result = await Promise.race([
        this.executeInWorker(worker, context),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            if (worker) worker.terminate();
            reject(new Error(`Execution timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);

      if (cpuExceeded) {
        if (worker) worker.terminate();
        throw new Error(`CPU limit exceeded: ${cpuLimitMs}ms`);
      }

      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval);
      }

      if (worker) worker.terminate();

      this.executing = false;
      return result;
    } catch (err) {
      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval);
      }
      if (worker) worker.terminate();
      this.executing = false;
      throw err;
    }
  }

  private async executeInWorker(worker: any, context: object): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);

        if (event.data.type === 'result') {
          resolve(event.data.value);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.message));
        }
      };

      const errorHandler = (event: ErrorEvent) => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        reject(new Error(event.message));
      };

      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', errorHandler);

      worker.postMessage({ type: 'run', context });
    });
  }

  private generateWorkerCode(code: string, handlerName: string, _context: object): string {
    return `
      self.onmessage = async function(event) {
        if (event.data.type === 'run') {
          try {
            const context = event.data.context;
            
            ${code}
            
            let result;
            if (typeof ${handlerName} === 'function') {
              result = await ${handlerName}(context);
            } else {
              result = context;
            }
            
            self.postMessage({ type: 'result', value: result });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        }
      };
    `;
  }

  async dispose(): Promise<void> {
    this.initialized = false;
    this.executing = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isExecuting(): boolean {
    return this.executing;
  }

  getConfig(): SandboxConfig {
    return { ...this.config };
  }
}

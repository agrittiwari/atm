export interface LoadedCode {
  code: string;
  handler: string;
  entryPoint: string;
  memoryLimitMB: number;
  cpuLimitMs: number;
  timeoutMs: number;
}

export interface CodeLoaderConfig {
  cacheSize: number;
  cacheTTLMs: number;
}

interface CacheEntry {
  code: LoadedCode;
  timestamp: number;
  hitCount: number;
}

export class CodeLoader {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheOrder: string[] = [];
  private config: CodeLoaderConfig;
  private r2: any = null;

  constructor(config: Partial<CodeLoaderConfig> = {}) {
    this.config = {
      cacheSize: config.cacheSize ?? 50,
      cacheTTLMs: config.cacheTTLMs ?? 3600000,
    };
  }

  setR2Bucket(r2: any) {
    this.r2 = r2;
  }

  private getCacheKey(agentName: string, version: string): string {
    return `${agentName}:${version}`;
  }

  private evictIfNeeded(): void {
    while (this.cacheOrder.length >= this.config.cacheSize) {
      const oldestKey = this.cacheOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.config.cacheTTLMs;
  }

  async load(agentName: string, version: string): Promise<LoadedCode> {
    const cacheKey = this.getCacheKey(agentName, version);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      cached.hitCount++;
      return cached.code;
    }

    const code = await this.fetchFromR2(agentName, version);
    const loadedCode = this.parseAndValidate(code, agentName, version);

    this.evictIfNeeded();
    this.cache.set(cacheKey, {
      code: loadedCode,
      timestamp: Date.now(),
      hitCount: 1,
    });
    this.cacheOrder.push(cacheKey);

    return loadedCode;
  }

  private async fetchFromR2(agentName: string, version: string): Promise<ArrayBuffer> {
    if (!this.r2) {
      throw new Error('R2 bucket not configured');
    }

    const key = `tarballs/${agentName}/${version}.tar.gz`;
    const object = await this.r2.get(key) as any;

    if (!object) {
      throw new Error(`Agent tarball not found: ${agentName}@${version}`);
    }

    const arrayBuffer = await object.arrayBuffer();
    return arrayBuffer;
  }

  private parseAndValidate(buffer: ArrayBuffer, agentName: string, version: string): LoadedCode {
    const uint8Array = new Uint8Array(buffer);
    const extracted = this.extractFromTarball(uint8Array);

    if (!extracted.main) {
      throw new Error(`No main entry point found in ${agentName}@${version}`);
    }

    return {
      code: extracted.main,
      handler: extracted.handler || 'handler',
      entryPoint: extracted.entryPoint || 'index.js',
      memoryLimitMB: extracted.memoryLimitMB || 128,
      cpuLimitMs: extracted.cpuLimitMs || 1000,
      timeoutMs: extracted.timeoutMs || 5000,
    };
  }

  private extractFromTarball(data: Uint8Array): {
    main?: string;
    handler?: string;
    entryPoint?: string;
    memoryLimitMB?: number;
    cpuLimitMs?: number;
    timeoutMs?: number;
  } {
    const decoder = new TextDecoder();
    const files: Map<string, string> = new Map();
    let offset = 0;
    let manifest: any = null;

    while (offset < data.length) {
      if (data[offset] === 0x1f && data[offset + 1] === 0x8b) {
        break;
      }

      const headerSize = 512;
      if (offset + headerSize > data.length) break;

      const header = data.slice(offset, offset + headerSize);
      const filename = decoder.decode(header.slice(0, 100)).replace(/\0/g, '');
      const filesize = parseInt(decoder.decode(header.slice(124, 136)).replace(/\0/g, ''), 8);

      if (filename && filesize > 0) {
        offset += headerSize;
        const fileContent = data.slice(offset, offset + filesize);
        const padding = (512 - (filesize % 512)) % 512;
        offset += filesize + padding;

        if (filename === 'manifest.json') {
          try {
            manifest = JSON.parse(decoder.decode(fileContent));
          } catch {
          }
        } else {
          files.set(filename, decoder.decode(fileContent));
        }
      } else {
        break;
      }
    }

    if (!manifest) {
      for (const [filename, content] of files) {
        if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
          return { main: content, entryPoint: filename };
        }
      }
    }

    return {
      main: files.get('index.js') || files.get('index.mjs') || files.get('main.js'),
      handler: manifest?.handler,
      entryPoint: manifest?.entryPoint,
      memoryLimitMB: manifest?.memoryLimitMB,
      cpuLimitMs: manifest?.cpuLimitMs,
      timeoutMs: manifest?.timeoutMs,
    };
  }

  invalidate(agentName: string, version: string): void {
    const cacheKey = this.getCacheKey(agentName, version);
    this.cache.delete(cacheKey);
    this.cacheOrder = this.cacheOrder.filter((k) => k !== cacheKey);
  }

  getCacheStats(): { size: number; hits: number; hitRate: number } {
    let hits = 0;
    let total = 0;
    for (const entry of this.cache.values()) {
      hits += entry.hitCount;
      total += entry.hitCount;
    }
    return {
      size: this.cache.size,
      hits,
      hitRate: total > 0 ? hits / total : 0,
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheOrder = [];
  }
}

export const codeLoader = new CodeLoader();

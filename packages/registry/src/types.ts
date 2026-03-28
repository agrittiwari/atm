export interface AgentManifest {
  name: string;
  username: string;
  version: string;
  description: string;
  framework: string;
  endpoint: string;
  capabilities: string[];
  authConfig: AuthConfig;
  runtime?: string;
}

export interface AuthConfig {
  type: 'none' | 'jwt' | 'api_key' | 'basic';
  config?: Record<string, string>;
}

export interface Agent {
  id: string;
  name: string;
  username: string;
  version: string;
  description: string;
  framework: string;
  endpoint: string;
  capabilities: string[];
  authConfig: AuthConfig;
  runtime: string;
  upvotes: number;
  verified: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Env {
  DB: D1Database;
  AGENT_TARBALLS: R2Bucket;
  JWT_SECRET?: string;
  RATE_LIMIT_KV?: KVNamespace;
}

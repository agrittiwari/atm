export interface Agent {
  id: string;
  name: string;
  username: string;
  version: string;
  description: string;
  framework: string;
  endpoint: string;
  capabilities: string[];
  runtime: string;
  upvotes: number;
  verified: boolean;
  createdAt: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${this.baseUrl}/agents`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.agents || [];
  }

  async getAgent(name: string): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/agents/${name}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent: ${response.statusText}`);
    }
    return response.json();
  }
}

export function createApiClient(env: { REGISTRY_URL?: string }): ApiClient {
  return new ApiClient(env.REGISTRY_URL || 'https://registry.atm.dev');
}

import semver from 'semver';

export interface AgentManifest {
  name: string;
  version: string;
  description: string;
  framework: 'cloudflare' | 'mastra' | 'langchain' | 'openai';
  endpoint: string;
  capabilities: string[];
  auth: { type: 'bearer' | 'api-key' };
  runtime: 'static' | 'dynamic';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const NAME_REGEX = /^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

export function validateAgentManifest(manifest: Partial<AgentManifest>): ValidationResult {
  const errors: string[] = [];

  if (!manifest.name) {
    errors.push('name is required');
  } else if (!NAME_REGEX.test(manifest.name)) {
    errors.push('name must match @username/agent-name format');
  }

  if (!manifest.version) {
    errors.push('version is required');
  } else if (!semver.valid(manifest.version)) {
    errors.push('version must be a valid semver string');
  }

  if (!manifest.framework) {
    errors.push('framework is required');
  } else if (!['cloudflare', 'mastra', 'langchain', 'openai'].includes(manifest.framework)) {
    errors.push('framework must be one of: cloudflare, mastra, langchain, openai');
  }

  if (!manifest.capabilities) {
    errors.push('capabilities is required');
  } else if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    errors.push('capabilities must be a non-empty array');
  }

  if (!manifest.description) {
    errors.push('description is required');
  }

  if (!manifest.endpoint) {
    errors.push('endpoint is required');
  }

  if (!manifest.auth) {
    errors.push('auth is required');
  } else if (!['bearer', 'api-key'].includes(manifest.auth.type)) {
    errors.push('auth.type must be either bearer or api-key');
  }

  if (!manifest.runtime) {
    errors.push('runtime is required');
  } else if (!['static', 'dynamic'].includes(manifest.runtime)) {
    errors.push('runtime must be either static or dynamic');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name) {
    errors.push('name is required');
  } else if (!NAME_REGEX.test(name)) {
    errors.push('name must match @username/agent-name format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

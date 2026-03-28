import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import readline from 'readline';

interface Credentials {
  token: string;
  username: string;
  expiresAt: number;
}

export default class LoginCommand extends Command {
  static description = 'Login to ATM registry';

  static examples = [
    '$ atm login',
    '$ atm login --registry https://registry.atm.example.com',
  ];

  static flags = {
    registry: Flags.string({
      required: false,
      default: 'https://registry.atm.example.com',
      description: 'Registry URL',
    }),
    username: Flags.string({
      required: false,
      description: 'Username (skip to prompt)',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(LoginCommand);
    const registry = flags.registry;

    this.log(chalk.blue('ATM Login\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    let username = flags.username;
    if (!username) {
      username = await question('Username: ');
    }

    const password = await question('Password: ');
    rl.close();

    if (!username || !password) {
      this.error(chalk.red('Username and password are required'));
    }

    this.log(chalk.blue('\nAuthenticating...'));

    try {
      const credentials = await this.authenticate(registry, username, password);
      await this.saveCredentials(credentials);
      this.log(chalk.green('\n✓ Login successful!'));
      this.log(chalk.gray(`  Logged in as: ${username}`));
    } catch (error: any) {
      this.error(chalk.red(`Login failed: ${error.message}`));
    }
  }

  private async authenticate(
    registry: string,
    username: string,
    password: string
  ): Promise<Credentials> {
    const response = await fetch(`${registry}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Authentication failed' })) as { error?: string };
      throw new Error(error.error || 'Authentication failed');
    }

    const data = await response.json() as { token: string; username: string };
    return {
      token: data.token,
      username: data.username,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
  }

  private async saveCredentials(credentials: Credentials): Promise<void> {
    const atmDir = path.join(os.homedir(), '.atm');
    const credentialsPath = path.join(atmDir, 'credentials');

    await fs.mkdir(atmDir, { recursive: true });
    await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2));

    await fs.chmod(credentialsPath, 0o600);
  }
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const credentialsPath = path.join(os.homedir(), '.atm', 'credentials');
    const data = await fs.readFile(credentialsPath, 'utf-8');
    const credentials = JSON.parse(data) as Credentials;

    if (credentials.expiresAt < Date.now()) {
      return null;
    }

    return credentials;
  } catch {
    return null;
  }
}

export function getAuthHeader(): string | null {
  const credentials = loadCredentialsSync();
  return credentials ? `Bearer ${credentials.token}` : null;
}

function loadCredentialsSync(): Credentials | null {
  try {
    const credentialsPath = path.join(os.homedir(), '.atm', 'credentials');
    const data = require('fs').readFileSync(credentialsPath, 'utf-8');
    const credentials = JSON.parse(data) as Credentials;

    if (credentials.expiresAt < Date.now()) {
      return null;
    }

    return credentials;
  } catch {
    return null;
  }
}

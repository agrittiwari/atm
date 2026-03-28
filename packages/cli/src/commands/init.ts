import { Command, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import semver from 'semver';
import { validateName, AgentManifest } from '../utils/validator.js';

const TEMPLATES = ['cloudflare', 'mastra', 'langchain', 'openai'];

export default class InitCommand extends Command {
  static description = 'Initialize a new ATM agent project';

  static examples = [
    '$ atm init --name @user/my-agent',
    '$ atm init --name @user/my-agent --template mastra',
    '$ atm init --name @user/my-agent --dynamic',
    '$ atm init --name @user/my-agent --dir ./my-agent',
  ];

  static flags = {
    name: Flags.string({
      required: true,
      description: 'Agent name in @username/agent-name format',
    }),
    template: Flags.string({
      required: false,
      default: 'cloudflare',
      options: TEMPLATES,
      description: 'Framework template to use',
    }),
    dynamic: Flags.boolean({
      required: false,
      default: false,
      description: 'Enable dynamic runtime',
    }),
    dir: Flags.string({
      required: false,
      default: '.',
      description: 'Target directory for the agent',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(InitCommand);
    const name = flags.name;
    const template = flags.template;
    const dynamic = flags.dynamic;
    const dir = flags.dir;

    this.log(chalk.blue('Initializing ATM agent...\n'));

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      this.error(chalk.red(`Invalid name: ${nameValidation.errors.join(', ')}`));
    }

    if (!TEMPLATES.includes(template)) {
      this.error(chalk.red(`Invalid template: ${template}. Must be one of: ${TEMPLATES.join(', ')}`));
    }

    const targetDir = path.resolve(process.cwd(), dir === '.' ? name.split('/')[1] : dir);

    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        this.error(chalk.red(`Failed to create directory: ${err.message}`));
      }
    }

    const agentJson: AgentManifest = {
      name,
      version: semver.valid(semver.coerce('1.0.0')!) || '1.0.0',
      description: `Agent: ${name}`,
      framework: template as AgentManifest['framework'],
      endpoint: '/api/agent',
      capabilities: ['agent'],
      auth: { type: 'bearer' },
      runtime: dynamic ? 'dynamic' : 'static',
    };

    await this.generateAgentJson(targetDir, agentJson);
    await this.generateTemplateFiles(targetDir, template, name);
    await this.generateReadme(targetDir, template, name, agentJson.description);

    this.log(chalk.blue('Installing dependencies...'));
    try {
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
      this.log(chalk.green('✓ Dependencies installed successfully'));
    } catch (err: any) {
      this.warn(chalk.yellow(`Warning: Failed to install dependencies: ${err.message}`));
      this.log(chalk.yellow('Please run "npm install" manually'));
    }

    if (dir === '.') {
      this.log(chalk.green(`\n✓ Agent ${name} initialized successfully!`));
      this.log(chalk.gray(`  Template: ${template}`));
      this.log(chalk.gray(`  Runtime: ${agentJson.runtime}`));
    } else {
      this.log(chalk.green(`\n✓ Agent ${name} created in ${targetDir}`));
    }

    this.log(chalk.yellow('\nNext steps:'));
    this.log(chalk.gray(`  cd ${dir === '.' ? name.split('/')[1] : dir}`));
    this.log(chalk.gray('  npm run dev'));
  }

  private async generateAgentJson(targetDir: string, manifest: AgentManifest): Promise<void> {
    const agentJsonPath = path.join(targetDir, 'agent.json');
    await fs.writeFile(agentJsonPath, JSON.stringify(manifest, null, 2) + '\n');
    this.log(chalk.green('✓ Created agent.json'));
  }

  private async generateTemplateFiles(
    targetDir: string,
    template: string,
    _agentName: string
  ): Promise<void> {
    const templateDir = path.join(import.meta.dirname!, '..', '..', 'templates', template);
    const destDir = targetDir;

    const files = await this.getTemplateFiles(template, templateDir);

    for (const file of files) {
      const destPath = path.join(destDir, file.relativePath);
      const destDir2 = path.dirname(destPath);
      await fs.mkdir(destDir2, { recursive: true });
      await fs.writeFile(destPath, file.content);
    }

    this.log(chalk.green(`✓ Created ${files.length} template file(s)`));
  }

  private async getTemplateFiles(
    template: string,
    templateDir: string
  ): Promise<{ relativePath: string; content: string }[]> {
    const files: { relativePath: string; content: string }[] = [];

    try {
      const entries = await fs.readdir(templateDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(templateDir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getTemplateFiles(template, fullPath);
          const basePath = path.relative(templateDir, fullPath);
          files.push(
            ...subFiles.map((f) => ({
              relativePath: path.join(basePath, f.relativePath),
              content: f.content,
            }))
          );
        } else if (
          entry.name.endsWith('.ts') ||
          entry.name.endsWith('.js') ||
          entry.name.endsWith('.json') ||
          entry.name.endsWith('.toml') ||
          entry.name.startsWith('.env')
        ) {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({
            relativePath: entry.name,
            content,
          });
        }
      }
    } catch (err) {
      this.error(chalk.red(`Template not found: ${template}`));
    }

    return files;
  }

  private async generateReadme(
    targetDir: string,
    template: string,
    agentName: string,
    description: string
  ): Promise<void> {
    const readmeContent = this.getReadmeContent(template, agentName, description);
    const readmePath = path.join(targetDir, 'README.md');
    await fs.writeFile(readmePath, readmeContent);
    this.log(chalk.green('✓ Created README.md'));
  }

  private getReadmeContent(template: string, agentName: string, description: string): string {
    const agentShortName = agentName.split('/')[1] || agentName;

    const templateContent: Record<string, { architecture: string; stack: string; contributing: string }> = {
      cloudflare: {
        architecture: `This agent runs as a Cloudflare Worker and can be called via A2A protocol.

## Architecture

The agent is deployed as a serverless Worker on Cloudflare's edge network. It handles A2A (Agent-to-Agent) protocol requests and returns responses.`,
        stack: `## Stack

- Cloudflare Workers
- TypeScript
- Hono (HTTP framework)
- V8 Isolate Runtime`,
        contributing: `## Contributing

1. Edit \`src/index.ts\` to modify agent behavior
2. Test locally: \`wrangler dev\`
3. Deploy: \`wrangler deploy\``,
      },
      mastra: {
        architecture: `This agent uses Mastra for AI workflow orchestration.

## Architecture

Mastra provides the AI agent framework with structured workflows. The agent can be called via A2A protocol and uses Mastra's built-in tools and memory systems.`,
        stack: `## Stack

- Mastra (AI workflow framework)
- Cloudflare Workers
- TypeScript
- V8 Isolate Runtime`,
        contributing: `## Contributing

1. Edit \`src/agent.ts\` to modify agent behavior
2. Run locally: \`npm run dev\`
3. Test: \`npm test\`
4. Deploy: \`wrangler deploy\``,
      },
      langchain: {
        architecture: `This agent uses LangChain for LLM-powered capabilities.

## Architecture

LangChain provides the LLM orchestration layer with chains, agents, and tools. The agent wraps LangChain logic for A2A protocol communication.`,
        stack: `## Stack

- LangChain (LLM framework)
- Cloudflare Workers
- TypeScript
- V8 Isolate Runtime`,
        contributing: `## Contributing

1. Edit \`src/agent.ts\` to modify agent behavior
2. Run locally: \`npm run dev\`
3. Test: \`npm test\`
4. Deploy: \`wrangler deploy\``,
      },
      openai: {
        architecture: `This agent wraps an OpenAI Assistant for A2A communication.

## Architecture

The agent uses OpenAI's Assistants API to handle conversations. It receives A2A messages, forwards them to the Assistant, and returns responses.`,
        stack: `## Stack

- OpenAI Assistants API
- Cloudflare Workers
- TypeScript
- V8 Isolate Runtime`,
        contributing: `## Contributing

1. Edit \`src/agent.ts\` to modify agent behavior
2. Add your OpenAI API key to \`.env\`
3. Run locally: \`npm run dev\`
4. Deploy: \`wrangler deploy\``,
      },
    };

    const content = templateContent[template] || templateContent.cloudflare;

    return `# ${agentShortName}

${description}

${content.architecture}

${content.stack}

${content.contributing}

---

Generated by ATM CLI
`;
  }
}

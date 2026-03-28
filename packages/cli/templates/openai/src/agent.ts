import OpenAI from 'openai';

export class OpenAIAssistant {
  private client: OpenAI;
  private assistantId?: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async createAssistant(name: string, instructions: string) {
    const assistant = await this.client.beta.assistants.create({
      name,
      instructions,
      model: 'gpt-4o',
    });
    this.assistantId = assistant.id;
    return assistant;
  }

  async createThread() {
    return this.client.beta.threads.create();
  }

  async runThread(threadId: string, assistantId?: string) {
    return this.client.beta.threads.runs.create(threadId, {
      assistant_id: assistantId || this.assistantId!,
    });
  }

  async getRun(runId: string, threadId: string) {
    return this.client.beta.threads.runs.retrieve(threadId, runId);
  }

  async getMessages(threadId: string) {
    return this.client.beta.threads.messages.list(threadId);
  }
}

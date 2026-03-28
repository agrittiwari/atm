import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { ChatPromptTemplate, MessagesPlaceholder } from 'langchain/prompts';

const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
});

const prompt = await pull<ChatPromptTemplate>('hwchase17/openai-functions-agent');

const agent = await createOpenAIFunctionsAgent({
  llm: model,
  tools: [],
  prompt: new ChatPromptTemplate({
    inputVariables: ['input', 'agent_scratchpad'],
    partialVariables: {
      agent_scratchpad: new MessagesPlaceholder('agent_scratchpad'),
    },
    messages: [
      new MessagesPlaceholder('agent_scratchpad'),
      ['human', '{input}'],
    ],
  }),
});

export const executor = new AgentExecutor({
  agent,
  tools: [],
});

export async function runAgent(input: string) {
  return executor.invoke({ input });
}

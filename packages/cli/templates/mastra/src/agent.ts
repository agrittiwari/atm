import { Agent } from '@mastra/core';

export const agent = new Agent({
  name: 'ATM Agent',
  instructions: 'You are a helpful AI agent.',
  model: {
    provider: 'OPENAI',
    name: 'gpt-4o',
  },
});

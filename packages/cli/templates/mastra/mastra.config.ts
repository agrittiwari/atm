import { createMastra } from '@mastra/core';

export const mastra = createMastra({
  agents: {
    agent: () => import('./src/agent'),
  },
});

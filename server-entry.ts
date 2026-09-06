import express from 'express';
import { registerKnowledgeRoutes } from './server/knowledge-routes';
import { registerKnowledgeAdapterRoutes } from './server/knowledge-adapter-routes';

const originalAll = express.application.all;
let knowledgeRoutesRegistered = false;

express.application.all = function patchedAll(path: string, ...handlers: any[]) {
  if (path === '/api/*' && !knowledgeRoutesRegistered) {
    registerKnowledgeRoutes(this);
    registerKnowledgeAdapterRoutes(this);
    knowledgeRoutesRegistered = true;
  }
  return originalAll.call(this, path, ...handlers);
};

import('./server.ts').catch((error) => {
  console.error('[THE FACTORY] Failed to start server:', error);
  process.exitCode = 1;
});

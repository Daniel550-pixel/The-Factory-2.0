import express from 'express';
import { registerKnowledgeRoutes } from './server/knowledge-routes';

const originalAll = express.application.all;
let knowledgeRoutesRegistered = false;

express.application.all = function patchedAll(path: string, ...handlers: any[]) {
  if (path === '/api/*' && !knowledgeRoutesRegistered) {
    registerKnowledgeRoutes(this);
    knowledgeRoutesRegistered = true;
  }
  return originalAll.call(this, path, ...handlers);
};

await import('./server.ts');

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { decisionPlane, gateway, brain, workforce, council, root, storage } from './runtime.mjs';
import { workers } from './adapters/mock-workers.mjs';
import { createResearchProviderFromEnv } from './adapters/research-provider.mjs';
import { runProductLab } from './workflows/product-lab.mjs';
import { runProductRndSlice } from './workflows/product-rnd-slice.mjs';
import { runDevLoop } from './workflows/dev-loop.mjs';

const port = Number(process.env.PORT ?? 8787);
const index = fs.readFileSync(path.join(root, 'public/index.html'));

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'access-control-allow-origin': '*' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body, null, 2));
}

async function readJson(req) {
  let body=''; for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/' && req.method === 'GET') return send(res, 200, index, 'text/html; charset=utf-8');

    if (req.url === '/api/state' && req.method === 'GET') {
      return send(res, 200, { audit: storage.listAudit(50), memory: brain.all() });
    }

    if (req.url === '/api/v2/state' && req.method === 'GET') {
      return send(res, 200, {
        projects: storage.list('project',{limit:50}),
        tasks: storage.list('task',{limit:100}),
        reports: storage.list('report',{limit:50}),
        knowledgeDebt: storage.list('knowledgeDebt',{limit:100}),
        audit: storage.listAudit(100)
      });
    }

    if (req.url === '/api/v2/product-rnd' && req.method === 'POST') {
      const payload=await readJson(req);
      const provider=createResearchProviderFromEnv();
      const result=await runProductRndSlice({
        idea:payload.idea,
        dataClass:payload.dataClass ?? 'INTERNAL',
        actor:payload.actor ?? 'user',
        storage,
        decisionPlane,
        researchProvider:provider
      });
      return send(res, 200, result);
    }

    if (req.url === '/api/demo' && req.method === 'POST') {
      const payload=await readJson(req);
      const idea = payload.idea || 'AI waiting-area multiplayer entertainment system';
      const product = await runProductLab({ idea, decisionPlane, council, brain });
      const development = await runDevLoop({ spec: `Build MVP for: ${idea}`, workforce, workers });
      const blocked = gateway.check({
        identity:{ role:'ENGINEER', actor:'demo-user', agent:'coder-1' },
        capability:'deploy.production',
        resource:'production',
        unattended:true
      });
      return send(res, 200, { product, development, blocked, audit: storage.listAudit(5) });
    }
    return send(res, 404, { error: 'not found' });
  } catch (error) { return send(res, 500, { error: error.message }); }
});

server.listen(port, () => console.log(`PM OS MVP: http://localhost:${port}`));

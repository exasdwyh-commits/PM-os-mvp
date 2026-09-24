import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { decisionPlane, gateway, brain, root, storage } from './runtime.mjs';
import { createResearchProviderFromEnv } from './adapters/research-provider.mjs';
import { ResearchExecutor } from './core/research-executor.mjs';
import { SourceFetchExecutor } from './core/source-fetch-executor.mjs';
import { EvidenceVerifier } from './core/evidence-verifier.mjs';
import { createRepositories } from './repositories/domain-repositories.mjs';
import { runProductRndSlice } from './workflows/product-rnd-slice.mjs';
import { resolveDataClass, verifyBearerToken } from './core/request-policy.mjs';

const port = Number(process.env.PORT ?? 8787);
const apiToken = process.env.PM_OS_API_TOKEN ?? null;
const host = process.env.HOST ?? (apiToken ? '0.0.0.0' : '127.0.0.1');
const serverActor = process.env.PM_OS_ACTOR ?? 'principal';
const baseDataClass = process.env.PROJECT_DATA_CLASS ?? 'INTERNAL';
const allowedOrigin = process.env.PM_OS_ALLOWED_ORIGIN ?? null;
const maxBodyBytes = 1024 * 1024;
const index = fs.readFileSync(path.join(root, 'public/index.html'));

function send(res, status, body, type='application/json; charset=utf-8') {
  const headers={ 'content-type': type };
  if (allowedOrigin) headers['access-control-allow-origin']=allowedOrigin;
  res.writeHead(status, headers);
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body, null, 2));
}

async function readJson(req) {
  const chunks=[];
  let total=0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBodyBytes) {
      const error=new Error('request-too-large');
      error.statusCode=413;
      throw error;
    }
    chunks.push(chunk);
  }
  const body=Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

const server = http.createServer(async (req, res) => {
  const requestId=randomUUID();
  try {
    if (req.url === '/' && req.method === 'GET') return send(res, 200, index, 'text/html; charset=utf-8');

    if (req.url?.startsWith('/api/') && !verifyBearerToken(apiToken,req.headers.authorization)) {
      return send(res,401,{error:'unauthorized',requestId});
    }

    if (req.url === '/api/state' || req.url === '/api/demo') {
      return send(res,410,{error:'legacy-endpoint-retired',use:'/api/v2/product-rnd',requestId});
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
      const researchExecutor=new ResearchExecutor({
        gateway,storage,provider,actor:serverActor
      });
      const sourceFetchExecutor=new SourceFetchExecutor({
        gateway,storage,actor:serverActor
      });
      const verifier=new EvidenceVerifier({identity:'evidence-verifier-v1'});
      const repositories=createRepositories(storage);
      const idempotencyKey=req.headers['idempotency-key'] ? String(req.headers['idempotency-key']).slice(0,200) : null;
      const result=await runProductRndSlice({
        idea:payload.idea,
        dataClass:resolveDataClass(baseDataClass,payload.dataClass),
        actor:serverActor,
        repositories,
        decisionPlane,
        researchExecutor,
        sourceFetchExecutor,
        verifier,
        idempotencyKey
      });
      return send(res, 200, result);
    }

    return send(res, 404, { error: 'not-found', requestId });
  } catch (error) {
    const status=error.statusCode ?? 500;
    console.error(JSON.stringify({requestId,error:error.message,stack:error.stack}));
    return send(res,status,{error:status===413?'request-too-large':'internal-error',requestId});
  }
});

server.listen(port, host, () => console.log(`PM OS V2: http://${host}:${port}`));

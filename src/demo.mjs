import { decisionPlane, gateway, storage } from './runtime.mjs';
import { MockResearchProvider } from './adapters/research-provider.mjs';
import { ResearchExecutor } from './core/research-executor.mjs';
import { SourceFetchExecutor } from './core/source-fetch-executor.mjs';
import { EvidenceVerifier } from './core/evidence-verifier.mjs';
import { createRepositories } from './repositories/domain-repositories.mjs';
import { runProductRndSlice } from './workflows/product-rnd-slice.mjs';

const idea = process.argv.slice(2).join(' ') || 'AI waiting-area multiplayer entertainment system';
const provider=new MockResearchProvider();
const researchExecutor=new ResearchExecutor({
  gateway,storage,provider,actor:'demo-principal'
});
const sourceFetchExecutor=new SourceFetchExecutor({
  gateway,storage,actor:'demo-principal'
});
const repositories=createRepositories(storage);
const verifier=new EvidenceVerifier({identity:'evidence-verifier-v1'});

const result=await runProductRndSlice({
  idea,
  repositories,
  decisionPlane,
  researchExecutor,
  sourceFetchExecutor,
  verifier,
  actor:'demo-principal',
  dataClass:'INTERNAL'
});
console.log(JSON.stringify(result,null,2));

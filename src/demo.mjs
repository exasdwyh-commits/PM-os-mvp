import { decisionPlane, gateway, storage } from './runtime.mjs';
import { MockResearchProvider } from './adapters/research-provider.mjs';
import { ResearchExecutor } from './core/research-executor.mjs';
import { runProductRndSlice } from './workflows/product-rnd-slice.mjs';

const idea = process.argv.slice(2).join(' ') || 'AI waiting-area multiplayer entertainment system';
const provider=new MockResearchProvider();
const researchExecutor=new ResearchExecutor({
  gateway,storage,provider,actor:'demo-principal'
});
const result=await runProductRndSlice({
  idea,
  storage,
  decisionPlane,
  researchExecutor,
  actor:'demo-principal',
  dataClass:'INTERNAL'
});
console.log(JSON.stringify(result,null,2));

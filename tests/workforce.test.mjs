import test from 'node:test'; import assert from 'node:assert/strict'; import { Workforce } from '../src/core/workforce.mjs';
const gateway={check:()=>({allowed:true})};
test('software loop separates coder qa reviewer and converges', async()=>{ const w=new Workforce({gateway}); let n=0; const r=await w.softwareLoop({spec:'x',maxRounds:3,coder:async()=>({v:++n}),qa:async({round})=>({pass:round>=2}),reviewer:async({test})=>({pass:test.pass})}); assert.equal(r.status,'accepted'); assert.equal(r.rounds,2); });

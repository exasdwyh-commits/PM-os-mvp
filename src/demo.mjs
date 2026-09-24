import { decisionPlane, gateway, brain, workforce, council } from './runtime.mjs';
import { workers } from './adapters/mock-workers.mjs';
import { runProductLab } from './workflows/product-lab.mjs';
import { runDevLoop } from './workflows/dev-loop.mjs';

const idea = process.argv.slice(2).join(' ') || 'AI waiting-area multiplayer entertainment system';
const product = await runProductLab({ idea, decisionPlane, council, brain });
const development = await runDevLoop({ spec: `Build MVP for: ${idea}`, workforce, workers });
const dangerous = gateway.check({
  identity:{ role:'ENGINEER', actor:'demo-user', agent:'coder-1' },
  capability:'deploy.production',
  resource:'production',
  unattended:true
});

console.log(JSON.stringify({ product, development, dangerousActionExample: dangerous, audit: gateway.audit }, null, 2));

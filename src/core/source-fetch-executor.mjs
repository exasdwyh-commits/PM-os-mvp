import { ToolBroker } from './tool-broker.mjs';
import { fetchSource } from './source-fetcher.mjs';

export class SourceFetchExecutor {
  constructor({gateway,storage,actor='principal',fetchImpl=globalThis.fetch}) {
    this.broker=new ToolBroker({
      gateway,
      storage,
      identity:{role:'VERIFIER',actor,agent:'source-fetcher'},
      tools:{fetchSource:input=>fetchSource({...input,fetchImpl})}
    });
  }

  async fetch({taskId,runId,url}) {
    let host;
    try { host=new URL(url).hostname; } catch { return {status:'blocked',reason:'invalid-source-url'}; }
    return this.broker.call({
      tool:'fetchSource',
      capability:'source.fetch',
      resource:`source:${host}`,
      taskId,
      runId,
      input:{url}
    });
  }
}

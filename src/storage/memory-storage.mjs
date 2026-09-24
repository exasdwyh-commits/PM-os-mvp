export class MemoryStorage {
  constructor() {
    this.records = new Map();
    this.events = [];
    this.audit = [];
    this.meta = new Map();
  }
  key(kind,id){ return `${kind}:${id}`; }
  put(kind,record){ this.records.set(this.key(kind,record.id),structuredClone(record)); return record; }
  get(kind,id){ const v=this.records.get(this.key(kind,id)); return v ? structuredClone(v) : null; }
  list(kind,{projectId=null,taskId=null,status=null,limit=100}={}){
    return [...this.records.entries()]
      .filter(([k])=>k.startsWith(`${kind}:`)).map(([,v])=>v)
      .filter(v=>!projectId||v.projectId===projectId)
      .filter(v=>!taskId||v.taskId===taskId)
      .filter(v=>!status||v.status===status)
      .slice(-limit).reverse().map(structuredClone);
  }
  appendEvent(event){ this.events.push(structuredClone(event)); return event; }
  listEvents({taskId=null,correlationId=null,limit=200}={}){
    return this.events.filter(e=>!taskId||e.taskId===taskId)
      .filter(e=>!correlationId||e.correlationId===correlationId)
      .slice(-limit).map(structuredClone);
  }
  appendAudit(entry){ this.audit.push(structuredClone(entry)); return entry; }
  listAudit(limit=200){ return this.audit.slice(-limit).reverse().map(structuredClone); }
  setMeta(key,value){ this.meta.set(key,structuredClone(value)); }
  getMeta(key){ const v=this.meta.get(key); return v===undefined?null:structuredClone(v); }
  close(){}
}

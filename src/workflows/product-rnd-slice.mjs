import { createHash } from 'node:crypto';
import { createProject, createTask, createKnowledgeDebt } from '../contracts/domain.mjs';
import { createEvidence, createReport } from '../contracts/artifacts.mjs';
import { createEvent } from '../contracts/events.mjs';

function event(storage, input, options) {
  const e=createEvent(input);
  storage.appendEvent(e, options);
  return e;
}

function lease(minutes=5){ return new Date(Date.now()+minutes*60*1000).toISOString(); }

function updateTask(storage, task, patch) {
  const next={...task,...patch,updatedAt:new Date().toISOString()};
  storage.put('task',next);
  return next;
}

function hashText(text){
  return createHash('sha256').update(String(text ?? ''),'utf8').digest('hex');
}

export async function runProductRndSlice({
  idea,
  storage,
  decisionPlane,
  researchExecutor,
  actor='user',
  dataClass='INTERNAL',
  idempotencyKey=null
}) {
  if (!idea?.trim()) throw new TypeError('idea is required');
  if (!researchExecutor?.run) throw new TypeError('researchExecutor is required');

  if(idempotencyKey){
    const completed=storage.getIdempotent('product-rnd-result',idempotencyKey);
    if(completed) return completed;
    const started=storage.getIdempotent('product-rnd-start',idempotencyKey);
    if(started){
      const project=storage.get('project',started.projectId);
      let task=storage.get('task',started.taskId);
      if(task && !['COMPLETED','FAILED','CANCELLED'].includes(task.status)){
        task=updateTask(storage,task,{status:'PAUSED',leaseUntil:null});
        event(storage,{
          type:'TASK_PAUSED',actor:'department-assistant',
          projectId:task.projectId,taskId:task.id,
          payload:{reason:'idempotent-retry-requires-resume'}
        });
      }
      return {project,task,recoveryRequired:true,idempotencyKey};
    }
  }

  const project=createProject({
    title:`Product R&D: ${idea.slice(0,80)}`,
    goal:'Evaluate market, formulation, cost and compliance opportunity.',
    owner:actor,
    dataClass
  });
  storage.put('project',project);

  const runId=`RUN-${project.id}`;
  let task=createTask({
    projectId:project.id,
    title:'Product opportunity evaluation',
    request:idea,
    mode:'DELEGATION',
    status:'INTAKE',
    stage:'INTAKE',
    origin:'USER',
    autonomyLevel:'A0',
    risk:'MEDIUM',
    priority:'HIGH',
    dataClass,
    attempt:1,
    runId
  });
  storage.put('task',task);
  if(idempotencyKey) storage.setIdempotent('product-rnd-start',idempotencyKey,{projectId:project.id,taskId:task.id});
  event(storage,{type:'TASK_CREATED',actor,projectId:project.id,taskId:task.id,payload:{title:task.title}});

  task=updateTask(storage,task,{status:'PLANNED',stage:'PLAN',lastCheckpointStage:'INTAKE'});
  const route=await decisionPlane.route({
    prompt:`Research product opportunity: ${idea}`,
    contextTokens:4000,
    dataClass
  },'balanced');
  event(storage,{type:'ROUTER_RECOMMENDED',actor:'department-assistant',projectId:project.id,taskId:task.id,payload:route});

  task=updateTask(storage,task,{
    status:'RUNNING',stage:'EXECUTE',lastCheckpointStage:'PLAN',leaseUntil:lease()
  });
  event(storage,{type:'TASK_STARTED',actor:'department-assistant',projectId:project.id,taskId:task.id,payload:{runId}});

  const execution=await researchExecutor.run({
    taskId:task.id,
    runId,
    idea,
    context:'Evaluate market, formulation, cost and compliance.',
    dataClass
  });

  if (execution.externalAttempted) {
    event(storage,{
      type:'EXTERNAL_DISCLOSURE',
      actor:'department-assistant',
      projectId:project.id,
      taskId:task.id,
      payload:{provider:execution.provider.id,dataClass,purpose:'product-rnd-research'}
    });
  }

  let providerError=null;
  let research;
  if (execution.status === 'ok') {
    research=execution.output;
  } else {
    providerError=execution.reason ?? 'research-unavailable';
    research={
      summary:'Specialist research failed or was blocked; no completion is claimed.',
      claims:[],
      unknowns:['Specialist research unavailable'],
      suggestedNextActions:[],
      securityFlags:[],
      quarantinedItems:[]
    };
  }

  if((research.securityFlags ?? []).length){
    event(storage,{
      type:'INJECTION_SUSPECT',
      actor:'sentinel',
      projectId:project.id,
      taskId:task.id,
      payload:{provider:execution.provider.id,flags:research.securityFlags,quarantinedItems:research.quarantinedItems ?? []}
    });
  }

  const evidence=[];
  const conclusionPairs=[];
  for (const claim of research.claims ?? []) {
    const quarantined=Boolean(claim.quarantined);
    const e=createEvidence({
      title:`Consultant claim: ${claim.area ?? 'general'}`,
      sourceType:execution.provider.external ? 'MODEL_OUTPUT' : 'MOCK',
      sourceName:execution.provider.id,
      trustTier:quarantined ? 'QUARANTINED' : 'ADVISORY',
      dataClass,
      untrustedInput:true,
      projectId:project.id,
      taskId:task.id,
      sourceUri:Array.isArray(claim.sourceUrls) ? (claim.sourceUrls[0] ?? null) : null,
      contentHash:hashText(claim.claim),
      metadata:{
        claim:claim.claim,
        sourceUrls:claim.sourceUrls ?? [],
        securityFlags:claim.securityFlags ?? []
      }
    });
    storage.put('evidence',e);
    evidence.push(e);
    event(storage,{type:'EVIDENCE_ADDED',actor:'department-assistant',projectId:project.id,taskId:task.id,payload:{evidenceId:e.id,trustTier:e.trustTier}});
    if(!quarantined) conclusionPairs.push({claim,evidence:e});
  }

  const debts=[];
  const unknowns=[...(research.unknowns ?? [])];
  if ((research.quarantinedItems ?? []).length) {
    unknowns.push('Some research content was quarantined because it resembled instructions or exfiltration attempts.');
  }
  if (providerError) unknowns.unshift(`Provider failure/block: ${providerError}`);

  for (const topic of research.unknowns ?? []) {
    const debt=createKnowledgeDebt({
      topic,
      reason:'Product R&D vertical slice could not verify this point with primary/authoritative evidence.',
      importance:'HIGH',
      projectId:project.id,
      taskId:task.id,
      suggestedExperts:['research-specialist']
    });
    storage.put('knowledgeDebt',debt);
    debts.push(debt);
    event(storage,{type:'KNOWLEDGE_DEBT_CREATED',actor:'knowledge-steward',projectId:project.id,taskId:task.id,payload:{knowledgeDebtId:debt.id,topic}});
  }

  task=updateTask(storage,task,{
    status:'VERIFYING',stage:'VERIFY',lastCheckpointStage:'EXECUTE',leaseUntil:lease()
  });

  const conclusions=conclusionPairs.map(({claim,evidence})=>({
    claim:claim.claim,
    claimKind:'FACT',
    evidenceLevel:'WEAK',
    evidenceIds:[evidence.id]
  }));
  if (!conclusions.length) {
    conclusions.push({
      claim:'No reliable specialist conclusion is available yet.',
      claimKind:'FACT',
      evidenceLevel:'UNKNOWN',
      evidenceIds:[]
    });
  }

  const report=createReport({
    title:`Product opportunity report: ${idea.slice(0,80)}`,
    projectId:project.id,
    taskId:task.id,
    executiveSummary:research.summary || 'Initial evaluation completed with unresolved evidence gaps.',
    conclusions,
    decisionsRequired:['Decide whether to continue into evidence-gathering and supplier validation.'],
    risks:[
      'Consultant/model output is advisory and is not treated as verified external evidence.',
      ...((research.quarantinedItems ?? []).length ? ['Instruction-like external content was quarantined and excluded from conclusions/actions.'] : [])
    ],
    unresolvedQuestions:unknowns,
    knowledgeDebtIds:debts.map(x=>x.id),
    nextActions:research.suggestedNextActions ?? []
  });
  storage.put('report',report);

  task=updateTask(storage,task,{
    status:'COMPLETED',stage:'REPORT',lastCheckpointStage:'VERIFY',
    reportId:report.id,leaseUntil:null
  });
  event(storage,{type:'TASK_COMPLETED',actor:'department-assistant',projectId:project.id,taskId:task.id,payload:{reportId:report.id,providerError}});

  const result={project,task,route,report,evidence,knowledgeDebt:debts,provider:{id:execution.provider.id,error:providerError}};
  if(idempotencyKey) storage.setIdempotent('product-rnd-result',idempotencyKey,result);
  return result;
}

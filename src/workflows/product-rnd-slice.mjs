import { createProject, createTask, createKnowledgeDebt } from '../contracts/domain.mjs';
import { createEvidence, createReport } from '../contracts/artifacts.mjs';
import { createEvent } from '../contracts/events.mjs';

function event(storage, input) {
  const e=createEvent(input);
  storage.appendEvent(e);
  return e;
}

function updateTask(storage, task, patch) {
  const next={...task,...patch,updatedAt:new Date().toISOString()};
  storage.put('task',next);
  return next;
}

export async function runProductRndSlice({
  idea,
  storage,
  decisionPlane,
  researchProvider,
  actor='user',
  dataClass='INTERNAL'
}) {
  if (!idea?.trim()) throw new TypeError('idea is required');

  const project=createProject({
    title:`Product R&D: ${idea.slice(0,80)}`,
    goal:'Evaluate market, formulation, cost and compliance opportunity.',
    owner:actor,
    dataClass
  });
  storage.put('project',project);

  let task=createTask({
    projectId:project.id,
    title:'Product opportunity evaluation',
    request:idea,
    mode:'DELEGATION',
    status:'INTAKE',
    origin:'USER',
    autonomyLevel:'A0',
    risk:'MEDIUM',
    priority:'HIGH',
    dataClass
  });
  storage.put('task',task);
  event(storage,{type:'TASK_CREATED',actor,projectId:project.id,taskId:task.id,payload:{title:task.title}});

  task=updateTask(storage,task,{status:'PLANNED'});
  const route=await decisionPlane.route({
    prompt:`Research product opportunity: ${idea}`,
    contextTokens:4000,
    dataClass
  },'balanced');
  event(storage,{type:'ROUTER_RECOMMENDED',actor:'department-assistant',projectId:project.id,taskId:task.id,payload:route});

  task=updateTask(storage,task,{status:'RUNNING'});
  event(storage,{type:'TASK_STARTED',actor:'department-assistant',projectId:project.id,taskId:task.id});

  let research;
  let providerError=null;
  const providerAllowed = (researchProvider.allowedDataClasses ?? ['PUBLIC']).includes(dataClass);
  try {
    if (!providerAllowed) throw new Error(`provider-not-allowed-for-data-class:${dataClass}`);
    if (researchProvider.external) {
      event(storage,{
        type:'EXTERNAL_DISCLOSURE',
        actor:'department-assistant',
        projectId:project.id,
        taskId:task.id,
        payload:{provider:researchProvider.id,dataClass,purpose:'product-rnd-research'}
      });
    }
    research=await researchProvider.research({idea,context:'Evaluate market, formulation, cost and compliance.'});
  } catch (error) {
    providerError=error.message;
    research={
      summary:'Specialist research failed; no completion is claimed.',
      claims:[],
      unknowns:['Specialist research unavailable'],
      suggestedNextActions:['Retry with an available approved research provider.']
    };
  }

  const evidence=[];
  for (const [i,claim] of research.claims.entries()) {
    const e=createEvidence({
      id:`EVD-${task.id}-${i+1}`,
      title:`Consultant claim: ${claim.area}`,
      sourceType:researchProvider.external ? 'MODEL_OUTPUT' : 'MOCK',
      sourceName:researchProvider.id,
      trustTier:'ADVISORY',
      dataClass,
      untrustedInput:true,
      projectId:project.id,
      taskId:task.id,
      metadata:{claim:claim.claim,sourceUrls:claim.sourceUrls}
    });
    storage.put('evidence',e);
    evidence.push(e);
    event(storage,{type:'EVIDENCE_ADDED',actor:'department-assistant',projectId:project.id,taskId:task.id,payload:{evidenceId:e.id}});
  }

  const debts=[];
  const unknowns=[...research.unknowns];
  if (providerError) unknowns.unshift(`Provider failure: ${providerError}`);
  for (const topic of unknowns) {
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

  task=updateTask(storage,task,{status:'VERIFYING'});
  const conclusions=research.claims.map((claim,i)=>({
    claim:claim.claim,
    claimKind:'FACT',
    evidenceLevel:'WEAK',
    evidenceIds:[evidence[i]?.id].filter(Boolean)
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
    risks:['Consultant/model output is advisory and is not treated as verified external evidence.'],
    unresolvedQuestions:unknowns,
    knowledgeDebtIds:debts.map(x=>x.id),
    nextActions:research.suggestedNextActions
  });
  storage.put('report',report);

  task=updateTask(storage,task,{status:'COMPLETED',reportId:report.id});
  event(storage,{type:'TASK_COMPLETED',actor:'department-assistant',projectId:project.id,taskId:task.id,payload:{reportId:report.id,providerError}});

  return {project,task,route,report,evidence,knowledgeDebt:debts,provider:{id:researchProvider.id,error:providerError}};
}

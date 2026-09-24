const LEVEL_ORDER={UNKNOWN:0,WEAK:1,SUPPORTED:2,STRONG:3,VERIFIED:4};

function uniqueHosts(evidence){
  return new Set(evidence.map(e=>{
    try{return new URL(e.sourceUri).hostname;}catch{return null;}
  }).filter(Boolean));
}

export class EvidenceVerifier {
  constructor({identity='verifier-v1'}={}) {
    this.identity=identity;
  }

  verifyClaim({claim,modelEvidence=[],sourceEvidence=[]}) {
    const usableSources=sourceEvidence.filter(e =>
      e.trustTier !== 'QUARANTINED' &&
      e.httpStatus >= 200 && e.httpStatus < 400 &&
      e.sourceUri
    );

    let evidenceLevel='UNKNOWN';
    const strongish=usableSources.filter(e=>['OFFICIAL','PRIMARY'].includes(e.trustTier));
    const reputable=usableSources.filter(e=>e.trustTier==='REPUTABLE');

    if (strongish.length >= 2 && uniqueHosts(strongish).size >= 2) evidenceLevel='STRONG';
    else if (strongish.length >= 1) evidenceLevel='SUPPORTED';
    else if (reputable.length >= 1) evidenceLevel='WEAK';

    const allEvidenceIds=[...modelEvidence,...usableSources].map(e=>e.id);
    return {
      claim:claim.claim,
      claimKind:claim.claimKind ?? 'FACT',
      evidenceLevel,
      evidenceIds:allEvidenceIds,
      verification:{
        verifierIdentity:this.identity,
        verifiedAt:new Date().toISOString(),
        sourceCount:usableSources.length,
        sourceHosts:[...uniqueHosts(usableSources)],
        note:evidenceLevel==='UNKNOWN'
          ? 'No independently fetched trusted source supports this claim yet.'
          : 'Evidence level reflects source provenance/fetch success only; semantic support still requires stronger verification before VERIFIED.'
      }
    };
  }

  verify({claims,modelEvidenceByClaim,sourceEvidenceByClaim}) {
    return claims.map((claim,index)=>this.verifyClaim({
      claim,
      modelEvidence:modelEvidenceByClaim[index] ?? [],
      sourceEvidence:sourceEvidenceByClaim[index] ?? []
    }));
  }
}

export function maxEvidenceLevel(levels){
  return levels.sort((a,b)=>(LEVEL_ORDER[b]??0)-(LEVEL_ORDER[a]??0))[0] ?? 'UNKNOWN';
}

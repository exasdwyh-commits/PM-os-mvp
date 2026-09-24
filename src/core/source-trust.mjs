const OFFICIAL_SUFFIXES=[
  'gov.cn','nhc.gov.cn','samr.gov.cn','nmpa.gov.cn',
  'fda.gov','nih.gov','clinicaltrials.gov','who.int'
];
const PRIMARY_SUFFIXES=['ncbi.nlm.nih.gov','pubmed.ncbi.nlm.nih.gov'];
const REPUTABLE_SUFFIXES=['reuters.com','apnews.com','nature.com','science.org'];

function hostMatches(host,suffix){
  return host === suffix || host.endsWith(`.${suffix}`);
}

export function classifySourceUrl(value){
  let url;
  try { url=new URL(String(value)); } catch { return {sourceType:'EXTERNAL',trustTier:'UNRATED',host:null}; }
  if (!['http:','https:'].includes(url.protocol)) return {sourceType:'EXTERNAL',trustTier:'UNRATED',host:url.hostname};
  const host=url.hostname.toLowerCase();
  if (OFFICIAL_SUFFIXES.some(x=>hostMatches(host,x))) return {sourceType:'OFFICIAL',trustTier:'OFFICIAL',host};
  if (PRIMARY_SUFFIXES.some(x=>hostMatches(host,x))) return {sourceType:'PRIMARY',trustTier:'PRIMARY',host};
  if (REPUTABLE_SUFFIXES.some(x=>hostMatches(host,x))) return {sourceType:'REPUTABLE',trustTier:'REPUTABLE',host};
  return {sourceType:'EXTERNAL',trustTier:'UNRATED',host};
}

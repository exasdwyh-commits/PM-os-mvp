export async function runProductLab({ idea, decisionPlane, council, brain }) {
  const route = await decisionPlane.route({ prompt: `Research and evaluate product idea: ${idea}`, contextTokens: 6000 }, 'balanced');
  const lessons = brain.lessons();
  const evidence = [
    { source: 'user-interviews', signal: 0.72 },
    { source: 'competitor-density', signal: 0.62 },
    { source: 'implementation-feasibility', signal: 0.81 }
  ];
  const result = await council.evaluate({ idea, evidence, lessons });
  const record = brain.remember({ type: 'product-decision', decision: result.decision, rationale: result, outcome: null, reflection: null });
  return { route, evidence, council: result, memory: record };
}

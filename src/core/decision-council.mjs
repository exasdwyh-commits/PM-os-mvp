export class DecisionCouncil {
  async evaluate({ idea, evidence = [], lessons = [] }) {
    const signals = evidence.map(x => x.signal ?? 0);
    const evidenceScore = signals.length ? signals.reduce((a,b)=>a+b,0) / signals.length : 0.5;

    const advocate = {
      stance: 'advocate',
      points: [
        'Can create value if the pain is frequent and measurable.',
        evidenceScore > 0.6 ? 'Evidence currently supports a test.' : 'Evidence is not yet strong enough for scale.'
      ]
    };
    const skeptic = {
      stance: 'skeptic',
      points: [
        'Check whether the apparent pain has willingness-to-pay behind it.',
        'Do not treat model agreement as market evidence.'
      ]
    };
    const risk = {
      product: evidenceScore < 0.45 ? 'high' : 'medium',
      execution: 'medium',
      compliance: /health|medical|finance|医疗|金融/.test(idea.toLowerCase()) ? 'high' : 'low'
    };

    let decision = 'TEST';
    if (evidenceScore >= 0.78 && risk.compliance !== 'high') decision = 'GO';
    if (evidenceScore < 0.35) decision = 'HOLD';

    return {
      idea, advocate, skeptic, risk, lessonsUsed: lessons.length,
      decision,
      confidence: Math.min(0.95, Math.max(0.55, 0.5 + Math.abs(evidenceScore - 0.5))),
      nextExperiment: 'Run the smallest reversible experiment that produces external user evidence.'
    };
  }
}

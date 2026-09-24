export class Workforce {
  constructor({ gateway }) { this.gateway = gateway; }

  async runTask({ agent, role, capability, input, worker, unattended = false, approved = false }) {
    const gate = this.gateway.check({ agent, role, capability, unattended, approved });
    if (!gate.allowed) return { status: 'blocked', gate };
    try {
      const output = await worker(input);
      return { status: 'ok', gate, output };
    } catch (error) {
      return { status: 'failed', gate, error: error.message };
    }
  }

  async softwareLoop({ spec, coder, qa, reviewer, maxRounds = 3 }) {
    const history = [];
    let artifact = null;
    for (let round = 1; round <= maxRounds; round++) {
      const code = await coder({ spec, round, previous: artifact, history });
      const test = await qa({ spec, artifact: code, round });
      const review = await reviewer({ spec, artifact: code, test, round });
      history.push({ round, code, test, review });
      artifact = code;
      if (test.pass && review.pass) return { status: 'accepted', rounds: round, artifact, history };
    }
    return { status: 'needs-human-review', rounds: maxRounds, artifact, history };
  }
}

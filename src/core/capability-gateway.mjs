import fs from 'node:fs';

export class CapabilityGateway {
  constructor(path) {
    this.policy = JSON.parse(fs.readFileSync(path, 'utf8'));
    this.audit = [];
  }

  check({ role, capability, unattended = false, approved = false, actor = 'demo-user', agent = 'unknown' }) {
    const grants = this.policy.roles[role] ?? [];
    const granted = grants.includes('*') || grants.includes(capability);
    const approvalRequired = this.policy.approvalRequired.includes(capability);
    const unattendedDenied = unattended && this.policy.denyUnattended.includes(capability);

    let allowed = granted && !unattendedDenied;
    let reason = allowed ? 'granted' : 'capability-not-granted';
    if (unattendedDenied) reason = 'denied-for-unattended-run';
    if (approvalRequired && !approved) { allowed = false; reason = 'human-approval-required'; }

    const row = { at: new Date().toISOString(), actor, agent, role, capability, unattended, approved, allowed, reason };
    this.audit.push(row);
    return row;
  }
}

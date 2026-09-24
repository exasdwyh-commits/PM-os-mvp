export class ToolBroker {
  constructor({ gateway, identity, tools = {} }) {
    if (!identity?.role) throw new TypeError('ToolBroker requires a runtime-bound identity');
    this.gateway = gateway;
    this.identity = Object.freeze({ ...identity });
    this.tools = { ...tools };
  }

  register(name, fn) {
    if (typeof fn !== 'function') throw new TypeError('tool must be a function');
    this.tools[name] = fn;
  }

  async call({
    tool,
    capability,
    resource = '*',
    taskId = null,
    actionHash = null,
    unattended = false,
    approvalGrant = null,
    input
  }) {
    const fn = this.tools[tool];
    if (!fn) return { status: 'blocked', reason: 'tool-not-registered' };

    const gate = this.gateway.check({
      identity: this.identity,
      capability,
      resource,
      taskId,
      actionHash,
      unattended,
      approvalGrant
    });
    if (!gate.allowed) return { status: 'blocked', gate };

    const output = await fn(input);
    if (approvalGrant?.singleUse) approvalGrant.usedAt = new Date().toISOString();
    return { status: 'ok', gate, output };
  }
}

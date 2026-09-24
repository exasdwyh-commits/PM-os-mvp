# PM OS V2 — 第三轮独立复审需求（只审最新版 main）

请对 GitHub 仓库：

`exasdwyh-commits/PM-os-mvp`

做一轮**基于当前 main 实际代码**的独立架构/安全/可靠性复审。

这次不要沿用上一轮报告的结论。上一轮之后仓库已经连续修改了 ToolBroker、Approval、HTTP boundary、recovery、idempotency、prompt-injection guard、Independent Verifier、Source Fetcher、KnowledgeDebt dedup、typed repositories 和 Golden Eval。

## 0. 强制前置步骤

请先：

1. checkout 当前 `main`；
2. 记录你实际审查的 commit SHA；
3. 运行：
   - `npm test`
   - `npm run eval:golden`
4. 完整阅读：
   - `docs/DEPARTMENT_AGENT_V2_BLUEPRINT.md`
   - `docs/V2_IMPLEMENTATION_ROADMAP.md`
   - `docs/GLOSSARY.md`
   - `docs/IMPLEMENTATION_STATUS.md`
   - `src/workflows/product-rnd-slice.mjs`
   - `src/core/tool-broker.mjs`
   - `src/core/research-executor.mjs`
   - `src/core/source-fetch-executor.mjs`
   - `src/core/source-fetcher.mjs`
   - `src/core/source-trust.mjs`
   - `src/core/evidence-verifier.mjs`
   - `src/core/untrusted-content.mjs`
   - `src/core/knowledge-debt-service.mjs`
   - `src/repositories/domain-repositories.mjs`
   - `src/storage/sqlite-storage.mjs`
   - `config/policies.json`
   - `tests/`
   - `evals/`

如果你发现上一轮报告中的某个问题已经修复，请明确写：

`FIXED IN CURRENT MAIN`

不要把旧问题再次当成当前 P0。

---

## 1. 当前设计原则

### Authority

```text
Human Principal
→ Sentinel / ToolBroker
→ Evidence / Independent Verifier
→ Department Assistant
→ Router / Experts / Digital Employees
```

### Epistemic Model

`claimKind` 描述命题本身：

- FACT
- INFERENCE
- ESTIMATE
- OPINION
- FORECAST

`evidenceLevel` 描述当前证据强度：

- VERIFIED
- STRONG
- SUPPORTED
- WEAK
- UNKNOWN

请注意：

**MODEL_OUTPUT 不等于 OPINION。**

例如：

> “FDA 在某日期批准了 X”

这是一个 FACT 类型命题，即使它暂时只是模型说的。

正确状态可以是：

```text
claimKind = FACT
sourceType = MODEL_OUTPUT
trustTier = ADVISORY
evidenceLevel = UNKNOWN
```

如果你不同意，请从 epistemic semantics 解释原因，不要只因为“来源是模型”就把命题类型改成 OPINION。

### Transaction

不要建议把一个包含网络/LLM 调用的长 workflow 整体包进单个 SQLite transaction。

当前原则：

```text
durable stage
→ short transaction/checkpoint
→ external work
→ next durable stage
```

请审查 stage/checkpoint 是否足够，而不是默认要求“整个任务一个大事务”。

### Storage

当前底层仍是 generic records store，但新增了：

`src/repositories/domain-repositories.mjs`

作为 typed repository boundary。

这是一人团队阶段的有意折中。

如果你认为现在必须拆成 per-entity tables，请提供**当前真实查询/一致性/性能问题**，说明为什么 typed repository 还不足以延后迁移。

不要仅以“规范上更漂亮”为理由把全量拆表列成 P0。

---

## 2. 上一轮后新增/修改的能力

请逐项验证代码，不要默认相信此列表：

### Governance
- V2 research 已通过 ResearchExecutor → ToolBroker。
- ToolBroker 内部 storage/gateway/tools/identity 已改为 private fields。
- SYSTEM 已移除 task.delegate。
- ApprovalGrant 已持久化、single-use 原子核销、防重放。

### HTTP
- actor 服务端绑定。
- dataClass 只能升级不能降级。
- localhost-only default。
- 可选 bearer token。
- body limit。
- legacy demo endpoint retired。

### Reliability
- task stage / runId / attempt / lease。
- stale RUNNING/VERIFYING → PAUSED recovery。
- Idempotency-Key。
- workflow start 原子占位。

### Untrusted content
- instruction-like scanner。
- QUARANTINED evidence。
- suspicious content 不进入 conclusion / nextActions。
- contentHash。
- URL protocol filtering。

### Source Fetch / SSRF boundary
- VERIFIER 有独立只读 source.fetch capability。
- Source Fetcher 只主动抓明确分级为 OFFICIAL / PRIMARY / REPUTABLE 的域名。
- unknown/unrated domain 不主动 fetch。
- redirect 使用 manual 模式。
- 每一跳重新做 allowlist 检查。
- 最大 redirect 次数、body size、timeout 都有限制。

### Independent Verifier v0.1
- 与 Research Executor 独立。
- model-only claim → UNKNOWN。
- 一个 clean official/primary fetched source → 最高 SUPPORTED。
- 两个独立 clean official/primary source hosts → 最高 STRONG。
- rules-only verifier **永远不会输出 VERIFIED**。
- 当前 verifier 主要证明 provenance / fetchability / trust tier，尚未证明 source text 对 claim 的完整 semantic entailment。

### Knowledge Debt
- 新增 normalized-key merge service。
- occurrences / lastSeenAt / taskIds 合并。

### Router
- 已记录 ROUTER_RECOMMENDED。
- task 完成后记录 ROUTER_OUTCOME_RECORDED，保留 recommended / selected / actual executor / outcome。

### Eval
- Golden Cases 已不只是 JSON。
- `evals/run.mjs` 可执行。
- CI 同时运行 `npm test` 和 `npm run eval:golden`。
- 当前 baseline 只覆盖已实现的第一批关键 case，不宣称覆盖全部 20 个。

---

# 3. 这次重点审查的问题

## A. Independent Verifier 是否真的独立

检查：

1. Verifier 是否可能被 Research Agent 控制？
2. Research output 是否能偷偷提升自己的 evidenceLevel？
3. Verifier 是否拥有过多 tool/capability？
4. verifier identity 是否真的和 researcher identity 隔离？
5. Department Assistant 是否可以覆盖 Verifier 的结论？
6. Report 是否保留 verifier provenance？

请特别判断：

当前 rules-only verifier：

```text
0 trusted fetched source → UNKNOWN
1 official/primary source → SUPPORTED
2 independent official/primary hosts → STRONG
never VERIFIED
```

是否足够保守。

如果仍然过于乐观，请给出具体攻击/误判例子。

---

## B. Source Fetcher / SSRF / Prompt Injection

请红队检查：

1. allowlist 是否存在 suffix matching 漏洞；
2. URL parsing / IDN / punycode / userinfo 是否可绕；
3. redirect 每跳重新检查是否正确；
4. DNS rebinding 是否仍是风险；
5. official domain open redirect 是否还能造成 SSRF；
6. body size / decompression bomb；
7. MIME type；
8. HTML/PDF/JS 内容；
9. source content 中 prompt injection；
10. rawContentPreview 是否可能污染后续 Agent。

不要只说“需要防 SSRF”，请基于当前实现构造实际 payload。

---

## C. Evidence Level 规则

检查以下问题：

- “URL 能成功 fetch”是否足以称 SUPPORTED？
- 是否需要 claim↔source semantic support check？
- 是否需要 quote/span provenance？
- 两个 source hosts 是否真的代表独立来源？
- PubMed/NIH/监管网站的 source type 是否应该细分？
- Official / Primary / Reputable 当前定义是否会误导？

请给出下一版 verifier 最小增强方案。

不要直接做大型事实核查平台。

---

## D. Typed Repository 方案

请审查：

`src/repositories/domain-repositories.mjs`

是否足够作为：

```text
business layer
→ typed repository
→ current generic SQLite store
→ later per-entity SQLite/Postgres
```

的迁移边界。

如果不够，请指出接口具体缺什么。

重点检查：

- query semantics；
- transaction boundary；
- unit of work；
- optimistic concurrency；
- domain-specific query；
- migration path。

但请区分：

`must fix now`

和

`can defer until Knowledge Steward / Proactive query pressure appears`。

---

## E. KnowledgeDebt 去重

检查现在 normalized-key 去重：

- 大小写
- 空格
- 标点
- Unicode normalize

是否足够。

请考虑：

> “供应商报价缺失”
> “缺少供应商最新价格”
> “供应商成本数据还没有”

这种语义相近但字符串不同的情况。

第一版应该：

- 用轻量规则？
- Laya classifier？
- embedding？
- LLM judge？

请给一个符合“一人团队”成本的方案，不要上复杂向量平台。

---

## F. Golden Eval Runner

请认真检查：

`evals/run.mjs`

重点：

1. 是否真的能阻止 regression？
2. 是否过于容易“为了过测试写死”？
3. baseline 设计是否合理？
4. 如何记录版本间变化？
5. 哪 5 个 Golden Case 应该下一批最优先变成 executable？
6. Laya/router 以后怎样进入 eval？
7. Prompt / Knowledge / Provider change 怎样走同一 release gate？

保持轻量，不要引入 MLflow/W&B 一类平台。

---

## G. Router / Laya readiness

现在已经有：

`ROUTER_RECOMMENDED`

和：

`ROUTER_OUTCOME_RECORDED`

请判断还缺什么，才能未来安全接 Laya。

例如：

- actual model/provider；
- latency；
- token/cost；
- human correction；
- verifier result；
- report acceptance；
- fallback reason；
- disagreement。

请给最小 telemetry schema。

---

## H. Approval 剩余风险

上一轮已经做了 durable single-use consume，但目前还没有完整 ApprovalService。

请检查：

- grant issuance integrity；
- approvedBy 是否可信；
- worker 是否还能伪造 grant；
- semantic duplicate grants；
- actionHash；
- channel；
- signature/HMAC；
- maxUses；
- expiration；
- approval API。

请判断这是否应该成为下一轮 P0/P1，以及最小实现应该是什么。

---

## I. Workflow / TaskRun

当前已经有：

- task.runId
- attempt
- leaseUntil
- durable stage
- recovery
- Idempotency-Key

但没有独立 `task_runs` table。

请判断：

1. 当前阶段是否已经必须引入 TaskRun entity/table；
2. 还是可以继续把 run state 放在 Task，等并发 worker/daemon 前再拆；
3. 哪个具体需求会成为“必须拆 TaskRun”的触发点。

不要仅因为大型系统通常有 task_runs 就要求现在加。

---

# 4. 请主动找新的问题

不要只验证我上面列的项目。

特别找：

- 我们刚修一个漏洞又引入的新漏洞；
- verifier 误升级；
- source fetch 新攻击面；
- eval 被轻易 game；
- dedup 误合并；
- idempotency 错误语义；
- recovery 数据损坏；
- ToolBroker private fields 仍可绕过的路径；
- provider / verifier 权限边界；
- Report provenance 丢失；
- 当前 IMPLEMENTATION_STATUS 是否又写得太乐观。

---

# 5. 输出要求

请按下面结构：

## 1. Reviewed Commit

写出：

- commit SHA
- npm test 结果
- npm run eval:golden 结果

如果没跑成功，不要假装成功。

## 2. Previous Findings Status

把上一轮主要问题逐项标：

- FIXED
- PARTIALLY FIXED
- STILL OPEN
- NO LONGER APPLICABLE

重点是确认修复，而不是重复报告。

## 3. New P0

最多 5 个。

只有可能导致：

- 安全事故
- 数据污染
- 事实可信度严重失真
- 并发/恢复破坏数据
- 后续重大重构

才算 P0。

每项给：

- 代码位置
- 攻击/失败路径
- 最小修复
- 测试方式

## 4. P1

真正重要但可以排在 P0 后面的。

## 5. False Positives / Do Not Change

明确指出：

- 哪些上一轮建议现在已经不成立；
- 哪些设计虽然不完美但当前阶段应保留；
- 哪些地方不要为了“企业级”过度重构。

## 6. Verifier Red Team

至少 5 个针对当前 Verifier / Source Fetch 的具体攻击或误判场景。

## 7. Eval Review

告诉我：

- 当前 8-case gate 是否有价值；
- 下一批最值得执行化的 5 个 case；
- 最小 baseline/version comparison 改造。

## 8. Revised Next 5 Steps

只给接下来 5 步。

不要重新给半年 Roadmap。

## 9. Patch-Level Advice

如果你是 coding agent，请告诉我：

> 现在第一优先会改哪 3 个具体文件/模块？

并解释原因。

---

# 6. 额外约束

- 不要因为模型输出来源是 MODEL_OUTPUT 就把 FACT 命题改成 OPINION。
- 不要建议把整个长时间 Agent workflow 包进一个数据库事务。
- 不要默认要求现在就全量拆 per-entity tables；需要给当前证据。
- 不要为了 Multi-Agent 而拆 Agent。
- 不要提前引入 Redis/Kafka/K8s/微服务/知识图谱/复杂向量平台。
- 不要只复述 Blueprint。
- 每个问题都尽量落到当前代码和测试。
- 如果某个问题已经修复，请直接确认，不要换一种措辞重新包装成问题。

目标不是证明架构“看起来高级”，而是判断：

> 这一版是否正在变成一个能长期运行、事实可信、安全可控、可以逐步进入主动工作的 Department AI Assistant。

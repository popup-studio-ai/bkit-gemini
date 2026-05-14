# D-축 (Context Engineering 철학) 심층 조사 보고서

**조사일:** 2026-05-14
**조사자:** gemini-researcher agent (D축 담당)
**대상 베이스라인:** bkit v2.0.7-upgrade (= Gemini CLI v0.42.0 stable 흡수 완료) + v0.43.0-preview.0 시그널
**조사 범위:** Gemini CLI 공식 정의, Anthropic/Cursor/외부 시각, bkit `PHASE_CONTEXT_MAP` 정합성

> 인용은 모두 URL + 작성일 + 원문 발췌를 동반. 추측은 "⚠️ 추가 확인 필요"로 명시.

---

## D.1 Gemini CLI Context Engineering의 공식 정의

### D.1.1 "Context Engineering"이라는 **명시 문구는 공식 docs에 없음** (관찰 사실)

- `https://github.com/google-gemini/gemini-cli/blob/main/README.md` (WebFetch 결과): "context engineering" / "Context Engineering" 0건. 다만 README는 다음을 핵심 기능으로 나열:
  - **Context Files (GEMINI.md)** — "Provide persistent context to Gemini CLI."
  - **Token Caching** — "Optimize token usage."
- `https://geminicli.com/docs/` (top-level docs index, 2026-05-14 시점): "Context Engineering" 명시 섹션 0건. "Agent Skills", "Subagents", "Remote subagents"는 명시.
- `https://geminicli.com/docs/cli/tutorials/memory-management/`: "context engineering" 미언급. 단 **`context`와 `memory`의 의미 분화는 명시**:
  - **Context**: "Project-wide rules and instructions loaded automatically"
  - **Memory**: "Persistent facts taught to the agent naturally through conversation"

→ **관찰 사실 1**: Gemini CLI는 "Context Engineering"이라는 *외부 용어를 공식 정의로 채택하지 않았다*. 대신 **명시화된 메커니즘 (GEMINI.md 3-tier, /memory commands, Skills, Subagents, ContextManager, Snapshotter)** 으로 동일 개념을 *실현*한다.

### D.1.2 Google의 "context-driven development" 공식 포지셔닝 (Conductor 블로그)

**출처**: https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/
**작성일**: 2025-12-17
**핵심 인용**:
- > "The philosophy behind Conductor is simple: control your code."
- > "Rather than depending on impermanent chat logs, Conductor helps you create formal specs"
- > "Markdown files to plan and track progress over time. These Markdown files persist in your repository"
- > "Plan before you build: Create specs and plans that guide the agent"
- > "Review plans before code is written, keeping you firmly in the loop."
- > "the human developer firmly in the driver's seat"

→ **관찰 사실 2 (중대)**: Google이 2025-12-17에 *공식 블로그에서* 채택한 "context-driven development" 철학은 **bkit의 PDCA + Phase-Aware Context Engineering 철학과 *거의 동형***이다:
  - Plan-before-build = bkit `/pdca plan` 단계
  - Persistent markdown = bkit `docs/01-plan` ~ `docs/04-report` PDCA 산출물
  - Human-in-loop / review plans before code = bkit "Always verify important decisions with user" (GEMINI.md Rule #4)
  - "control your code" = bkit "No Guessing" 원칙

### D.1.3 외부 식자들이 정의한 "Context Engineering" (Tobi Lütke, Karpathy, Anthropic)

#### Andrej Karpathy (2025-06-26)
**출처**: https://x.com/karpathy/status/1937902205765607626
**원문**: "+1 for 'context engineering' over 'prompt engineering'. People associate prompts with short task descriptions you'd give an LLM in your day-to-day use. When in every industrial-strength LLM app, context engineering is the delicate art and science of filling the context window"

#### Tobi Lütke (Shopify CEO, 2025-06 경)
**출처**: https://simonwillison.net/2025/jun/27/context-engineering/ (Simon Willison 인용)
**원문 (Tobi)**: "It describes the core skill better: the art of providing all the context for the task to be plausibly solvable by the LLM."
**원문 (Karpathy 부연)**: "task descriptions and explanations, few shot examples, RAG, related (possibly multimodal) data, tools, state and history, compacting ..."

#### Anthropic 공식 정의 (2025-09-29)
**출처**: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
**원문**: > "the set of strategies for curating and maintaining the optimal set of tokens (information) during LLM inference, including all the other information that may land there outside of the prompts."
**핵심 원리**: > "find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome."

#### 외부 식자 합의 (요약)
- **공통 정의**: "LLM 추론 시점에 *어떤 토큰들이 context window에 들어가는지*를 *시스템 차원에서* 설계·관리하는 학문"
- **prompt engineering과의 차이**: prompt = 단일 입력. context engineering = 시스템·생명주기·다중 채널 (RAG / tools / memory / sub-agent / compaction).

### D.1.4 등장 배경 (역사 추적)

| 사건 | 날짜 | 출처 |
|---|---|---|
| Tobi Lütke가 "context engineering" 용어를 X에 띄움 | ~2025-06 초 | Simon Willison 블로그 |
| Karpathy 동조 트윗 | 2025-06-26 | X.com/karpathy |
| Simon Willison 분석 게시 | 2025-06-27 | simonwillison.net |
| Faraaz Khan "Master Context Engineering with Gemini CLI" | 2025-07-05 | Medium |
| Anthropic 공식 글 "Effective context engineering for AI agents" | 2025-09-29 | anthropic.com |
| "A Look at Context Engineering in Gemini CLI" (Paul Datta) | 2025-09-18 | aipositive.substack.com |
| Google 공식 "Conductor: Introducing context-driven development for Gemini CLI" | 2025-12-17 | developers.googleblog.com |
| Anthropic Cookbook "Context engineering: memory, compaction, and tool clearing" | 2026-03-20 | platform.claude.com/cookbook |
| Gemini CLI **ContextManager 도입** (PR #24752) | 2026-04-13 | github.com/google-gemini/gemini-cli/pull/24752 |
| Gemini CLI **ContextManager + AgentChatHistory wire-up** (PR #25409) | 2026-04-27 | github.com/google-gemini/gemini-cli/pull/25409 |
| Gemini CLI **Auto Memory inbox + extraction.patch** (PR #26338) | 2026-05-04 | github.com/google-gemini/gemini-cli/pull/26338 |
| Gemini CLI **Snapshotter 개선** (PR #26655) | 2026-05-09 | github.com/google-gemini/gemini-cli/pull/26655 |
| Gemini CLI **Adaptive Token Calculator** (PR #26888) | 2026-05-12 | github.com/google-gemini/gemini-cli/pull/26888 |

→ **관찰 사실 3**: 2025-06 ~ 2026-05의 1년간 "Context Engineering"이 *업계 합의 용어*로 정착했고, Gemini CLI의 *내부 구현*은 정확히 같은 1년 동안 **ContextManager / Sidecar / Snapshotter / AdaptiveTokenCalculator / Auto Memory inbox**라는 5대 메커니즘으로 응답했다.

---

## D.2 Gemini CLI Context Engineering 핵심 원리 8개 (출처 명시)

Anthropic의 4대 전략 + Gemini CLI 자체 추가 원리를 **관찰 사실로만** 정리:

| # | 원리 | 출처 | 원문/근거 |
|---|---|---|---|
| **P1** | **Selective Loading via Hierarchy** | docs.geminicli.com/cli/tutorials/memory-management | 3-tier GEMINI.md (~/.gemini/GEMINI.md → project root → src/GEMINI.md). "Rules for every project / current repository / specific folder" |
| **P2** | **Progressive Disclosure (3-stage Skill)** | github.com/google-gemini/gemini-cli/issues/15327 | "Skills represent **on-demand expertise**. This allows Gemini to maintain a vast library of specialized capabilities…without cluttering the model's immediate context window." 3-tier: Discovery (metadata only) → Activation → Execution |
| **P3** | **Compaction** | Anthropic 공식 + Gemini CLI Snapshotter PR #26655 | (Anthropic) "the art of compaction lies in the selection of what to keep versus what to discard." (Gemini) "JSON-based patching for updating the 'Master State'…rolling window for chronological summaries." |
| **P4** | **Tool-Result Clearing** | platform.claude.com/cookbook (2026-03-20) | "drops old, re-fetchable results while keeping the record that the call happened." Gemini CLI에는 PR #25186 (native ToolDisplay) + 본 분석에서 *명시 등가 미발견* — ⚠️ 추가 확인 필요 |
| **P5** | **Structured Note-Taking (Agentic Memory)** | Anthropic + Gemini CLI Auto Memory (PR #26338) | (Anthropic) "agents regularly write notes persisted outside the context window." (Gemini) "Single canonical filename per kind: `extraction.patch`. Pending inbox contents are surfaced into the agent's initial context so it rewrites the existing patch incrementally rather than creating new files each session." |
| **P6** | **Sub-Agent Isolation** | Anthropic + Gemini CLI #25302/#25303 | (Anthropic) "Specialized sub-agents handle focused tasks with clean context windows while the main agent coordinates. Each sub-agent returns condensed summaries rather than exhaustive outputs." (Gemini) LocalSubagentProtocol / RemoteSubagentProtocol behind AgentProtocol abstraction. v0.43.0-preview.0 진입 |
| **P7** | **Human-in-the-Loop Approval Gate** | Gemini CLI Auto Memory (PR #26338) + Google Conductor 블로그 | (PR) "Nothing is applied automatically — the user reviews each entry in `/memory inbox` and approves or dismisses it." (Conductor) "Review plans before code is written" |
| **P8** | **Adaptive Budget Calibration** | Gemini CLI PR #26888 | "dynamically adjusts token estimation based on actual token counts received from the Gemini API"…"integrating the actual promptTokenCount from Gemini API responses into the token calculation feedback loop." |

추가 미확정 원리 (⚠️ 추가 확인 필요):
- **P9** "IDE Context Isolation" — aipositive.substack.com 2025-09-18에서 "The firehose of information from the IDE…is not dumped directly into the chat history. It's managed in a separate, isolated channel"이라 명시. ⚠️ 공식 PR/docs로 미검증.
- **P10** "Topic Narration Suppression" — bkit가 `general.topicUpdateNarration: false`를 락하지만, *공식이 narration을 context engineering의 안티패턴으로 분류했는지*는 ⚠️ 추가 확인 필요. PR #25586는 narration을 *default on*으로 promote → bkit과 충돌. (D.5 §6 참조)

---

## D.3 Gemini CLI 내부 구현 메커니즘 (PR 단위)

### D.3.1 ContextManager / Sidecar (v0.39.0+)
- **PR #24752** ("feat(core): introduce decoupled ContextManager and Sidecar architecture", joshualitt, merged 2026-04-13)
- **PR #25409** ("feat(core): wire up the new ContextManager and AgentChatHistory", joshualitt, merged 2026-04-27)
- 원문: > "By transitioning to a more robust event-driven approach with the new ContextManager and AgentChatHistory, the system gains better control over chat history lifecycles."
- 구성: ContextGraph / Node, SidecarRegistry processor, contextTokenCalculator, AgentChatHistory
- bkit 영향: `lib/gemini/version.js:189` `hasContextManagerSidecar: isVersionAtLeast('0.39.0')` 플래그 이미 존재. v2.0.7 코드 영향 없음 (내부 리팩토링).

### D.3.2 Snapshotter (v0.43.0-preview.0)
- **PR #26655** ("feat(context): Improvements to the snapshotter.", joshualitt, merged 2026-05-09)
- 원문: > "JSON-based patching for updating the 'Master State', enabling more granular control over facts, tasks, and constraints, including explicit deletion of obsolete items and a rolling window for chronological summaries."
- 보조: PR #26594 "loose boundary policy for gc backstop", PR #26534 "Fix chat corruption bug in context manager", PR #26452 "Fix hysteresis in async context management pipelines"
- bkit 영향: v0.42.0 stable에 *미포함*, v0.43.0-preview.0에 포함. 다음 cycle 모니터링.

### D.3.3 Adaptive Token Calculator (v0.43.0-preview.0)
- **PR #26888** ("feat(context): Introduce adaptive token calculator to more accurately calculate content sizes.", joshualitt, merged 2026-05-12)
- 원문: > "dynamically adjusts token estimation based on actual token counts received from the Gemini API…Uses EMA to adjust the `charsPerToken` heuristic between 0.5 and 2.0…Performs a one-time API call when resuming sessions with existing history, providing initial ground truth"
- 버그 수정 동반: default `charsPerToken` 4→3 정정
- bkit 영향: v0.42.0 stable 미포함. baseline runner 토큰 한계 정확성 향상 잠재.

### D.3.4 Auto Memory inbox + extraction.patch (v0.41.0+)
- **PR #26338** ("feat(memory): add Auto Memory inbox flow with canonical-patch contract", SandyTao520, merged 2026-05-04)
- 원문: > "Nothing is applied automatically — the user reviews each entry in `/memory inbox` and approves or dismisses it."
- > "Single canonical filename per kind: `extraction.patch`."
- > "`MemoryService` snapshots active memory before/after the extraction agent runs and rolls back any direct writes to MEMORY.md / sibling .md files."
- > "`isPathAllowed` denies main-agent writes to `<projectMemoryDir>/.inbox/` so the model can't bypass review by dropping its own patch files."
- 안전망: snapshot + rollback + `isPathAllowed` + `runWithScopedMemoryInboxAccess`
- 3 tier: private / global / skills (https://geminicli.com/docs/cli/auto-memory/: "off by default", "scans sessions idle ≥3 hours with ≥10 user messages")
- bkit 영향: `.gemini/settings.json`의 `experimental.autoMemory: false` 로 **잠금**. **충돌 가능성**. D.5 §M3 / D.7 §P1 참조.

### D.3.5 Sub-Agent Isolation (v0.43.0-preview.0)
- **PR #25302** ("feat(core): add LocalSubagentProtocol behind AgentProtocol", merged for v0.43.0-preview.0)
- **PR #25303** ("feat(core): add RemoteSubagentProtocol behind AgentProtocol")
- **PR #26934** ("introduce SubagentState enum for progress")
- bkit 영향: bkit 21 agents (`v2.1.0-agent-dispatch-fix-master-plan.md` 참조)가 새 `AgentProtocol`로 동작해야 함. ⚠️ 호환성 사전 검증 필요.

### D.3.6 Progressive Disclosure / Skills (v0.34.0+)
- **Issue #15327** "Epic: Agent Skills - Standardized Expertise & Progressive Disclosure"
- 원문: > "Skills represent on-demand expertise."
- > "Only metadata (name/description) is visible to the model initially" (Discovery)
- > "The full instruction set is loaded upon autonomous model request" (Activation)
- > "Supporting assets (scripts, references) are made available once the skill is active" (Execution)
- 표준: SKILL.md (YAML frontmatter + Markdown)
- 스코프: `.gemini/skills` (project) / `~/.gemini/skills` (user) / extension
- bkit 영향: bkit는 `skills/` 디렉터리 사용 + `LEVEL_SKILL_WHITELIST` (session-start.js:316) 로 Level-based filtering. **부분 정합** — 자세히는 D.5 §M4.

---

## D.4 bkit의 현재 Phase-Aware Context Engineering 분석

### D.4.1 정의 (자체 선언)
- `gemini-extension.json:8`: keywords에 `"context-engineering"` 포함
- `gemini-extension.json:4`: > "bkit Vibecoding Kit v2.0.6 - PDCA methodology + Phase-Aware Context Engineering for AI-native development with Gemini CLI"
- `GEMINI.md:3`: > "PDCA + Phase-Aware Context Engineering for Gemini CLI"
- `README.md:230`: > "**Phase-Aware Context** -- `PHASE_CONTEXT_MAP` loads only relevant context files per PDCA phase (plan/design/do/check/act/idle), reducing idle session tokens by ~60%"
- `CHANGELOG.md:73`: > "Phase-Aware Context Loading: Dynamic context injection per PDCA phase (71% token reduction)"

### D.4.2 핵심 구현물
- `hooks/scripts/session-start.js:260-313`: **`PHASE_CONTEXT_MAP`** + **`loadPhaseAwareContext`**
- 6 phases × 컨텍스트 파일 매핑:

| Phase | 로드 파일 | 파일 수 |
|---|---|---|
| `plan` | `commands.md, pdca-rules.md, feature-report.md, executive-summary-rules.md` | 4 |
| `design` | `pdca-rules.md, feature-report.md, executive-summary-rules.md` | 3 |
| `do` | `tool-reference-v2.md, skill-triggers.md, feature-report.md` | 3 |
| `check` | `pdca-rules.md, feature-report.md` | 2 |
| `act` | `pdca-rules.md, feature-report.md` | 2 |
| `idle` | `commands.md, pdca-rules.md, agent-triggers.md, skill-triggers.md, feature-report.md` | 5 (fallback) |

- **JIT dedup (v0.35.0+)**: `GEMINI_MD_IMPORTS = new Set(['commands.md', 'core-rules.md'])` — JIT 모드 활성 시 중복 토큰 회피 (session-start.js:269-288)
- **Slim SessionStart default (v2.0.5+)**: `BKIT_SESSION_START_VERBOSE` 설정 안 하면 단일 라인 출력. PR #25827 미포함 대응 (session-start.js:347-360)

### D.4.3 보조 메커니즘
- **7-Layer dataFlowIntegrity (M8)**: ⚠️ 본 조사에서 *코드 명시 미발견*. 사용자 메시지에 명시되었으나 grep 결과 0건. ⚠️ 추가 확인 필요 — 사용자 머릿속/내부 문서일 가능성.
- **Agent Memory scope (project vs user)**: `lib/core/agent-memory.js:38-43` — agentName별 격리. 스코프 분리.
- **Skill Visibility Control (Level-based)**: session-start.js:316-326 `LEVEL_SKILL_WHITELIST = { Starter: 5 skills, Dynamic: 19 skills, Enterprise: null (all) }`
- **Lock posture (`.gemini/settings.json`)**:
  ```json
  {
    "experimental": {
      "enableAgents": true,
      "autoMemory": false,
      "memoryManager": false,
      "gemma": false
    },
    "general": {
      "topicUpdateNarration": false
    }
  }
  ```
- **maxContextLength: 500** (`bkit.config.json:103`): output 압축 — Gemini CLI의 tool output emit과 다른 *bkit-server* MCP 출력 한정.

### D.4.4 측정 결과 자체 보고
- README.md: ~60% idle session token reduction
- CHANGELOG.md v2.0.0: 71% token reduction
- ⚠️ 두 수치 불일치 — *측정 방법론 명시 필요* (다음 sprint P2 검증 후보).

---

## D.5 bkit ↔ Gemini CLI Context Engineering 정합성 매트릭스 (21 항목)

범례:
- ✅ 적합: bkit이 Gemini CLI 공식 방향과 동일/보완
- 🟡 부분 적합: 일부 정합, 일부 차이
- 🔴 충돌: bkit가 명시적으로 잠금/우회한 공식 기능
- ⚪ 중립: 직접 비교 불가 / 영역 다름

| # | 항목 | bkit 현재 | Gemini CLI 공식 | 정합성 | 개선 기회 / 비고 |
|---|---|---|---|---|---|
| **M1** | Phase-aware loading | ✅ `PHASE_CONTEXT_MAP` 6 phases, ~60-71% token 절감 | ❌ *공식 미지원*. 정적 GEMINI.md 3-tier만 | 🟢 bkit 고유 가치. Conductor 철학 + Anthropic 4전략의 "Compaction → Selective" 정신과 정렬 | **유지 + 다음 단계: 다음 sprint에서 *Skill progressive disclosure*와 일관성 점검** |
| **M2** | GEMINI.md hierarchy (Global/Project/Sub) | 🟡 Project 1개만 + `@import` 2개 (`commands.md`, `core-rules.md`) | ✅ 3-tier 공식 (Global/Project/Sub) | 🟡 부분 적합 | bkit은 *프로젝트 단일* 사용. 사용자 `~/.gemini/GEMINI.md`와 충돌 가능성 ⚠️ 추가 확인. |
| **M3** | Auto Memory (autoMemory inbox + extraction.patch) | 🔴 `experimental.autoMemory: false` 잠금 | ✅ 공식 옵트인 권장 (off-by-default). PR #26338 inbox flow + canonical-patch contract | 🔴 충돌 | **현재**: bkit 자체 메모리 (`lib/core/memory.js` + `agent-memory.js`) 사용. **미래**: inbox flow를 *보조 채널*로 통합 — D.7 §P1 |
| **M4** | Memory Manager (memoryManager) | 🔴 `experimental.memoryManager: false` 잠금 (v0.41.x) | ✅ 옵트인 활성화 권장 | 🔴 충돌 | autoMemory 흡수 결정과 함께 검토 (D.7 §P2) |
| **M5** | Agent enablement | ✅ `experimental.enableAgents: true` (v0.36+) | ✅ default true (v0.37+) | ✅ 적합 | 그대로 |
| **M6** | Topic Update Narration | 🔴 `general.topicUpdateNarration: false` 잠금 | ✅ default `true` (PR #25586, v0.40.0 promote to general) | 🔴 충돌 | bkit 사용자가 narration noise 적다고 보고? ⚠️ 추가 확인 필요. Narration이 *context engineering 안티패턴*인지 *시그널인지* docs에 명문화 없음 (Anthropic 시점도 미언급) |
| **M7** | Gemma 4 default-on | 🔴 `experimental.gemma: false` 잠금 | ✅ default `true` (PR #26307, v0.42.0) | 🔴 충돌 (의도적) | bkit 베이스라인 안정성 + 사용자 명시 선택 권장. 정당. |
| **M8** | Sub-agent isolation | 🟡 21 bkit agents, 단 `LocalSubagentInvocation` 404 fallback 알려진 한계 (R-extra-1) | ✅ LocalSubagentProtocol / RemoteSubagentProtocol behind AgentProtocol (PR #25302/#25303, v0.43.0-preview.0) | 🟡 부분 적합 | **v2.1.0-agent-dispatch-fix sprint**가 이미 별도 계획. v0.43.0 stable 출시 시 AgentProtocol 정합성 검증 필요 |
| **M9** | Tool output compaction | 🟡 `bkit.config.json:maxContextLength: 500` — *bkit-server* MCP 출력 한정 | 🟡 native ToolDisplay refactor 진행 중 (PR #25186, v0.40.0~v0.43.0-preview.0) | ⚪ 중립 | bkit는 자체 MCP의 출력만 제어. Gemini CLI의 tool display layer는 별도. *Anthropic의 tool-result clearing 등가는 Gemini CLI에 ⚠️ 미확인* |
| **M10** | Skill Progressive Disclosure | 🟡 Level-based whitelist (`LEVEL_SKILL_WHITELIST`) — *visibility filter* | ✅ 3-tier progressive disclosure (Discovery/Activation/Execution) (Issue #15327) | 🟡 부분 적합 | bkit는 *whitelist*로 어떤 skill을 *보여줄지* 결정. Gemini CLI는 *3-tier 로딩 단계*를 결정. 두 개념은 *직교*. bkit이 SKILL.md 표준 부합/위반 여부 ⚠️ 검증 필요 |
| **M11** | Slim SessionStart systemMessage | ✅ `BKIT_SESSION_START_VERBOSE=false` default (Issue #25655 회피) | ⚪ N/A. PR #25827 v0.43.0-preview.0부터 자연 해소 | ✅ 적합 (방어). v0.43.0 stable 출시 시 제거 후보 | GEMINI.md:49: > "slated for removal in the v0.43.0 stable migration cycle" — 계획 적절 |
| **M12** | JIT context loading | ✅ `GEMINI_MD_IMPORTS` dedup (session-start.js:269-288) | ✅ JIT default on v0.35.0+ (v0.37.0에서 default off로 되돌림 then ?) ⚠️ 추가 확인 | ✅ 적합 (방어) | `hasJITContextLoading` flag 사용 (version.js:168). 정합. |
| **M13** | Persistent Markdown specs (Plan-before-build) | ✅ PDCA `docs/01-plan` ~ `docs/04-report` | ✅ Google Conductor 블로그 2025-12-17 정확히 동일 철학 | ✅ **고도 적합** (의도치 않은 동형) | **bkit이 1년 먼저 도달한 영역**. Conductor는 docs/PRD를 chat 외부로 옮기는 패턴 — bkit은 docs/PRD + analysis + report까지 6단계 PDCA로 구체화 |
| **M14** | Human-in-loop verification | ✅ GEMINI.md Rule #4: "Always verify important decisions with user" | ✅ Auto Memory inbox: "the user reviews each entry…approves or dismisses". Conductor: "Review plans before code is written" | ✅ 적합 (동형) | **재확인 가치 있음**: bkit이 1년 먼저 정착한 영역 |
| **M15** | "No Guessing" principle | ✅ session-start.js:159: "No Guessing: respect explicit user setting of enableAgents=false" | ✅ Conductor: "control your code" | ✅ 적합 | bkit이 시각화한 정신과 Conductor의 *control your code*가 일치 |
| **M16** | Compaction (Anthropic) | ⚪ bkit 자체 미구현 | ✅ Gemini CLI: Snapshotter (PR #26655) + JSON-patch master state + rolling window summaries | ⚪ 중립 (CLI layer) | bkit이 직접 다룰 영역 아님. Gemini CLI에 위임 |
| **M17** | Tool-Result Clearing (Anthropic) | ⚪ bkit 자체 미구현 | ⚠️ Gemini CLI 명시 등가 미확인 | ⚪ 중립 | ⚠️ 추가 확인 필요 — Anthropic cookbook 패턴이 Gemini CLI에 있는가? |
| **M18** | Structured Note-Taking (Anthropic) | ✅ `lib/core/agent-memory.js` per-agent JSON (project/user scope) | ✅ Auto Memory inbox + extraction.patch (PR #26338) | 🟡 *별도 시스템* | bkit과 Auto Memory 통합 시너지 가능. D.7 §P2 |
| **M19** | Adaptive Budget (PR #26888) | ⚪ bkit 자체 토큰 측정 없음 | ✅ AdaptiveTokenCalculator (PR #26888, v0.43.0-preview.0) | ⚪ 중립 (CLI layer) | bkit의 ~60-71% 절감 수치 *추정치*. AdaptiveTokenCalculator로 정확성 향상 — 다음 sprint 측정 도구로 활용 가능 |
| **M20** | IDE Context Isolation (aipositive Substack 인용) | ⚪ bkit IDE 연결 없음 | ⚠️ "managed in a separate, isolated channel" — 비공식 분석 | ⚪ 중립 | ⚠️ 공식 docs 미확인 |
| **M21** | Output style / Phase-aware formatting | ✅ `outputStyle` (bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise) | ⚪ N/A | ✅ bkit 고유 | 유지 |

### 정합성 종합 점수

- ✅ 적합 8건 (M1, M5, M11, M12, M13, M14, M15, M21)
- 🟡 부분 적합 5건 (M2, M8, M9, M10, M18)
- 🔴 충돌 4건 (M3, M4, M6, M7)
- ⚪ 중립/검증 필요 4건 (M16, M17, M19, M20)

→ **관찰 사실 4**: 충돌 4건 중 3건 (M3 autoMemory / M4 memoryManager / M7 gemma)은 *bkit이 의도적으로 안정성 목적으로 잠근* 것이고 정당화 근거가 명시 (GEMINI.md:37-42). 1건 (M6 topicUpdateNarration)은 *정당화 근거가 빈약* — bkit이 *narration이 context noise이므로 끄는 것*이 맞는지 vs *공식이 narration을 도입한 의도가 무엇인지*에 대한 명시 비교 부재. **D.8 §A1 안티패턴**.

---

## D.6 비교: Anthropic Claude / OpenAI / Cursor / Aider

| 도구 | Context Engineering 정의 | 핵심 메커니즘 | bkit 정합/차별화 영역 |
|---|---|---|---|
| **Anthropic Claude (Code)** | 공식 글 2025-09-29 + Cookbook 2026-03-20. "set of strategies for curating and maintaining the optimal set of tokens" | (1) Compaction `compact_20260112` (2) Tool-result clearing `clear_tool_uses_20250919` (3) Memory tool `memory_20250818` (4) Sub-agent. CLAUDE.md hierarchy + `.claude/rules/` + auto memory. | bkit-claude-code 별도 branch (CHANGELOG에 amends). cross-LLM 적합성 위해 Memory tool 호환 출력 형식 검토 후보 |
| **OpenAI** | 공식 *명시 context engineering* 글 미확인. ⚠️ Memory 시스템 (ChatGPT 자체) + Function calling tools만 존재 | 별도 *agent SDK* (Assistants v2): tools, threads, runs. context window 관리는 API 사용자 책임 | bkit과 직접 비교 어려움 (CLI 도구 아님) |
| **Cursor** | Project rules (`.cursor/rules/*.mdc`) + `@docs` ref. 명시 "context engineering" 용어 ⚠️ 추가 확인 | rules 자동 첨부 + glob 기반 선택 | bkit의 phase-aware loading과 *유사 컨셉* — bkit이 더 결정적 (PDCA phase ≡ explicit state) |
| **Aider** | `CONVENTIONS.md` + repo map | repo-map: tree-sitter 기반 *코드 구조 자동 요약* (Anthropic compaction 자체 구현) | bkit은 *문서 중심*, Aider는 *코드 중심*. 보완 가능 |

→ **차별화 영역**:
- **bkit이 *유일하게* 가지는 것**: (1) PDCA 6 phases × 명시 phase 추적 (2) explicit phase-based context loading (3) Level-based skill visibility (Starter/Dynamic/Enterprise) (4) Korean-first dev UX
- **bkit이 *부족한* 것**: (1) Compaction 자체 (Gemini CLI에 위임) (2) Tool-result clearing 등가 (3) Auto extraction (memoryInbox 잠금)
- **Cross-LLM 적합성 영역**: agentMemory JSON 포맷이 표준 SKILL.md / Anthropic memory tool 출력과 호환되도록 정규화 가능

---

## D.7 bkit v2.0.7-upgrade가 채택해야 할 Context Engineering 원리 (우선순위)

### P0 — 즉시 채택 (본 sprint 안에)

#### P0-1. **Conductor 철학 명문화: bkit ↔ Google "control your code" 동형성을 README/GEMINI.md에 인용**
- **정의**: Google 공식 블로그 (2025-12-17)가 채택한 "context-driven development" 철학이 bkit PDCA + Phase-Aware Context Engineering의 *수렴*이다. 이를 *공식 인용*으로 명시.
- **bkit 적용 변경**: `README.md` 또는 `GEMINI.md` 상단에 Conductor 블로그 인용 추가. 정합성 차트 1개.
- **UX 효과**: 사용자가 bkit의 가치 명제를 *외부 공식 출처*로 검증 가능. 신뢰도 ↑.
- **위험**: 거의 없음. 단 Google이 향후 철학을 변경하면 인용 갱신 필요.

#### P0-2. **M6 (topicUpdateNarration) 정당화 명문화 또는 잠금 해제 결정**
- **정의**: 현재 `topicUpdateNarration: false` 잠금의 근거가 *암묵*. (1) 정당화 근거를 GEMINI.md에 명시하거나 (2) 잠금 해제하거나.
- **bkit 적용 변경**: 옵션 A — `experimental.lockedSettings.md`에 narration 잠금 이유 명문화. 옵션 B — 잠금 해제 후 회귀 테스트.
- **UX 효과**: 사용자 환경 불일치 (사용자가 narration on을 기대) 해소.
- **위험**: 잠금 해제 시 narration 노이즈가 bkit context loading과 conflict 일으킬 가능성 ⚠️ 추가 확인.

#### P0-3. **agentMemory JSON 포맷을 Auto Memory `extraction.patch` 사양과 *나란히 정렬***
- **정의**: bkit의 `~/.gemini/agent-memory/bkit/<agent>.json`이 *bkit 전용 JSON*. 향후 P1 (D.7 §P1)에서 Auto Memory inbox flow를 옵트인 시 *불필요한 변환 비용*. **본 sprint에서 *명시적 매핑 문서*만 작성**.
- **bkit 적용 변경**: `docs/02-design/agent-memory-vs-extraction-patch-mapping.md` 작성. 코드 변경 없음.
- **UX 효과**: 미래 통합 비용 ↓.
- **위험**: 0.

### P1 — 본 sprint 안에 채택 가능 (조건: Acceptance gate 통과)

#### P1-1. **Auto Memory `inbox` *읽기 전용* 채널 활용 (autoMemory는 여전히 off)**
- **정의**: `experimental.autoMemory: false` *유지*하되, **`/memory inbox` 호출 시 *읽기 전용*으로 bkit 산출물과 표시되는지 검증**. 충돌 없는 *공존 모드*.
- **bkit 적용 변경**: `hooks/scripts/session-start.js`에서 `hasAutoMemoryInbox` 플래그 확인 후 inbox 존재 시 안내 1줄 표시.
- **UX 효과**: bkit 사용자가 Gemini CLI 신기능을 *알아차림*. autoMemory 활성 사용자도 bkit과 함께 사용 가능.
- **위험**: extraction agent가 bkit 산출물을 어떻게 인식하는지 ⚠️ 추가 확인 (P2 검증).

#### P1-2. **Slim SessionStart 제거 계획을 v0.43.0 stable에 *명시적*으로 묶기**
- **정의**: PR #25827이 v0.43.0-preview.0에 들어감. v0.43.0 stable 출시 시점에 `BKIT_SESSION_START_VERBOSE` slim default 폐기.
- **bkit 적용 변경**: `GEMINI.md:49`에 이미 명시됨. **본 sprint에서는 *capability flag* (`hasSessionStartSystemMessageFix`) 신설로 자동 감지 준비**.
- **UX 효과**: v0.43.0 출시 즉시 verbose 자동 활성화. 사용자 코드 변경 0.
- **위험**: PR #25827이 v0.43.0 stable에 누락될 가능성. v0.42.0 release 브랜치 cherry-pick 미흡 사례가 있어 ⚠️ 추가 확인 필요.

#### P1-3. **Skill SKILL.md 표준 부합 점검 (Issue #15327 progressive disclosure)**
- **정의**: bkit의 `skills/` 디렉터리가 SKILL.md 표준 (YAML frontmatter + Markdown procedural)을 따르는지 점검. 따르지 않을 시 점진적 정렬.
- **bkit 적용 변경**: `tests/suites/tcXXX-skill-md-conformance.js` 신설.
- **UX 효과**: Gemini CLI native skill resolver와 호환 — bkit 외에서도 skill 재사용 가능.
- **위험**: 일부 skill이 표준 비부합 발견 시 재작성 비용.

### P2 — 다음 sprint (v2.1.0 또는 v2.0.8) 위임

#### P2-1. **Auto Memory *옵트인* 모드 활성화 (autoMemory=true with bkit-safe defaults)**
- **정의**: `autoMemory: true`로 바꾸되, extraction agent의 patch가 bkit `docs/` PDCA 산출물에 *영향 주지 않도록* allowlist 강화 (`isPathAllowed` 활용).
- **bkit 적용 변경**: `.gemini/settings.json` 토글 + `experimental.lockedSettings.md`에 안전 패턴 명시.
- **UX 효과**: bkit 사용자가 Auto Memory의 *학습 효과*를 활용 가능.
- **위험**: extraction patch가 PDCA 산출물 손상 가능 — snapshot/rollback 안전망 신뢰도 검증 필요.

#### P2-2. **AdaptiveTokenCalculator (PR #26888) 결과를 활용한 bkit ~60-71% 절감 수치 *재측정***
- **정의**: 현재 bkit이 claim하는 토큰 절감 (60-71%)이 *정적 추정*. v0.43.0+ adaptive calculator로 정확 측정.
- **bkit 적용 변경**: `tests/perf/token-budget-v2.js` 신설.
- **UX 효과**: 신뢰도 ↑ + 정확한 수치 마케팅.
- **위험**: 실측값이 60% 미만 발견 시 narrative 조정 필요.

### P3 — 장기 (v2.2.0+)

#### P3-1. **Snapshotter (PR #26655) + Phase-Aware Context의 *시너지 모델***
- **정의**: Gemini CLI의 master-state snapshot + rolling window summary가 bkit phase 전환과 *어떻게 결합*되는지 설계.
- **위험**: 너무 이른 통합은 fragile. v0.43.0 stable 후 6개월 burn-in 후 시작.

#### P3-2. **Sub-Agent Protocol (PR #25302/#25303) 완전 정합 — bkit 21 agents 네이티브 register**
- **정의**: R-extra-1 (LocalSubagentInvocation 404 fallback) 해소를 `v2.1.0-agent-dispatch-fix` sprint에서 이미 계획. 본 D-axis 분석에서 *Sub-Agent Isolation* 원리 P6과 일치 확인.

---

## D.8 안티 패턴 (bkit이 현재 빠질 수 있는 함정)

### A1. "잠금 위주" 접근의 한계 — *정당화 부족 잠금*
- **현상**: `.gemini/settings.json`이 *4개 항목 모두 false*. 그 중 M3/M4/M7은 *명시 정당화* 있음 (GEMINI.md:37-42), M6 (`topicUpdateNarration`)은 *암묵*.
- **위험**: 사용자가 Gemini CLI 신기능을 *bkit 때문에 못 쓴다*고 인지. 잠금이 *기술 부채*화.
- **해소**: D.7 §P0-2 — 모든 잠금에 *명시 정당화 + 해제 trigger 조건* 명문화. 잠금 정책서 (`experimental.lockedSettings.md`) 신설.

### A2. *추정치 가드 부재* — 60-71% 절감 수치 검증 없음
- **현상**: README.md "60%" / CHANGELOG.md "71%" *불일치*. 측정 방법론 미명시.
- **위험**: 사용자 신뢰 손상.
- **해소**: D.7 §P2-2 — AdaptiveTokenCalculator로 재측정.

### A3. *신기능 활용 회피로 인한 stagnation*
- **현상**: v0.41.0 (Auto Memory inbox), v0.42.0 (canonical-patch), v0.43.0-preview.0 (Adaptive Token / Snapshotter / Subagent Protocol) — 모두 *Context Engineering core mechanism*. bkit이 *전부 잠금 또는 미사용*.
- **위험**: bkit이 *PDCA shell*만 제공하고 *내부는 Gemini CLI 기본*과 똑같아짐. 가치 제공이 *얇아짐*.
- **해소**: D.7 §P1-1 (inbox 읽기 모드) + §P1-3 (SKILL.md 표준 부합) + §P2-1 (autoMemory 옵트인 활성).

### A4. *PDCA-only 모드*에 갇혀 *외부 식자들이 합의한 4 strategies (Anthropic) 부재*
- **현상**: bkit은 *Plan-before-build*에 집중 (Conductor 철학 동형). 하지만 Anthropic이 정의한 4 strategies (compaction / tool-result clearing / structured note-taking / sub-agent) 중 bkit이 직접 다루는 건 *structured note-taking* (agent-memory) 일부.
- **위험**: bkit은 *문서 중심* 도구로 강하지만 *실행 시점 토큰 관리*는 약함.
- **해소**: 그 영역은 *Gemini CLI에 위임*하는 것이 정당. 단 bkit이 Gemini CLI의 4 strategies를 *방해하지 않는다*는 점을 명문화.

### A5. *Korean-first context vs Cross-LLM portability* 갈등
- **현상**: bkit이 Korean dev UX를 강조 (GEMINI.md, README). 동시에 Cross-LLM (bkit-claude-code branch) 진화 의도 보유.
- **위험**: Korean-specific assumptions이 Claude Code / OpenAI / Cursor에 *번역 손실*.
- **해소**: 본 sprint scope 아님. 다음 sprint에서 "i18n vs philosophy first language" 결정 회의 필요.

---

## D.9 핵심 결론 (요약 5줄)

1. **Gemini CLI는 "Context Engineering"을 *용어로* 채택하지 않았지만 *메커니즘으로* 5대 축 (ContextManager / Snapshotter / Auto Memory inbox / Adaptive Token / Subagent Protocol)을 v0.39~v0.43 구간에 *전면 실장*했다.**

2. **Google이 2025-12-17 발표한 "Conductor: context-driven development" 철학 (plan-before-build + persistent markdown + human-in-loop)은 bkit PDCA + Phase-Aware Context Engineering 철학의 *우연이 아닌 수렴*이다. bkit이 약 1년 먼저 도달.**

3. **bkit ↔ Gemini CLI 정합성 매트릭스 21 항목 결과: 적합 8 / 부분 적합 5 / 충돌 4 / 중립 4. 충돌 4건 중 3건은 *의도적 안정성 잠금*으로 정당. 1건 (topicUpdateNarration)은 *정당화 부재*로 본 sprint 정정 필요.**

4. **bkit의 *유일한* 차별화 가치 = (a) PDCA 6 phases × phase-based explicit context loading (b) Level-based skill visibility (Starter/Dynamic/Enterprise) (c) Plan-before-build의 Konfucius적 정형화. 잃지 말 것.**

5. **v2.0.7-upgrade sprint가 본 D-axis에서 채택해야 할 것 (우선순위 압축)**:
   - **P0**: Conductor 철학 인용 명문화 + topicUpdateNarration 정당화 + agentMemory ↔ extraction.patch 매핑 문서
   - **P1**: Auto Memory inbox 읽기 모드 + Slim SessionStart capability flag + SKILL.md 표준 점검
   - **P2**: autoMemory 옵트인 + AdaptiveTokenCalculator로 절감수치 재측정
   - **P3**: Snapshotter 시너지 + Subagent Protocol 정합 (v2.1.0-agent-dispatch-fix와 통합)

---

## D.10 조사 신뢰도

| 항목 | 신뢰도 | 근거 |
|---|---|---|
| Gemini CLI 공식 정의 부재 | ⬛⬛⬛⬛⬛ | README + docs/* 다중 WebFetch 직접 확인 |
| Conductor 블로그 인용 (D.1.2) | ⬛⬛⬛⬛⬛ | 공식 developers.googleblog.com 직접 인용 |
| Anthropic 4 strategies 정의 (D.5/D.7) | ⬛⬛⬛⬛⬛ | anthropic.com/engineering + platform.claude.com/cookbook 직접 인용 |
| Karpathy/Lütke 인용 (D.1.3) | ⬛⬛⬛⬛⬛ | x.com 직접 + simonwillison.net 2차 인용 |
| Gemini CLI 5대 메커니즘 PR 본문 (D.3) | ⬛⬛⬛⬛⬛ | PR #24752 / #25409 / #26338 / #26655 / #26888 직접 WebFetch |
| bkit 현재 상태 코드/설정 grep (D.4) | ⬛⬛⬛⬛⬛ | Read tool 직접 확인 (session-start.js, settings.json, agent-memory.js) |
| 정합성 매트릭스 평가 (D.5) | ⬛⬛⬛⬛⬜ | 21 항목 중 17건 출처 명시, 4건 ⚠️ 추가 확인 필요 표시 (M2/M9/M17/M20) |
| 비교 분석 Cursor/Aider (D.6) | ⬛⬛⬛⬜⬜ | Cursor/Aider 직접 docs 미열람. WebSearch 2차 출처 기반. ⚠️ Cross-LLM 정합성 필요 시 추가 조사 |
| bkit의 "7-Layer dataFlowIntegrity (M8)" | ⬛⬜⬜⬜⬜ | 코드/문서 grep 0건. 사용자 머릿속/구두 합의 가능성. ⚠️ 출처 확인 필요 |
| 60-71% 토큰 절감 수치 (D.4.4) | ⬛⬛⬜⬜⬜ | README/CHANGELOG 자체 보고. 측정 방법론 부재. ⚠️ 재측정 필요 (D.7 §P2-2) |
| D.7 우선순위 (P0-P3) 권고 | ⬛⬛⬛⬜⬜ | 본 조사 *해석/제안*. 사용자 확인 필요 |

---

## D.11 본 D-axis 조사의 한계 및 미해결

1. **"7-Layer dataFlowIntegrity (M8)"** 사용자 메시지에 명시되었으나 코드/문서 grep 결과 0건. ⚠️ 사용자에게 출처 확인 요청 필요.
2. **Tool-result clearing (Anthropic 패턴)** 등가가 Gemini CLI에 명시 존재하는지 미확인. ⚠️ PR #25186 (ToolDisplay refactor) 진행 중인 것은 표시되지만 *clearing semantic*은 미확인.
3. **"IDE Context Isolation"** (aipositive.substack.com 2025-09-18 인용)이 공식 PR/docs로 검증 안 됨. ⚠️ 비공식 분석 가능성.
4. **JIT context loading default 상태** v0.35 → v0.37에서 변동된 것으로 메모리에 기록됨. v0.42.0 현재 default 상태 ⚠️ 추가 확인.
5. **Cross-LLM 정합성 (Anthropic memory tool 호환)** D.7 §P0-3에서 매핑 문서만 작성 권고. 실제 호환 가능성 검증은 다음 sprint.
6. **bkit의 60% vs 71% 절감 불일치** 본 조사 외부. 측정 sprint 별도.

---

## 출처 인용 링크

### Gemini CLI 공식
- [google-gemini/gemini-cli/blob/main/README.md](https://github.com/google-gemini/gemini-cli/blob/main/README.md)
- [Gemini CLI Documentation Index](https://geminicli.com/docs/)
- [Manage context and memory | Gemini CLI](https://geminicli.com/docs/cli/tutorials/memory-management/)
- [Auto Memory | Gemini CLI](https://geminicli.com/docs/cli/auto-memory/)
- [Latest stable release: v0.42.0](https://geminicli.com/docs/changelogs/latest/)
- [Preview release: v0.43.0-preview.0](https://geminicli.com/docs/changelogs/preview/)
- [Agent Skills | Gemini CLI](https://geminicli.com/docs/cli/skills/)

### Gemini CLI PRs (핵심 5대 메커니즘)
- [PR #24752 — Decoupled ContextManager and Sidecar architecture](https://github.com/google-gemini/gemini-cli/pull/24752)
- [PR #25409 — Wire up new ContextManager and AgentChatHistory](https://github.com/google-gemini/gemini-cli/pull/25409)
- [PR #26338 — Auto Memory inbox flow with canonical-patch contract](https://github.com/google-gemini/gemini-cli/pull/26338)
- [PR #26655 — Improvements to the snapshotter](https://github.com/google-gemini/gemini-cli/pull/26655)
- [PR #26888 — Introduce adaptive token calculator](https://github.com/google-gemini/gemini-cli/pull/26888)
- [PR #25302 — LocalSubagentProtocol behind AgentProtocol](https://github.com/google-gemini/gemini-cli/pull/25302)
- [PR #25303 — RemoteSubagentProtocol behind AgentProtocol](https://github.com/google-gemini/gemini-cli/pull/25303)
- [Issue #15327 — Epic: Agent Skills - Standardized Expertise & Progressive Disclosure](https://github.com/google-gemini/gemini-cli/issues/15327)

### Google 공식 블로그
- [Conductor: Introducing context-driven development for Gemini CLI (2025-12-17)](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/)

### Anthropic 공식
- [Effective context engineering for AI agents (2025-09-29)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Context engineering: memory, compaction, and tool clearing (2026-03-20, Claude Cookbook)](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)

### 외부 식자 (Karpathy / Lütke / Willison)
- [Andrej Karpathy X post (2025-06-26)](https://x.com/karpathy/status/1937902205765607626)
- [Simon Willison — Context engineering (2025-06-27)](https://simonwillison.net/2025/jun/27/context-engineering/)

### 커뮤니티 분석
- [A Look at Context Engineering in Gemini CLI (Paul Datta, 2025-09-18)](https://aipositive.substack.com/p/a-look-at-context-engineering-in)
- [Master Context Engineering with Gemini CLI (Faraaz Khan, 2025-07-05)](https://faraazmohdkhan.medium.com/master-context-engineering-with-gemini-cli-how-to-build-smarter-ai-powered-workflows-3445814f5968)
- [Advanced Gemini CLI Part 1 — What's the Context? (Prashanth Subrahmanyam)](https://medium.com/google-cloud/advanced-gemini-cli-part-1-whats-the-context-6fd91326979b)
- [Apoo711/Context-Engineering framework](https://github.com/Apoo711/Context-Engineering)

### bkit 내부 산출물 (절대 경로)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/GEMINI.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/.gemini/settings.json`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/gemini-extension.json`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/bkit.config.json`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/hooks/scripts/session-start.js` (PHASE_CONTEXT_MAP at line 260)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/core/agent-memory.js`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/lib/gemini/version.js` (hasJITContextLoading, hasContextManagerSidecar, hasAutoMemoryInbox)
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.42.0-research.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-gemini/docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md`

**조사 완료**: 2026-05-14. D-axis (Context Engineering 철학).

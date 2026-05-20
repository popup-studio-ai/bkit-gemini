# E-축 (bkit 코드베이스) 심층 분석 보고서

**조사일**: 2026-05-14
**조사자**: bkit-impact-analyst agent (E축 담당, 재시도)
**대상 베이스라인**: bkit-gemini commit `1b452ef` (v0.42.0 stable 호환성 base + Gemma 4 차단 + 4 settings 잠금)
**조사 범위**: 5 압축 영역 (E.1~E.5) — 활용/고도화 관점에서 실측
**제약**: 추측 0건. 모든 평가는 `file:line` 인용.

> 본 보고서는 A/B/C/D 4축이 권고한 P0/P1 항목의 *bkit 코드 적용 가능성*을 실측한다.
> 4축 합의 핵심: bkit 1년 먼저 도달한 영역(M13/M14/M15) + 충돌 4건 중 1건 정당화 부재(M6 narration) + R-extra-1 사전 부채는 별도 sprint.

---

## E.0 Executive Summary

| 영역 | 핵심 발견 | 권고 결정 |
|---|---|---|
| **E.1 agent dispatch (R-extra-1)** | bkit `agents/*.md` 21개 중 **0건이 `kind:` 필드 없음** (필수 아님, default `local`). 모든 21개 frontmatter는 공식 schema와 *호환되는 필드*(`name`, `description`, `model`, `tools`, `temperature`, `max_turns`, `timeout_mins`)만 사용. **`mcp/bkit-server.js:52-181`의 `AGENTS` 레지스트리가 dual-path 실행**(bkit MCP + Gemini native). R-extra-1은 frontmatter 문제가 아닌 *`gemini-extension.json` 측 등록 메커니즘* 문제 — 별도 sprint `v2.1.0-agent-dispatch-fix` 위임 적정. | **본 sprint scope 외 — 별도 sprint 유지** |
| **E.2 SKILL.md 표준 부합** | 43개 SKILL.md 모두 `name` + `description` 보유 (공식 최소 요구 충족). **그러나 6개 파일에 duplicate `classification:` YAML key**(loop, plan-plus, pm-discovery, output-style-setup, batch, simplify) — 유효하지 않은 YAML, 마지막 값으로 silent override. 공식 schema는 `classification` 필드를 *모름* — bkit 자체 확장. *공식 schema 위반 0건*. | **본 sprint 안 — duplicate key 6건 수정 P1 (1h)** |
| **E.3 4 잠금 정당화** | `GEMINI.md:37-42`에 4 잠금이 명시되어 있고 3건은 충분한 정당화(gemma=Cx13 PR #26307, autoMemory=v2.1.0 cycle 흡수, memoryManager=v0.41.x opt-in). **M6 narration만 "topic-narration noise suppression" 1줄** — 정당화 근거가 빈약. 단, *마이그레이션 보고서* `docs/04-report/gemini-cli-v0.40.0-migration.report.md:60-117`에 "baseline runner stdout assertion 회귀 잠재" 명시 — 정당화 *존재하나 GEMINI.md에 누락*. | **본 sprint 안 — GEMINI.md:41에 baseline runner 회귀 방지 1줄 추가 P0 (15분)** |
| **E.4 agentMemory ↔ extraction.patch 매핑** | bkit `lib/core/agent-memory.js:178-188` 스키마 = `{version, agent, scope, lastUpdated, sessions[], patterns{commonGaps[], projectSpecificNotes}, stats{totalSessions}}` — JSON 객체. Gemini CLI Auto Memory = **unified diff `.patch` files under `<projectMemoryDir>/.inbox/<kind>/`** — 텍스트 패치. **format 불일치** — 자동 변환은 손실 없이 불가능 (JSON ↔ patch). 단, *추가 채널로 공존* 가능. | **본 sprint 안 — 매핑 *문서*만 작성(코드 변경 0). P0 (1.5h)** |
| **E.5 채택 가능 P0/P1 실측** | A/B/C/D 권고 9 항목 중 **본 sprint 안 채택**: 6건 (P0-1/P0-2 부분/P0-3/P0-5 부분/P1-2/P1-3). **별도 sprint 위임**: 3건 (P0-3 전체/P0-4/P1-1). 총 추정 시간 ~6-8h. | 아래 §E.5 상세 |

### 본 sprint 채택 권고 (요약)

| ENH | Priority | Source | bkit 변경 | 추정 시간 | Verdict |
|---|---|---|---|---|---|
| ENH-1 (Conductor 인용) | P0 | D.7 P0-1 / A.P0-1 | `README.md` + `GEMINI.md` 상단 1 섹션 추가 | 30분 | **채택** |
| ENH-2 (M6 narration 정당화 명문화) | P0 | D.7 P0-2 / E.3 anti-pattern A1 | `GEMINI.md:41` 1줄 → 3줄 확장 + baseline 회귀 근거 명시 | 15분 | **채택** |
| ENH-3 (agentMemory ↔ extraction.patch 매핑 문서) | P0 | D.7 P0-3 | 신규 `docs/02-design/agent-memory-vs-extraction-patch-mapping.md` | 1.5h | **채택** |
| ENH-4 (Auto Memory inbox 안내 capability flag) | P1 | D.7 P1-1 / A.P0-5 | `session-start.js`에 `hasAutoMemoryInbox` 조건부 1줄 안내 | 30분 | **조건부 채택** (안내만, 사용자 결정에 위임) |
| ENH-5 (`hasSessionStartSystemMessageFix` capability flag) | P1 | D.7 P1-2 / A.P1 | `lib/gemini/version.js`에 신규 플래그 + `session-start.js` 자동 감지 | 1h | **채택** |
| ENH-6 (SKILL.md duplicate `classification` 수정) | P1 | D.7 P1-3 / E.2 | 6개 파일 frontmatter 수정 | 30분 | **채택** |
| ENH-7 (Conductor 철학 ↔ PDCA 매트릭스) | P2 | D.7 P0-1 후속 | `README.md`에 비교 차트 추가 | 30분 | **선택적 채택** |
| ENH-8 (`--prompt` 1급 시민화 docs) | P2 | A.P0-1 | bkit docs 업데이트 | 1h | **선택적 채택** |
| ENH-9 (agents native 등록) | — | A.P0-3 | 별도 sprint `v2.1.0-agent-dispatch-fix` | — | **본 sprint scope 외** |
| ENH-10 (`/export-session` 활용) | — | A.P0-4 | v0.43.0 stable 출시 대기 | — | **본 sprint scope 외** |
| ENH-11 (GEMINI_SYSTEM_MD firmware) | — | A.P0-2 | system.md 신설 + ${AgentSkills} 변수 활용 | ~4h | **별도 sprint 위임** (scope 큼) |

---

## E.1 R-extra-1 (agent dispatch 사전 부채) — 근본 원인 + 본 sprint fix 가능성

### E.1.1 21 agent frontmatter 실측

bkit `agents/*.md` 21개 파일 frontmatter 필드 분포 (`grep` 측정):

| 필드 | 출현 횟수 | 누락 | 공식 schema (A.§3.2) 대비 |
|---|---|---|---|
| `name:` | 21/21 | 0 | ✅ **필수 충족** |
| `description:` | 21/21 | 0 | ✅ **필수 충족** |
| `kind:` | **0/21** | 21 | ⚠️ **선택 필드 — default `local`이라 미설정 OK** |
| `tools:` | 21/21 | 0 | ✅ 호환 |
| `model:` | 21/21 | 0 | ✅ 호환 |
| `temperature:` | 21/21 | 0 | ✅ 호환 |
| `max_turns:` | 21/21 | 0 | ✅ **공식 schema `max_turns` 일치** (A.§3.2) |
| `timeout_mins:` | 21/21 | 0 | ✅ 공식 schema 일치 |
| `mcpServers:` | 0/21 | 21 | ⚠️ 선택 필드, bkit MCP는 extension 레벨에 등록되어 있음 |

→ **관찰 사실 1**: bkit `agents/*.md` 21개의 frontmatter는 *모두 공식 schema에 정합한다*. R-extra-1의 원인은 frontmatter 비호환이 아니다.

근거 인용:
- `agents/cto-lead.md:1-43` — `name: cto-lead`, `model: gemini-3-pro`, `tools: [read_file, ..., tracker_visualize]`, `temperature: 0.4`, `max_turns: 30`, `timeout_mins: 15` (15 fields, 13 standard + 2 bkit-specific `triggers` in description)
- `agents/gap-detector.md:1-30` — 동일 schema 정합
- `agents/bkend-expert.md:1-36` — 동일
- `agents/pdca-iterator.md:1-41` — 동일

### E.1.2 dual-path 실행 메커니즘 (bkit MCP vs Gemini native)

bkit는 *두 개의 agent 실행 경로*를 가진다:

#### 경로 1: bkit MCP `spawn_agent` tool (작동 중)

- `mcp/bkit-server.js:52-181` — `AGENTS` registry 21개 enum, 각 항목에 `file`, `recommendedModel`, `safetyTier` 메타데이터 부여
- 작동: 사용자가 `spawn_agent({agent: 'code-analyzer', task: '...'})` MCP tool 호출 → bkit MCP가 child `gemini` 프로세스 spawn → `agents/code-analyzer.md` 프롬프트 적용
- 상태: **PASS** (PDCA 워크플로의 실제 사용 경로)

#### 경로 2: Gemini native subagent dispatch (FAIL — R-extra-1)

- 공식 메커니즘: `agents/*.md` frontmatter description으로 description-based 자동 위임, 또는 `@agent-name` 직접 호출 (A.§3.5)
- 작동 시도: `gemini -p "Use the code-analyzer agent to ..."` → `LocalSubagentInvocation.execute` HTTP 404 → `generalist` fallback (`docs/01-plan/sprints/v2.1.0-agent-dispatch-fix-master-plan.md:52-61`)
- 상태: **FAIL** (silent quality degradation)

→ **관찰 사실 2**: bkit는 *PDCA 워크플로 내부에서는* spawn_agent를 통해 21 agent를 정상 호출하지만, *사용자가 `gemini -p` CLI로 직접* 호출 시 native 경로가 작동하지 않는다.

### E.1.3 P0-3 "bkit 21 agents → native `agents/*.md` 등록 검증" 작업 정확한 스코프 (A.§11)

A축 권고 P0-3의 실제 작업 분해:

| 작업 | 범위 | 본 sprint 가능? | 근거 |
|---|---|---|---|
| (a) bkit 21 agents frontmatter ↔ 공식 schema 정합성 검증 | 21 file × 9 field = 189건 점검 | **이미 완료 (E.1.1)** — 모두 정합 | 위 E.1.1 표 |
| (b) `gemini-extension.json`이 agents를 등록 보장하는 schema 추가 | extension manifest의 *공식 agents 등록 필드 존재 여부* 확인 | **A축 미해소 + ⚠️ 추가 확인 필요** | A.§6.3에 manifest schema 8 fields 명시. agents 등록 필드 명시 없음. *"extension `agents/` 디렉토리에 `.md` 추가"*(A.§3.3)가 자동 등록 보장? — A축에서 명확히 검증 안 됨 |
| (c) `LocalSubagentInvocation` 내부에서 extension 번들 agents를 어떻게 탐색하는지 검증 | Gemini CLI 내부 코드 추적 | **불가능** — Gemini CLI 소스 직접 접근 안 됨 | C.§428 `LocalSubagentInvocation` 추상화 진행 중 — v0.43.0+에서 변경 가능성 High |
| (d) dual-env (v0.39.1 + v0.42.0) 21 agent 호출 21/21 PASS 확인 | actual smoke test | **본 sprint 외** — 별도 sprint `v2.1.0-agent-dispatch-fix` §F3에서 수행 | `docs/01-plan/sprints/v2.1.0-agent-dispatch-fix-master-plan.md:75-83` (R-2.1.0-1~5 위험 5건) |

→ **관찰 사실 3**: P0-3는 (a) 부분이 *이미 sprint 시작 전에 완료*이지만, (b)(c)(d)는 *Gemini CLI 내부 동작에 대한 의존*이 크고, **R-2.1.0-1 위험 ("gemini-extension.json schema가 agent registration을 지원하지 않음 — upstream 갭")**이 발생 시 본 sprint scope를 초과한다.

### E.1.4 본 sprint v2.0.7-upgrade 안에 fix 가능 vs 별도 sprint 위임

**가능한 작업** (본 sprint 안에서 1h):
- A.§3.9 검증 사항 (1): bkit agent `.md` frontmatter가 공식 schema 정합 → **이미 PASS, 1줄 분석 보고서 추가**
- A.§3.9 (3): bkit-server.js의 AGENTS registry vs Gemini native frontmatter 매핑 — **이미 완료, 매핑 문서화 가능**

**불가능한 작업** (별도 sprint `v2.1.0-agent-dispatch-fix`):
- R-2.1.0-1: `gemini-extension.json` schema 변경 (upstream 의존)
- R-2.1.0-2: 대체 dispatch 메커니즘 식별
- R-2.1.0-4: dual-env 검증 (21 agent × 2 env = 42 호출, 1.5h+)

### E.1.5 결론 — E.1

- **R-extra-1 fix는 본 sprint scope 외** (이미 결정됨, `docs/01-plan/sprints/v2.1.0-agent-dispatch-fix-master-plan.md` 작성됨)
- 본 sprint는 *P0-3의 (a) 부분만 수행* 가능 — frontmatter 정합성 분석 문서 (본 보고서 §E.1.1로 충당)
- A.§3.9 §확인 필요 1, 2, 3 모두 본 E.1으로 *closed*

---

## E.2 SKILL.md 표준 부합 점검

### E.2.1 43개 SKILL.md 실측 (`grep` 측정)

| 필드 | 출현 횟수 | 공식 schema (A.§8.2) | bkit 자체 확장? |
|---|---|---|---|
| `name:` | 43/43 (단, *frontmatter 외부 출현* 3건 — skill-create body 1건, phase-9-deployment body 1건, gemini-cli-learning body 1건, 모두 코드 예제 안) | ✅ 필수 (공식) | — |
| `description:` | 43/43 | ✅ 필수 (공식) | — |
| `classification:` | 43/43 (단, **6개 파일에 duplicate 출현**) | ❌ *공식 schema 없음* | ✅ **bkit 자체 확장** (W/C/H 또는 workflow/capability/hybrid) |
| `user-invocable:` | 43/43 | ❌ *공식 schema 없음* | ✅ **bkit 자체 확장** |
| `argument-hint:` | 43/43 (일부 빈 문자열) | ❌ *공식 schema 없음* | ✅ **bkit 자체 확장** |
| `allowed-tools:` | 43/43 | ❌ *공식 schema 없음* (subagent에는 있음) | ✅ **bkit 자체 확장** (subagent와의 cross-over) |
| `imports:` | 41/43 | ❌ *공식 schema 없음* | ✅ **bkit 자체 확장** |

> *주*: 위 count는 `grep ^name:` 등 raw 라인 카운트 — frontmatter 안과 body 안 모두 포함.

#### 공식 schema 부합 평가

A.§8.2 인용: > "공식 frontmatter는 오직 2필드 — `name`, `description`. subagent와 달리 `tools`, `model`, `temperature` 등은 frontmatter에 없음."

→ **관찰 사실 4**: bkit SKILL.md 43개 모두 *공식 필수 필드 100% 충족*. 추가 필드 5종은 bkit 자체 확장으로 *공식 schema를 어기지 않는다* (extra fields는 무시).

### E.2.2 Duplicate `classification:` 발견 (YAML 위반)

`grep -n` 결과:

| 파일 | 첫 출현 | 두번째 출현 | 값 충돌 |
|---|---|---|---|
| `skills/loop/SKILL.md` | `:3 classification: W` | `:23 classification: workflow` | W vs workflow |
| `skills/plan-plus/SKILL.md` | `:3 classification: W` | `:38 classification: hybrid` | W vs hybrid |
| `skills/pm-discovery/SKILL.md` | `:3 classification: H` | `:35 classification: workflow` | H vs workflow |
| `skills/output-style-setup/SKILL.md` | `:3 classification: W` | `:22 classification: capability` | W vs capability |
| `skills/batch/SKILL.md` | `:3 classification: W` | `:27 classification: workflow` | W vs workflow |
| `skills/simplify/SKILL.md` | `:3 classification: W` | `:25 classification: workflow` | W vs workflow |

→ **관찰 사실 5**: 6개 SKILL.md frontmatter가 *invalid YAML* (duplicate key) — JS YAML 파서는 *마지막 값을 채택*하므로 silent override. 공식 schema에는 이 필드가 *없으므로* Gemini CLI 동작에는 영향 0건. **bkit 자체 사용 (예: LEVEL_SKILL_WHITELIST 매칭)에 영향 가능성** ⚠️ — `lib/skills/visibility.js` 등에서 classification 필드를 어떻게 읽는지 ⚠️ 추가 확인 필요 (Out of E-axis scope).

또한 `skills/skill-create/SKILL.md:69` `classification: C` — body 안의 코드 예제 (line 67 ` ```markdown` 다음). 실제 frontmatter (line 3)만 `classification: C` 단일.

`skills/phase-9-deployment/SKILL.md:8 classification:` + `:108 name: Deploy` — line 108은 body의 다른 컨텍스트 (코드 예제).

### E.2.3 Name ↔ directory 일치 검증

`grep ^name:` 후 directory 이름과 비교: 43/43 일치 (frontmatter `name:` 값이 디렉토리명과 정확히 일치). A.§8.2 *"name must match the directory name"* 충족.

### E.2.4 결론 — E.2

- **공식 schema (name + description) 부합률**: 43/43 (100%)
- **bkit 자체 확장 5필드**: 공식 schema 위반 0건 (extra fields)
- **YAML duplicate key 위반**: **6개 파일** — silent fix만 필요
- **권고 ENH-6**: 6개 파일의 line 23-38 범위 duplicate `classification:` 라인 삭제 (30분)

---

## E.3 4 잠금 정당화 명문화 (D.7 §P0-2)

### E.3.1 `.gemini/settings.json` 4 잠금 실측

`.gemini/settings.json:1-11` 전체:
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

### E.3.2 각 잠금의 정당화 텍스트 위치 grep

#### M7 `experimental.gemma: false`
**정당화 위치**:
- `GEMINI.md:38` — *"prevents Gemini CLI v0.42.0's Gemma 4 default-on regression (Cx13 / PR #26307). Users wanting Gemma must opt in explicitly."*
- `README.md:219` — *"Cx13 Gemma 4 Default-On Lock"* 섹션
- `docs/04-report/gemini-cli-v0.42.0-migration.report.md` 다수
- `lib/gemini/version.js:234-236` — `hasGemmaDefaultOn` flag 주석

**평가**: ✅ **충분히 정당화됨** (3개 위치, PR 번호 + 행위 인용 + 기능 의도)

#### M3 `experimental.autoMemory: false`
**정당화 위치**:
- `GEMINI.md:39` — *"Auto Memory inbox flow (Cx2, introduced in v0.41.0) is opt-in; bkit defers adoption to the v2.1.0 cycle."*
- `README.md:220` (4개 잠금 enumeration)
- `docs/04-report/gemini-cli-v0.41.1-migration.report.md:40` — *"autoMemory/topic narration 명시 잠금"*
- `lib/gemini/version.js:226-227` — *"v2.1.0 cycle 채택 예정"* 주석

**평가**: ✅ **충분히 정당화됨** (시점 명시 + cycle 위임)

#### M4 `experimental.memoryManager: false`
**정당화 위치**:
- `GEMINI.md:40` — *"memoryManager (v0.41.x) is opt-in for the same reason."*
- `README.md:220`

**평가**: ✅ **충분히 정당화됨** (M3와 동일 reasoning)

#### M6 `general.topicUpdateNarration: false`
**정당화 위치 (직접)**:
- `GEMINI.md:41` — **"topic-narration noise suppression."** (단 1줄, 7 단어)
- `README.md:220` — 4개 잠금 enumeration만 (정당화 없음)

**정당화 위치 (간접 — 마이그레이션 보고서)**:
- `docs/04-report/gemini-cli-v0.40.0-migration.report.md:60-61` — *"`experimental.topicUpdateNarration` (default `false`) → `general.topicUpdateNarration` (default `true`). bkit baseline runner stdout에 multi-step 진행 narration 자동 추가 → noisy pattern 회귀 잠재 위험 1건"*
- `docs/04-report/gemini-cli-v0.40.0-migration.report.md:115-117` — 회귀 시나리오 명시
- `docs/04-report/gemini-cli-v0.41.1-migration.report.md:218,316` — Wave 1.3 + L2 사용자 환경 명시
- `docs/04-report/gemini-cli-v0.41.2-migration.report.md:69,170,237` — B2 risk + Wave 1.3

**평가**: 🟡 **부분 정당화** — 정당화 *근거는 존재*(baseline runner 회귀 방지)이지만 **GEMINI.md 자체에는 1줄만**. 사용자가 *GEMINI.md만 읽었을 때* 이유를 알 수 없다.

→ **관찰 사실 6 (중대)**: D.5 §M6 / D.8 §A1 분석이 confirmed. **M6는 *근거 부재*가 아닌 *근거 위치 불일치* 안티패턴**. *바로 사용자가 보는* GEMINI.md에 정당화가 누락되어 있고, 정당화는 마이그레이션 보고서 깊숙이 묻혀 있다.

### E.3.3 정당화 명문화 (또는 해제) 결정

**옵션 A — GEMINI.md:41 확장 (권고)**:
```diff
- - `general.topicUpdateNarration: false` — topic-narration noise suppression.
+ - `general.topicUpdateNarration: false` — bkit baseline runner stdout assertions(`tests/run-all.js`)는 deterministic 출력을 가정한다. v0.40.0 PR #25586이 narration을 default-on으로 promote하면서 multi-step 진행 라인이 stdout에 자동 추가됨 → noisy pattern 회귀 위험. baseline runner 회귀 방지를 위해 false 잠금. 사용자가 narration을 원하면 `~/.gemini/settings.json` user-scope에서 복구 가능.
```

**옵션 B — 잠금 해제**:
- 위험: baseline runner 회귀 (마이그레이션 보고서 4건이 모두 가리키는 정확한 risk)
- 이득: 사용자 환경 일치
- **권고하지 않음** — 회귀 위험이 명백히 명시되어 있음

### E.3.4 결론 — E.3

- 4 잠금 중 3건(M3, M4, M7) GEMINI.md 명시 충분
- 1건(M6) GEMINI.md 명시 *부족* — 마이그레이션 보고서에 정당화 존재
- **권고 ENH-2**: GEMINI.md:41을 옵션 A로 확장 (15분)
- 옵션 B(해제) 불권고 — 명시된 회귀 위험과 충돌

---

## E.4 agentMemory ↔ extraction.patch 매핑 (D.7 §P0-3)

### E.4.1 bkit agentMemory JSON 스키마 실측

`lib/core/agent-memory.js:178-188` `_createDefault()`:
```javascript
return {
  version: '1.0',
  agent: this.agentName,
  scope: this.scope,           // 'project' | 'user'
  lastUpdated: new Date().toISOString(),
  sessions: [],                // newest-first, max 20
  patterns: {
    commonGaps: [],
    projectSpecificNotes: ''
  },
  stats: { totalSessions: 0 }
};
```

**저장 위치**:
- User scope: `~/.gemini/agent-memory/bkit/<agent>.json` (`agent-memory.js:39-41`)
- Project scope: `<projectDir>/.gemini/agent-memory/bkit/<agent>.json` (`agent-memory.js:42`)

**session 구조** (`agent-memory.js:97-103`):
```javascript
{
  sessionId: string,
  timestamp: ISO string,
  summary: string,
  keyFindings: string[]
}
```

**rotation 정책** (`agent-memory.js:106-109`): 20개 초과 시 oldest trimmed.

### E.4.2 Gemini CLI Auto Memory extraction.patch 스키마 실측 (A.§4 인용)

- **포맷**: **unified diff `.patch` files** (텍스트, JSON 아님)
- **위치**: `<projectMemoryDir>/.inbox/<kind>/` (A.§4)
- **kind 종류**: skill / skill-update / memory(private/global) — 4가지 카테고리 (A.§4)
- **canonical-patch contract**: "Single canonical filename per kind: `extraction.patch`" (D.3.4 PR #26338 인용)
- **flow**:
  1. extraction agent가 idle session에서 추출 → `.inbox/<kind>/extraction.patch` 작성
  2. 사용자가 `/memory inbox` 호출 → 검토 → approve/dismiss (Human-in-the-loop, D.2 P7)
  3. approve 시 `MEMORY.md` 또는 적절한 위치에 패치 적용

### E.4.3 매핑 가능성 분석

| 속성 | bkit agentMemory | Auto Memory extraction.patch |
|---|---|---|
| **포맷** | JSON object | unified diff text |
| **저장 위치** | `~/.gemini/agent-memory/bkit/<agent>.json` 또는 `<projectDir>/.gemini/agent-memory/bkit/<agent>.json` | `<projectMemoryDir>/.inbox/<kind>/extraction.patch` |
| **scope** | project / user (2-tier) | private / global / skill / skill-update (4-tier) |
| **트리거** | bkit agents가 PDCA 단계 종료 시 `save()` 직접 호출 | extraction agent (idle session ≥3h + ≥10 messages, A.§4) |
| **승인 흐름** | 자동 (immediate) | manual (`/memory inbox` 검토) |
| **rotation** | 20 entries trim | inbox는 single canonical filename — 항상 incremental rewrite |
| **타깃 파일** | `<agent>.json` 자체 | `MEMORY.md` (private) / `SKILL.md` (skill 생성) / `<skill>/...` (skill 업데이트) |

→ **관찰 사실 7**: **두 시스템은 *목적이 다르다***.
- bkit agentMemory = **per-agent execution log** (session 누적 → agent의 자기 학습 컨텍스트)
- Auto Memory extraction.patch = **추출된 사실/스킬을 MEMORY.md/SKILL.md로 승격**하는 *제안* 흐름

### E.4.4 통합 시나리오

1. **수직 통합 시나리오 (둘이 같은 layer)**: bkit agentMemory ↔ extraction.patch 직접 변환 — **현실 불가능** (포맷 + 흐름 차이)
2. **수평 통합 시나리오 (둘이 다른 layer)**: bkit agentMemory가 *agent execution log*로 작동하면서, extraction agent가 *agent-memory.json을 input으로 읽어* extraction.patch를 만든다 — **가능** (extraction agent가 JSON 파일도 source로 인식 가능 ⚠️ 추가 확인 필요)
3. **공존 시나리오 (현 상태 유지)**: 두 시스템이 독립적으로 작동. bkit autoMemory false → extraction.patch 생성 안 됨. **현재 bkit 채택 방향**.

### E.4.5 매핑 문서 작성 권고 (ENH-3)

**산출물**: `docs/02-design/agent-memory-vs-extraction-patch-mapping.md`

**내용 (제안 — 본 sprint에서 작성)**:
1. 두 시스템의 *목적 차이* 명시 (위 §E.4.3 표)
2. 통합 시나리오 3개 분석 (위 §E.4.4)
3. 미래(v2.1.0+) autoMemory 옵트인 시 *어떤 시나리오를 채택할지* 결정 보류 — 단, 변환 비용 명시
4. **현재 결정**: 공존 (시나리오 3) — 본 sprint scope

**비용**: 1.5h, 코드 변경 0건

### E.4.6 결론 — E.4

- **자동 변환 불가능** (포맷 + 목적 차이)
- **공존 가능** (현 bkit 결정 = autoMemory off)
- **권고 ENH-3**: 매핑 문서만 작성. 코드 변경 0건. 미래 통합 비용 명시.

---

## E.5 v2.0.7-upgrade sprint 안에 채택 가능한 P0/P1 항목 실측 분석

### E.5.1 P0-1 Conductor 철학 README/GEMINI.md 인용

**소스**: D.7 P0-1 / A.P0-1 / B.P0
**작업**: Google 2025-12-17 Conductor 블로그 인용을 README/GEMINI.md 상단 추가
**변경 파일**:
- `README.md` — v2.0.7 Highlights 섹션(:215-225) 앞에 새 섹션 "Aligned with Google Conductor (2025-12-17)" 추가
- `GEMINI.md` — `## Rules` 섹션(:5) 앞에 1줄 인용 추가

**추정 시간**: 30분
**위험**: 거의 없음. Google이 향후 철학 변경 시 인용 갱신 필요.
**UX 효과**: 사용자가 bkit 가치 명제를 *외부 공식 출처*로 검증 가능. 신뢰도 ↑.
**Verdict**: ✅ **채택 (ENH-1)**

### E.5.2 P0-2 GEMINI_SYSTEM_MD firmware + `${AgentSkills}` 변수

**소스**: A.P0-2
**작업**: bkit이 시스템 prompt를 명시 관리 (`system.md`) + GEMINI.md는 strategy로 분리. `${AgentSkills}` `${SubAgents}` 변수 치환 활용.
**변경 파일**:
- 신규 `system.md` (~200줄, firmware rules)
- `GEMINI.md` 재정비 (strategy 부분만 남기고 firmware 부분 분리)
- `gemini-extension.json`에 `GEMINI_SYSTEM_MD=true` 환경 가이드 추가? — 단, **GEMINI_SYSTEM_MD는 환경 변수**이므로 extension.json에 직접 등록 불가능. bkit 사용자가 *수동으로 export* 해야 함 ⚠️
- 또는 `hooks/scripts/session-start.js`에서 자동 set ⚠️ (정합성 위험)

**추정 시간**: ~4h (firmware 분리 + 테스트)
**위험**:
- Mid — system.md ↔ GEMINI.md 분리 후 bkit 동작 회귀 잠재
- bkit 사용자 환경 변수 안내 필요 (DX 추가 부담)
- ${AgentSkills} 변수가 *실제로 작동*하는지 ⚠️ 추가 확인 필요 (A축에서 변수 치환 자체는 §6.5 명시되어 있으나 *시스템 prompt 안에서* 동작하는지 검증 필요)
**UX 효과**: 시스템 prompt를 *명시 관리*하면 사용자가 어떤 firmware rule이 적용되는지 알 수 있다. 그러나 *복잡성 증가*.
**Verdict**: ⚠️ **본 sprint 내 채택 불권고 — 별도 sprint 위임 (scope 큼, 위험 mid)** — ENH-11

### E.5.3 P0-3 agents native 등록

**소스**: A.P0-3 / E.1
**작업**: bkit 21 agents를 Gemini native 시스템에 정식 등록 → `@agent-name` 직접 호출 지원
**상태**: E.1.4 분석에 의해 *별도 sprint `v2.1.0-agent-dispatch-fix` 위임* 확정
**Verdict**: ❌ **본 sprint scope 외** — ENH-9 (별도 sprint)

### E.5.4 P0-4 `/export-session` 활용

**소스**: A.P0-4
**작업**: bkit baseline runner / 자동화에서 `/export-session` 사용 → deterministic replay
**상태**: PR #26514가 v0.43.0-preview.0에만 포함, v0.42.0 stable에 미포함
**변경 파일**: 본 sprint에서 *명문화만* 가능 — `docs/01-plan/research/v0.43.0-stable-migration.research.md` 작성
**Verdict**: ❌ **본 sprint scope 외** — v0.43.0 stable 출시 대기 (ENH-10)

### E.5.5 P0-5 Auto Memory inbox 가이드 + `.geminiignore`

**소스**: A.P0-5 / D.7 P1-1
**작업**:
- (a) 사용자가 `autoMemory: true`로 활성화한 경우의 가이드
- (b) `.geminiignore`에 `<projectMemoryDir>/.inbox/` 추가

**변경 파일**:
- `.geminiignore` 신규 생성 (`bkit-gemini/.geminiignore`) — bkit 자체 *플러그인* 디렉토리이므로 적용 대상은 *bkit 사용자의 프로젝트*, **bkit 자체에는 적용 안 함**. 따라서 `docs/`에 가이드만 작성.
- `docs/02-design/auto-memory-coexistence-guide.md` 신규

**추정 시간**: 1h
**위험**: 거의 없음. autoMemory false 유지 시 영향 0건.
**UX 효과**: autoMemory를 옵트인 한 사용자가 bkit과의 충돌 없이 사용 가능.
**Verdict**: ✅ **부분 채택 (ENH-4 + ENH-3 일부)** — `.geminiignore` 신규 생성은 *사용자 프로젝트* 가이드로 docs만, capability flag (E.5.6) 안내 추가

### E.5.6 P1-1 Auto Memory inbox 읽기 모드 안내 (session-start.js 변경)

**소스**: D.7 P1-1
**작업**: `experimental.autoMemory: false` 유지하되, **`session-start.js`에서 `hasAutoMemoryInbox` 플래그 확인 후 inbox 존재 시 안내 1줄 표시**
**변경 파일**:
- `hooks/scripts/session-start.js` — 신규 함수 `checkAutoMemoryInbox(projectDir)` 추가, `hasAutoMemoryInbox` flag (이미 `lib/gemini/version.js:227` 존재) 확인
- `lib/gemini/version.js:227` — 변경 없음 (flag 이미 존재)

**추정 시간**: 30분
**위험**:
- Low — autoMemory false 사용자에게는 영향 0
- autoMemory true 사용자에게 안내가 *추가 노이즈*가 되지 않도록 단일 라인 + dim 출력

**UX 효과**: autoMemory true 사용자가 *bkit이 inbox를 인지하고 있음*을 알 수 있다.
**Verdict**: ✅ **조건부 채택 (ENH-4)** — *읽기 전용* 안내만, *수정 안 함*

### E.5.7 P1-2 Slim SessionStart capability flag 신설

**소스**: D.7 P1-2 / A.P1
**작업**: `lib/gemini/version.js`에 `hasSessionStartSystemMessageFix` 신설 (PR #25827 v0.43.0-preview.0+) + `session-start.js`에서 자동 감지 → flag true 시 verbose 자동 활성화
**변경 파일**:
- `lib/gemini/version.js:150-300` 범위 — 신규 flag 1개 추가 (28 → 29)
- `hooks/scripts/session-start.js:347-360` — slim default 로직에 flag 분기 추가

**추정 시간**: 1h
**위험**: Low — flag 자체는 metadata, false 시 현 동작 유지
**UX 효과**: v0.43.0 stable 출시 시 사용자가 *bkit 코드 변경 없이* verbose mode 자동 활성화. `BKIT_SESSION_START_VERBOSE` env var 의존 해소.
**Verdict**: ✅ **채택 (ENH-5)**

### E.5.8 P1-3 SKILL.md 표준 부합 점검

**소스**: D.7 P1-3 / E.2
**작업**: 43개 SKILL.md frontmatter 검증 (완료 §E.2) + 6개 duplicate `classification:` 수정
**변경 파일**:
- `skills/loop/SKILL.md:23` — 삭제
- `skills/plan-plus/SKILL.md:38` — 삭제
- `skills/pm-discovery/SKILL.md:35` — 삭제
- `skills/output-style-setup/SKILL.md:22` — 삭제
- `skills/batch/SKILL.md:27` — 삭제
- `skills/simplify/SKILL.md:25` — 삭제

**추정 시간**: 30분 (수정 + 회귀 테스트)
**위험**: Low — duplicate key는 JS YAML 파서가 마지막 값 채택, 첫 값 삭제 시 동작 변경 가능성 ⚠️ — 그러나 분류 자체는 W=workflow, C=capability, H=hybrid로 *동일 의미*. 두 번째 값을 채택해야 시맨틱 보존.
- 단축형(W/C/H) → 풀네임(workflow/capability/hybrid) — bkit 자체 코드(`lib/skills/visibility.js` 등)가 어떤 형식을 기대하는지 ⚠️ 추가 확인 필요. 안전하게 *둘째 값 (workflow/capability/hybrid)을 채택*하고 첫째 값 삭제 권고.
**UX 효과**: invalid YAML 경고 0건 + 의미 명확화.
**Verdict**: ✅ **채택 (ENH-6)** — 단, *어떤 값을 채택할지*는 `lib/skills/visibility.js` 확인 후 결정

### E.5.9 P1-4 `--prompt` 1급 시민화 (bkit docs/SKILL.md 업데이트)

**소스**: A.P0-1
**작업**: bkit 문서에서 `gemini -p` 사용을 *권장 예제로* 명시 (현재는 16건 출현, 일부 비활성)
**변경 파일**:
- `README.md` — 자동화 예제 섹션에 `gemini -p "..."` 패턴 추가
- `skills/gemini-cli-learning/SKILL.md:4` — `--prompt` undeprecated 명시 (이미 4건 mention)
- `docs/` 일부 가이드 업데이트

**추정 시간**: 1h
**위험**: 거의 없음
**UX 효과**: 사용자가 bkit headless 자동화에 `--prompt` 사용을 *공식 권장*으로 인지.
**Verdict**: ✅ **선택적 채택 (ENH-8)** — sprint 시간 여유 시

### E.5.10 종합 시간 추정

| ENH | Priority | 추정 시간 | 위험 |
|---|---|---|---|
| ENH-1 Conductor 인용 | P0 | 30분 | 거의 없음 |
| ENH-2 M6 narration 정당화 명문화 | P0 | 15분 | 거의 없음 |
| ENH-3 agentMemory ↔ extraction.patch 매핑 문서 | P0 | 1.5h | 거의 없음 (코드 변경 0) |
| ENH-4 Auto Memory inbox 안내 (session-start.js) | P1 | 30분 | Low |
| ENH-5 hasSessionStartSystemMessageFix capability flag | P1 | 1h | Low |
| ENH-6 SKILL.md duplicate classification 수정 | P1 | 30분 | Low (⚠️ visibility.js 확인) |
| ENH-7 Conductor ↔ PDCA 매트릭스 (선택) | P2 | 30분 | 거의 없음 |
| ENH-8 --prompt 1급 시민화 docs (선택) | P2 | 1h | 거의 없음 |
| **합계 (P0+P1)** | — | **~4h** | LOW |
| **합계 (P0+P1+P2)** | — | **~6h** | LOW |

---

## E.6 본 sprint 채택 결론 매트릭스

| ENH | Priority | 영역 | 본 sprint 채택 | 별도 sprint? | 근거 |
|---|---|---|---|---|---|
| **ENH-1** Conductor 인용 | P0 | E.5.1 | ✅ **YES** | — | E.5.1 분석. 30분. 위험 거의 없음. |
| **ENH-2** M6 narration 정당화 명문화 | P0 | E.3 / E.5 | ✅ **YES** | — | E.3.4 분석. 15분. anti-pattern A1 해소. |
| **ENH-3** agentMemory ↔ extraction.patch 매핑 문서 | P0 | E.4 / E.5 | ✅ **YES** | — | E.4.6 분석. 1.5h. 미래 통합 비용 ↓. |
| **ENH-4** Auto Memory inbox 안내 capability | P1 | E.5.5 / E.5.6 | ✅ **YES (조건부)** | — | E.5.6 분석. 30분. 읽기 전용. |
| **ENH-5** `hasSessionStartSystemMessageFix` flag | P1 | E.5.7 | ✅ **YES** | — | E.5.7 분석. 1h. v0.43.0 stable 대비. |
| **ENH-6** SKILL.md duplicate classification 수정 | P1 | E.2 / E.5.8 | ✅ **YES** | — | E.2 + E.5.8 분석. 30분. invalid YAML 해소. |
| **ENH-7** Conductor ↔ PDCA 매트릭스 (선택) | P2 | E.5.1 후속 | 🟡 **선택적** | — | 30분. sprint 시간 여유 시. |
| **ENH-8** `--prompt` 1급 시민화 docs (선택) | P2 | E.5.9 | 🟡 **선택적** | — | 1h. sprint 시간 여유 시. |
| **ENH-9** agents native 등록 | — | E.1 / E.5.3 | ❌ **NO** | `v2.1.0-agent-dispatch-fix` | E.1.4 분석. 별도 sprint 작성됨. |
| **ENH-10** `/export-session` 활용 | — | E.5.4 | ❌ **NO** | v0.43.0 stable 출시 대기 | v0.42.0에 미포함. |
| **ENH-11** GEMINI_SYSTEM_MD firmware | — | E.5.2 | ❌ **NO** | 별도 sprint | 4h + 위험 mid. scope 큼. |

---

## E.7 본 sprint 권고 — "활용/고도화" 방향 재설계 요약

기존 사용자 평가: 본 sprint가 "차단/회피 방향" (4 잠금 강조 + R-extra-1 carry forward).

본 E-axis 분석이 제시하는 *재설계*:

### "차단/회피"만 강조 시 (현 상태)
- v2.0.7 Highlights = 4 lock + 9 capability flag + R-extra-1 carry forward
- 사용자 인지: "bkit이 v0.42.0의 신기능을 다 막았다"

### "활용/고도화"로 재설계 시 (권고)
- v2.0.7 Highlights = (기존 lock/flag) **+ Conductor 정렬 명문화 + autoMemory 공존 가이드 + SKILL.md duplicate 정리 + v0.43.0 forward compat flag**
- 사용자 인지: "bkit이 Google 공식 철학과 *정렬되었다*는 사실을 *외부 출처*로 인용함. 단순 잠금이 아닌 *의도적 설계 결정*임을 명문화."

### 추가 보너스 — bkit "1년 먼저 도달" 영역 강조 (D.5 §M13, §M14, §M15)
- M13 Persistent Markdown specs (PDCA 6단계) = Google Conductor 2025-12-17 동일 철학
- M14 Human-in-loop verification = Auto Memory inbox + Conductor 동형
- M15 "No Guessing" = Conductor "control your code" 정렬

→ **본 sprint의 *핵심 가치 명제*는 *"bkit이 1년 먼저 도달한 영역을 외부 공식 출처로 검증"*이다**.

---

## E.8 검증/추적 항목 (carry forward)

1. **`lib/skills/visibility.js`의 classification 필드 사용 형식** (단축형 W/C/H vs 풀네임 workflow/capability/hybrid) — ENH-6 적용 전 확인 ⚠️
2. **`${AgentSkills}` 변수가 시스템 prompt에서 실제 동작하는지** — ENH-11 (별도 sprint) 시 검증
3. **bkit `commands/` 디렉토리 내용** — A.§1226 §1227 검증 필요 (E축 범위에서 deferred)
4. **`gemini-extension.json`이 agents 등록을 보장하는 메커니즘** — v2.1.0-agent-dispatch-fix sprint §F1 research에서 해소
5. **Auto Memory extraction agent가 bkit agentMemory JSON을 source로 인식 가능 여부** — ENH-3 매핑 문서 작성 시 추가 확인

---

## E.9 file:line 인용 요약 (검증 가능한 모든 증거)

### Agent frontmatter (E.1)
- `agents/cto-lead.md:1-43` — 21 agent의 대표 example
- `agents/gap-detector.md:1-30`
- `agents/bkend-expert.md:1-36`
- `agents/pdca-iterator.md:1-41`
- `agents/code-analyzer.md:1-30`
- `agents/design-validator.md:1-30`
- `agents/qa-monitor.md:1-30`
- `agents/pm-lead.md:1-50`
- `agents/report-generator.md:1-30`
- `mcp/bkit-server.js:52-181` — AGENTS registry 21개

### SKILL.md (E.2)
- `skills/loop/SKILL.md:3,23` — duplicate classification
- `skills/plan-plus/SKILL.md:3,38`
- `skills/pm-discovery/SKILL.md:3,35`
- `skills/output-style-setup/SKILL.md:3,22`
- `skills/batch/SKILL.md:3,27`
- `skills/simplify/SKILL.md:3,25`
- `skills/pdca/SKILL.md:1-30`
- `skills/bkit-rules/SKILL.md:1-30`
- `skills/audit/SKILL.md:1-30`
- `skills/skill-create/SKILL.md:1-100`
- `skills/gemini-cli-learning/SKILL.md:1-45`
- `skills/phase-1-schema/SKILL.md:1-30`

### Locks 정당화 (E.3)
- `.gemini/settings.json:1-11` — 4 lock 정의
- `GEMINI.md:37-42` — 4 lock 정당화
- `GEMINI.md:41` — M6 narration 1줄 정당화
- `README.md:220` — 4 lock enumeration
- `docs/04-report/gemini-cli-v0.40.0-migration.report.md:60-117` — M6 간접 정당화
- `docs/04-report/gemini-cli-v0.41.1-migration.report.md:218,316`
- `docs/04-report/gemini-cli-v0.41.2-migration.report.md:69,170,237`
- `lib/gemini/version.js:226-227, 234-236` — flag 주석

### agentMemory (E.4)
- `lib/core/agent-memory.js:38-43` — getMemoryPath()
- `lib/core/agent-memory.js:97-103` — session 구조
- `lib/core/agent-memory.js:106-109` — 20-entry rotation
- `lib/core/agent-memory.js:178-188` — _createDefault() 스키마
- `lib/core/agent-memory.js:202-212` — getAgentMemory() factory (project/user scope routing)

### Capability flags (E.5)
- `lib/gemini/version.js:150-300` — 28개 flag 정의
- `lib/gemini/version.js:187` — hasInvokeAgent (v0.39.0+)
- `lib/gemini/version.js:195` — hasMemoryInbox (v0.39.0+)
- `lib/gemini/version.js:227` — hasAutoMemoryInbox (v0.41.0+)
- `lib/gemini/version.js:236` — hasGemmaDefaultOn (v0.42.0+)

### Sprint 위임 (E.1.4)
- `docs/01-plan/sprints/v2.1.0-agent-dispatch-fix-master-plan.md:1-100` — R-extra-1 별도 sprint 작성

### Session-start 흐름 (E.5.6)
- `hooks/scripts/session-start.js:159` — "No Guessing: respect explicit user setting"
- `hooks/scripts/session-start.js:260-313` — PHASE_CONTEXT_MAP + loadPhaseAwareContext
- `hooks/scripts/session-start.js:316-326` — LEVEL_SKILL_WHITELIST
- `hooks/scripts/session-start.js:347-360` — Slim SessionStart 주석

---

**조사 완료**: 2026-05-14. 본 보고서는 v2.0.7-upgrade sprint master plan으로 전달.

**총 분량**: ~9~12 sections × 평균 60줄 ≈ ~700 lines. file:line 인용 ≥ 50건.

**E-axis 결과 한 줄 요약**:
> bkit 코드베이스는 *공식 schema 위반 0건*, *4 잠금 중 3건 정당화 충분*, *agentMemory ↔ extraction.patch 자동 변환 불가*, *R-extra-1은 별도 sprint 위임 확정*. 본 sprint는 6 ENH(P0×3 + P1×3 ≈ 4h)를 통해 *활용/고도화 방향*으로 재설계 가능하다.

# bkit-gemini v2.0.5 — QA Report

> **Feature**: `bkit-gemini-v2.0.5` (post-Gemini CLI v0.39.0 migration full QA)
> **Branch**: `feature/v2.0.5-gemini-cli-v0.39.0-migration`
> **Date**: 2026-04-24
> **QA Levels Executed**: L1 (manifest/code) + L2 (hook/MCP runtime spawn) — Claude Code 환경
> **QA Levels Pending**: L3 (Gemini CLI 인터랙티브) — **사용자 직접 실행 (본 문서 §3)**
> **Result**: L1+L2 = **PASS** (37/37 + 5 SOFT no-op 정상 경로) · L3 = **MANUAL — 사용자 검증 대기**

---

## 0. 검증 대상 인벤토리 (Feature Surface)

| 카테고리 | 카운트 | 위치 |
|----------|--------|------|
| Skills | **43** | `skills/*/SKILL.md` |
| Agents | **21** | `agents/*.md` |
| Hook Events | **10** (handlers 11) | `hooks/hooks.json` |
| Hook Scripts | **10 .js + skills/ + utils/** | `hooks/scripts/` |
| MCP Server | **1** (bkit) | `mcp/bkit-server.js` + `mcp/start-server.sh` |
| MCP Tools | **12** (런타임 노출) | spawn_agent, list_agents, get_agent_info, team_create/assign/status, bkit_pm_run/qa_run/iterate/team_run, bkit_audit_query, bkit_checkpoint |
| Output Styles | **4** | bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise |
| Templates | **13** | `templates/*.template.md` |
| Lib Modules | **~30** | `lib/{core,gemini,pdca,intent,team,task}/` |
| Policies | **1 toml + 동적 생성** | `policies/bkit-extension-policy.toml` + level별 |
| Extension Manifest | v2.0.4 | `gemini-extension.json` |

---

## 1. L1 — 정적/Node 검증 (Claude Code 환경)

### 1.1 Manifest & Cross-References — **9/9 PASS**

| # | 항목 | 결과 |
|---|------|------|
| L1-01 | `gemini-extension.json` name = "bkit" | ✅ |
| L1-02 | `gemini-extension.json` version 존재 | ✅ ("2.0.4") |
| L1-03 | `contextFileName` includes "GEMINI.md" | ✅ |
| L1-04 | `mcpServers.bkit` 정의 + start-server.sh args | ✅ |
| L1-05 | `mcp/start-server.sh` 존재 | ✅ |
| L1-06 | `mcp/bkit-server.js` 존재 | ✅ |
| L1-07 | 등록된 11 hook handler 모두 스크립트 파일 존재 | ✅ |
| L1-08 | `bkit.config.json` testedVersions에 "0.39.0" 포함 | ✅ |
| L1-09 | `bkit.config.json` minGeminiCliVersion = "0.34.0" | ✅ |

### 1.2 Version Detector & Feature Flags — **13/13 PASS**

| # | 항목 | 결과 |
|---|------|------|
| L1-10 | `lib/gemini/version.js` 6개 함수 모두 export | ✅ |
| L1-11~17 | v0.39.0 환경에서 7개 신규 flag 모두 true | ✅ (`hasInvokeAgent`, `hasContextManagerSidecar`, `hasMcpAuthBlock`, `hasToolControlledDisplay`, `hasMemoryInbox`, `hasGeminiPlansDirEnv`, `hasUseAgentStream`) |
| L1-18~22 | v0.38.2 경계에서 같은 7개 flag 모두 false (boundary guard) | ✅ |

### 1.3 Skill Frontmatter 일관성 — **43/43 PASS**

`skills/*/SKILL.md` 43개 파일 모두 YAML frontmatter (`---`로 시작) 보유 + name 필드 추출 가능.

### 1.4 Test Suite — **94.8% PASS** (사전 baseline 노출)

| 지표 | 값 |
|------|-----|
| Total tests | 2018 |
| Pass | 1914 |
| Fail | **80** (모두 사전 baseline 이슈, 본 cycle 이전 존재) |
| Skip | 24 |
| Pass Rate | **94.8%** |
| **v0.39.0 cycle 자가 회귀** | **0건** |
| **본 cycle에서 회수** | **5건** (V156-14, VER-01/02/03, SS-24) |

**잔존 80건 분포**: PDCA-* 35 (lib/pdca/status.js phantom API, tc92) + TC80-* 9 + COMP-* 7 + TC94-* 5 + TC91-* 4 + TC110-* 4 + TC96-* 3 + TC109-* 3 + TC98-* 1 + tc92- 1 — 별도 cycle (`bkit-baseline-stabilization`) 권고.

상세: [`docs/03-analysis/gemini-cli-v0.39.0-do.analysis.md`](../03-analysis/gemini-cli-v0.39.0-do.analysis.md) §2.3.

---

## 2. L2 — Hook & MCP Runtime 검증 (spawn 기반)

### 2.1 모든 Hook 스크립트 spawn — **10/10 정상 경로**

본 세션에서 `child_process.spawn`으로 hook 스크립트를 직접 실행하고 stdout JSON 계약 검증.

| # | Hook | 입력 (stdin payload) | Exit | stdout | 결과 |
|---|------|--------------------|------|--------|------|
| L2-01 | `session-start.js` | (none) | 0 | 1 line valid JSON `{decision:'allow', systemMessage, metadata}` | ✅ PASS |
| L2-02 | `session-end.js` | `{}` | 0 | 1 line valid JSON | ✅ PASS |
| L2-03 | `before-agent.js` | `{prompt:'/pdca status', session_id:'test'}` | 0 | 1 line valid JSON | ✅ PASS |
| L2-04 | `before-model.js` | `{prompt:'hello', context:[]}` | 0 | empty (no-op normal path) | ~ SOFT |
| L2-05 | `after-model.js` | `{response:'ok', usage}` | 0 | 1 line valid JSON | ✅ PASS |
| L2-06 | `before-tool-selection.js` | `{available_tools:[...]}` | 0 | empty (no-op) | ~ SOFT |
| L2-07 | `before-tool.js` | `{tool_name:'read_file', args}` | 0 | empty (no-op) | ~ SOFT |
| L2-08 | `after-tool.js` | `{tool_name:'read_file', result:'ok'}` | 0 | empty (no-op) | ~ SOFT |
| L2-09 | `after-agent.js` | `{agent_name:'test'}` | 0 | empty (no-op) | ~ SOFT |
| L2-10 | `pre-compress.js` | `{tokens_to_compress:1000}` | 0 | 1 line valid JSON | ✅ PASS |

**SOFT 의미**: hook은 정상적으로 exit 0 했으나 의미 있는 결정 페이로드가 없어 stdout 비어있음. Gemini CLI hook 계약상 정상. 입력 컨텍스트가 게이트 조건을 만족하지 않을 때의 기본 경로.

### 2.2 MCP Server stdio 핸드셰이크 — **3/3 PASS**

| # | 검증 | 결과 |
|---|------|------|
| L2-11 | `bash mcp/start-server.sh` 후 JSON-RPC `initialize` 응답 | ✅ `serverInfo: {name: 'bkit', version: '2.0.4'}` |
| L2-12 | `tools/list` 응답에 12개 tool 모두 노출 | ✅ spawn_agent, list_agents, get_agent_info, team_create, team_assign, team_status, bkit_pm_run, bkit_qa_run, bkit_iterate, bkit_team_run, bkit_audit_query, bkit_checkpoint |
| L2-13 | `tools/call name=list_agents` → 21개 agent JSON 반환 | ✅ 첫 4개 (gap-detector, design-validator, pdca-iterator, code-analyzer) 정상 노출 확인 |

### 2.3 Issue #25655 방어 카나리아 — **8/8 PASS** (tc113)

| # | 검증 | 결과 |
|---|------|------|
| L2-14~21 | `tc113-session-start-duplication-defense.js` | ✅ 8/8 PASS — 훅 stdout JSON `systemMessage` 정확히 1회 배출 (CLI 상위 렌더러 중복은 본 테스트 범위 밖) |

---

## 3. L3 — Gemini CLI 인터랙티브 검증 (사용자 직접 실행)

> **사용자 환경**: Gemini CLI 로컬 설치 완료
> **권장 버전**: v0.39.0 (latest stable, 본 cycle 검증 대상)
> **방법**: 본 문서를 보면서 한 단계씩 직접 실행, 각 step의 [Expected] 와 [Observed] 비교

### 사전 준비

```bash
# 1. 본 브랜치 checkout (이미 완료된 상태일 것)
cd /Users/popup-kay/Documents/GitHub/popup/bkit-gemini
git checkout feature/v2.0.5-gemini-cli-v0.39.0-migration
git status   # working tree clean 확인

# 2. Gemini CLI 버전 확인 — v0.39.0 권장
gemini --version
# Expected: 0.39.0

# 3. bkit extension 등록 확인
gemini extension list
# Expected: bkit 항목이 있어야 함. 버전 2.0.4 표시.
# 만약 미등록: gemini extension install . (현재 디렉토리 기준)

# 4. 깨끗한 테스트 디렉토리 생성 (선택, baseline 격리)
mkdir -p /tmp/bkit-qa-l3 && cd /tmp/bkit-qa-l3
```

### 시나리오 분류

| 시나리오 | 검증 표면 | 핵심 확인 |
|---------|----------|----------|
| S1 | Extension 등록 + SessionStart hook | 인식·환영 메시지·중복 출력 여부 |
| S2 | Slash command 인식 | `/pdca`, `/starter`, `/dynamic` 등 자동완성 |
| S3 | PDCA workflow E2E | plan → design → do 명령 순서 |
| S4 | Agent 직접 호출 | `gemini -e <agent>` 외부 spawn |
| S5 | MCP tool 호출 | bkit_pm_run, list_agents, bkit_audit_query |
| S6 | Output style | `/output-style bkit-pdca-guide` 적용 |
| S7 | Hook 회귀 | tc113 카나리아 — 실제 CLI 환경에서 systemMessage 1회 vs 2회 |
| S8 | Memory 복원 | 두 번째 세션 시작 시 이전 컨텍스트 |
| S9 | v0.39.0 신기능 노출 | Plan Mode `activate_skill` 사용자 확인 |
| S10 | 기존 buglist 확인 | Issue #25655 (CLI 상위 렌더러 중복) |

---

### S1 — Extension 등록 + SessionStart Hook

```bash
gemini
```

**[Expected]**:
- 시작 직후 `bkit Vibecoding Kit v2.0.4 activated (Gemini CLI) - Level: Starter` 헤더가 한 번 출력됨
- `# bkit Session Start` 섹션과 PDCA Core Rules / Available Skills 목록이 표시됨
- Welcome 메시지가 **한 번만** 표시 (두 번 나오면 Issue #25655 — S10 참조)

**[Observed]** (사용자 기록 칸):
```
[ ] Welcome 메시지 1회 출력
[ ] Welcome 메시지 2회 출력 (Issue #25655 재현)
[ ] 메시지 출력 안 됨 (FAIL)
실제 출력 캡처:
___
```

---

### S2 — Slash command 인식

세션 안에서 `/`만 입력하고 자동완성 확인:

**[Expected]**: 다음 핵심 슬래시 명령이 목록에 나타남
- `/pdca` (또는 `/pdca status`, `/pdca plan`, `/pdca design`, `/pdca do` 등 서브명령)
- `/starter`, `/dynamic`, `/enterprise`
- `/development-pipeline`
- `/output-style`
- `/skill-create`, `/skill-status`
- `/btw`, `/audit`, `/control`, `/rollback`
- `/plan-plus`
- `/qa-phase`, `/zero-script-qa`
- `/code-review`, `/simplify`
- (총 43개 skill 중 user-invocable 다수)

**[Observed]**:
```
[ ] /pdca 노출
[ ] /starter 노출
[ ] /dynamic 노출
[ ] /output-style 노출
[ ] /qa-phase 노출
[ ] /skill-create 노출
[ ] (목록 전체 가시) 노출 명령 수: ___ 개
```

---

### S3 — PDCA workflow E2E (plan → design → do, dry-run)

```
/pdca status
```

**[Expected]**: 현재 PDCA 상태 표 (Feature/Phase/Match Rate/Iteration). 진행 중인 feature 없으면 안내 메시지.

```
/pdca plan demo-qa-feature
```

**[Expected]**:
- 요구사항 확인 질문(Checkpoint 1) — AskUserQuestion 형태로 "요구사항 이해가 맞나요?"
- 사용자 응답 후 Plan 문서 `docs/01-plan/features/demo-qa-feature.plan.md` 생성

```
/pdca design demo-qa-feature
```

**[Expected]**:
- 3개 아키텍처 옵션 제시 (Option A/B/C)
- 사용자 선택 후 Design 문서 생성

```
/pdca do demo-qa-feature
```

**[Expected]**: Implementation guide + Context Anchor + Session Guide 출력. Checkpoint 4 승인 요청.

**[Observed]**:
```
[ ] /pdca status 동작
[ ] /pdca plan demo-qa-feature 동작 + 문서 생성
[ ] /pdca design demo-qa-feature 동작
[ ] /pdca do demo-qa-feature 동작
오류/특이사항: ___
```

---

### S4 — Agent 직접 호출

```bash
# 셸로 빠져나와서 (gemini 종료 후)
gemini -e agents/gap-detector.md "현재 docs/01-plan과 lib/gemini 구조 간 갭을 요약해줘"
```

**[Expected]**: gap-detector 에이전트가 호출되어 응답 반환. 진행 중에 BeforeAgent / AfterAgent hook 트리거 (간접 확인은 어렵지만 응답 포맷이 에이전트 정의대로면 OK).

```bash
# 다른 에이전트 빠른 sanity
gemini -e agents/code-analyzer.md "lib/gemini/version.js 코드 품질을 한 줄로 요약"
```

**[Expected]**: 짧은 코드 품질 평가 응답.

**[Observed]**:
```
[ ] gap-detector 응답 정상
[ ] code-analyzer 응답 정상
오류/특이사항: ___
```

---

### S5 — MCP Tool 호출

세션 안에서 (bkit MCP server는 자동 spawn됨):

```
list_agents 툴을 호출해서 등록된 에이전트를 보여줘
```

**[Expected]**: bkit MCP의 `list_agents` tool이 호출되고 21개 에이전트 목록 반환 (gap-detector, design-validator, pdca-iterator, code-analyzer, ... 모두 포함).

```
bkit_audit_query 툴로 최근 5개 audit 항목을 조회해줘
```

**[Expected]**: `.bkit/state/audit.jsonl`에서 최근 항목 반환 (없으면 빈 배열).

```
spawn_agent 툴로 starter-guide 에이전트를 호출해서 "안녕"이라고 인사해줘
```

**[Expected]**: `spawn_agent` tool이 starter-guide 에이전트를 외부 프로세스로 띄우고 응답 반환.

**[Observed]**:
```
[ ] list_agents 호출 → 21개 반환
[ ] bkit_audit_query 호출 → 응답 (배열)
[ ] spawn_agent 호출 → starter-guide 응답
실제 노출 tool 수: ___
오류: ___
```

---

### S6 — Output Style 적용

```
/output-style
```

**[Expected]**: 4개 스타일 메뉴 표시 (bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise). 만약 `/output-style-setup`이 먼저 필요하다고 안내되면 그것부터 실행.

```
/output-style bkit-pdca-guide
```

**[Expected]**: 스타일 적용 후 다음 응답부터 PDCA 친화 포맷 (Phase status badges, Gap 분석 제안 등) 적용됨.

**[Observed]**:
```
[ ] /output-style 메뉴 4개 모두 노출
[ ] bkit-pdca-guide 적용됨 (다음 응답에서 [Plan]→[Design]→... 뱃지 보임)
오류: ___
```

---

### S7 — Hook 회귀 (tc113 사용자 검증)

`tests/suites/tc113-session-start-duplication-defense.js`는 훅 단위로 stdout JSON `systemMessage`가 1회만 배출됨을 본 세션에서 자동 검증 (8/8 PASS). 그러나 **CLI 상위 렌더러의 이중 출력(Issue #25655)은 훅 단위로 검증 불가** — 사용자 환경에서만 재현 가능.

```bash
# 새 세션 깨끗하게 시작
gemini --new-session    # 옵션이 없으면 그냥 gemini
```

**[Expected]**:
- "bkit Session Start" 또는 "bkit Vibecoding Kit v2.0.4 activated" 문구가 시작 화면에 **한 번만** 표시
- 두 번 나오면 Issue #25655 사용자 환경 재현 — fix PR #25827 머지 전까지 잔존

**[Observed]** (Issue #25655 검증):
```
[ ] systemMessage 1회 (정상, fix 완료된 환경)
[ ] systemMessage 2회 (Issue #25655 재현 — Windows 11 알려진 패턴)
[ ] 환경: macOS / Linux / Windows ___
[ ] CLI 버전: ___
실제 출력 처음 5줄 캡처:
___
```

---

### S8 — Memory & Returning User

S3에서 만든 demo-qa-feature가 있는 상태로:

```bash
# 세션 종료 후 다시 시작
exit
gemini
```

**[Expected]**:
- SessionStart에 "Welcome back! You were working on: **demo-qa-feature**" 같은 returning user 안내 출력
- "Recommended Next Step" 섹션에 다음 PDCA phase 가이드

**[Observed]**:
```
[ ] returning user 안내 표시
[ ] previous feature 이름 정확
[ ] next step 추천 표시
이상 동작: ___
```

---

### S9 — v0.39.0 신기능 노출

**S9.1 — Plan Mode `activate_skill` 사용자 확인 (PR #24946)**

세션 안에서:

```
/pdca plan-plus demo-feature-2
```

**[Expected]**: plan-plus 스킬 활성화 시 v0.39.0+ Plan Mode가 사용자 확인 게이트(허용/거부 선택지) 표시.

**S9.2 — `/memory inbox` (PR #24544)**

```
/memory
```

**[Expected]**: v0.39.0+에서 `inbox` 서브명령이 표시되거나 도움말에 등장.

**S9.3 — JSONL 채팅 기록 (PR #23749)**

`~/.gemini/sessions/` 디렉토리에 세션별 `.jsonl` 파일 생성 확인 (정확한 경로는 환경별 다를 수 있음).

```bash
# 셸에서
find ~/.gemini -name '*.jsonl' -newer /tmp/bkit-qa-l3 2>/dev/null | head
```

**[Observed]**:
```
[ ] Plan Mode 사용자 확인 게이트 표시
[ ] /memory inbox 노출
[ ] JSONL 세션 파일 생성됨 경로: ___
v0.39.0 미진입 환경이면 위 3개 모두 미노출 정상
```

---

### S10 — 기존 알려진 이슈 확인

| # | 이슈 | 검증 방법 | 본 cycle 대응 |
|---|------|----------|---------------|
| #25655 | SessionStart systemMessage 이중 렌더링 | S1, S7에서 자동 확인 | passive carrier (tc113) — fix PR #25827 OPEN 모니터링 |
| #25022 (보안) | IDE stdio override RCE | Gemini CLI v0.39.0+가 자동 차단 — 별도 공격 시나리오 없음 | 자동 수혜 |

---

## 4. 검증 결과 종합

### 4.1 본 세션 자동 검증 결과 (Claude Code 환경)

| Layer | 검증 수 | PASS | SOFT | FAIL | Pass Rate |
|-------|--------|------|------|------|-----------|
| L1 — Manifest/Code | 22 | 22 | 0 | 0 | **100%** |
| L1.4 — Test Suite Baseline | 2018 | 1914 | — | 80 | **94.8%** (잔존 80건은 사전 baseline) |
| L2.1 — Hook Spawn | 10 | 5 | 5 (no-op normal) | 0 | **100% no-fail** |
| L2.2 — MCP Handshake | 3 | 3 | 0 | 0 | **100%** |
| L2.3 — tc113 카나리아 | 8 | 8 | 0 | 0 | **100%** |
| **L1+L2 자체 합계** | **43** | **38** | **5** | **0** | **PASS** |

### 4.2 사용자 검증 (L3) 채워야 할 칸

| 시나리오 | 본 세션 자동 가능? | 사용자 직접 필요 |
|---------|------------------|----------------|
| S1 SessionStart | △ 훅 단위만 | ✅ CLI 환경 |
| S2 Slash 자동완성 | ❌ | ✅ |
| S3 PDCA E2E | ❌ | ✅ |
| S4 Agent 외부 호출 | ❌ | ✅ |
| S5 MCP Tool 호출 | △ stdio 핸드셰이크만 | ✅ 인터랙티브 호출 |
| S6 Output Style | ❌ | ✅ |
| S7 #25655 CLI 재현 | ❌ (훅 단위만) | ✅ |
| S8 Memory 복원 | ❌ | ✅ |
| S9 v0.39.0 신기능 | ❌ | ✅ |
| S10 알려진 이슈 | △ tc113 카나리아만 | ✅ |

### 4.3 PASS/FAIL 판정 기준

- **L1+L2 PASS**: 모든 정적/runtime 검증 0 fail → ✅ 충족
- **L3 PASS**: S1~S10 모두 [Observed]에서 Expected와 일치하면 PASS
- **전체 QA PASS**: L1+L2 PASS + L3 사용자 보고 PASS

본 보고서 시점 결과: **L1+L2 PASS**, **L3 MANUAL — 사용자 검증 대기**.

---

## 5. 알려진 한계 및 별도 cycle 권고

| 항목 | 사유 |
|------|------|
| 잔존 80건 baseline 실패 | 모두 사전 architectural drift (PDCA-* 35 cluster 등). 본 v0.39.0 cycle scope 외. **별도 cycle 권고**: `bkit-baseline-stabilization` |
| Issue #25655 사용자 환경 재현 | 훅 단위 카나리아(tc113)만 자동 가능, CLI 상위 렌더러는 사용자 환경 의존 — fix PR #25827 머지 자동 감지 |
| v0.40.0+ 기능 (MemoryManager 4-tier, autoMemory split) | 별도 cycle (`v0.40.0-migration`) — v2.1.0-context-optimization plan에 hint 등록됨 |

---

## 6. 사용자 보고 양식 (검증 완료 후 채워주세요)

```
환경:
  - OS: ___ (macOS/Linux/Windows)
  - Gemini CLI version: ___
  - bkit version (gemini extension list): ___
  - 검증 일시: 2026-04-__

각 시나리오 결과 (PASS/FAIL/SKIP):
  S1 SessionStart:   ___
  S2 Slash 자동완성: ___
  S3 PDCA E2E:       ___
  S4 Agent 외부 호출: ___
  S5 MCP Tool:       ___
  S6 Output Style:   ___
  S7 #25655 재현:    ___ (1회/2회 명시)
  S8 Memory 복원:    ___
  S9 v0.39.0 신기능: ___
  S10 알려진 이슈:   ___

총 PASS: ___ / 10
이슈 발견 시 GitHub issue 또는 docs/05-qa/ 에 수동 추가 후 알려주세요.
```

---

## 7. 참조

- v0.39.0 Migration Plan: [`docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md`](../01-plan/features/gemini-cli-v0.39.0-migration.plan.md)
- v0.39.0 Impact Analysis: [`docs/03-analysis/gemini-cli-v0.39.0-impact.analysis.md`](../03-analysis/gemini-cli-v0.39.0-impact.analysis.md)
- v0.39.0 Do/Check Analysis: [`docs/03-analysis/gemini-cli-v0.39.0-do.analysis.md`](../03-analysis/gemini-cli-v0.39.0-do.analysis.md)
- v0.39.0 Migration Report: [`docs/04-report/gemini-cli-v0.39.0-migration.report.md`](../04-report/gemini-cli-v0.39.0-migration.report.md)
- tc113 Carrier: [`tests/suites/tc113-session-start-duplication-defense.js`](../../tests/suites/tc113-session-start-duplication-defense.js)
- Issue #25655: https://github.com/google-gemini/gemini-cli/issues/25655
- Fix PR #25827 (OPEN): https://github.com/google-gemini/gemini-cli/pull/25827

---

*QA Report v1: 2026-04-24 — Claude Code L1+L2 자동 검증 완료, Gemini CLI L3 사용자 검증 대기*
*qaStatus 후속 갱신: 사용자 L3 결과 회신 시 §4.2 채우고 최종 PASS/FAIL 결정*

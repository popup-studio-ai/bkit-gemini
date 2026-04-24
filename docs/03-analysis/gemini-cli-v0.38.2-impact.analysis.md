# Gemini CLI v0.38.2 bkit 영향 분석 보고서 (증분)

> 분석일: 2026-04-20
> 분석 범위: bkit v2.0.4 전체 코드베이스 -- v0.38.1 대비 **증분만**
> 대상 버전: Gemini CLI **v0.38.1 → v0.38.2** (2026-04-17 release, UI 핫픽스)
> 분석자: bkit-impact-analyzer agent
> 입력: `docs/01-plan/research/gemini-cli-v0.38.2-research.md`
> 선행 분석: `docs/03-analysis/gemini-cli-v0.38.1-impact.analysis.md`

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 전수 스캔 대상 파일 | 276개 (소스), 613개+ (docs/tests 포함) |
| 스킬 / 에이전트 / 훅 스크립트 | 43 / 21 / 12 |
| **v0.38.2 증분으로 영향 받는 파일(직접)** | **0개** |
| **v0.38.2 증분으로 검증 필요 파일(간접)** | **1개** (`hooks/scripts/session-start.js`) |
| Breaking Changes (증분) | **0건** |
| 새 기능 (증분) | **1건** (Edit/WriteFile 확인 UI 파일 경로 복원, PR #24974) |
| Deprecation (증분) | **0건** |
| 설정 스키마 변경 (증분) | **0건** |
| 🔴 Critical | **1건** (Issue #25655 잠재 회귀 -- bkit 간접 영향, 수정 PR 부재) |
| 🟠 High | **0건** |
| 🟡 Medium | **0건** |
| 🟢 Low | **2건** (`bkit.config.json` testedVersions, UX 복원 체감) |
| 기능 개선 기회 (증분) | **1건** (SessionStart 훅 중복 방어 테스트 신설) |
| **전체 위험도** | **MEDIUM** (계약 변경 LOW + Issue #25655 회귀 가능성으로 상향) |

**총평**: v0.38.2는 **단일 UI 핫픽스**로, 계약 계층(settings, extension, MCP, 19종 hooks, CLI 플래그, .gemini/ 레이아웃) 전역 무변경. 직접 수정 항목 0건. 단, 릴리스 **후** 보고된 [Issue #25655](https://github.com/google-gemini/gemini-cli/issues/25655) "SessionStart 훅 `systemMessage` 이중 렌더링 + `notifications:false` 무시 + ANSI escape 리터럴 출력"이 bkit-server 없는 순수 훅 경로(`hooks/scripts/session-start.js`)에도 영향을 주기 때문에, 업그레이드 직후 **사용자 체감 UX 회귀 가능성**이 존재한다. 수정 PR이 업스트림에 아직 없으므로, bkit는 관찰 가능한 방어 테스트 + 임시 대응 가드를 함께 둘 필요가 있다.

핵심 관찰:
- bkit `hooks/scripts/session-start.js`는 **정상 경로(Line 89)** 와 **에러 fallback(Line 114)** 에서 각각 `systemMessage`를 `stdout JSON`으로 뱉는다. v0.38.2 회귀 이슈에 **정면으로 해당**된다.
- MCP 서버(`mcp/bkit-server.js`)는 `systemMessage`를 사용하지 않으므로 MCP 경로는 무관.
- Edit/WriteFile 확인 UI 복원(PR #24974)은 bkit 스킬·에이전트의 `write_file`/`replace` 사용 시 **순수 긍정 UX**.

---

## 1. Breaking Changes 영향 매핑 (증분)

### 증분 Breaking Changes: **0건**

| Breaking Change | 영향 파일 | 영향 범위 | 수정 방안 |
|-----------------|-----------|-----------|-----------|
| — | — | **영향 없음** (계약 전역 무변경) | — |

Research §3.1 검증 완료 항목:

- `settings.json` 스키마: 변경 없음 → `.gemini/settings.json` 영향 없음
- `gemini-extension.json` 스키마: 변경 없음 → `gemini-extension.json` 영향 없음
- MCP stdio/sse 프로토콜: 변경 없음 → `mcp/bkit-server.js` 영향 없음
- Hook 이벤트 계약(19종): 변경 없음 → `hooks/hooks.json`, `hooks/scripts/*.js` 12개 페이로드/반환 형식 무변경
- CLI 플래그/서브커맨드: 변경 없음 → `mcp/bkit-server.js` Line 1054-1056의 `--approval-mode=yolo|default` 호출 경로 영향 없음
- `.gemini/` 디렉토리 레이아웃: 변경 없음 → `policies/`, `GEMINI.md` 영향 없음

**결론**: 증분 Breaking Changes 영향 받는 bkit 파일 **0개**.

---

## 2. 새 기능 활용 분석 (증분)

### 2.1 Edit/WriteFile 도구 확인 UI 파일 경로 복원 (PR #24974 / #25585)

| 항목 | 내용 |
|------|------|
| 기능 | `ToolConfirmationQueue.tsx`가 Edit/WriteFile 도구 확인 프롬프트에서 `tool.description`(= 파일 경로)를 항상 렌더링 |
| 영향 조건 | 사용자가 `write_file` 또는 `replace` 도구 호출 승인을 확인할 때 |
| 활성화 | 자동, flag 무관 |

### 2.2 영향받는 bkit 스킬·에이전트

`write_file`/`replace` 도구를 사용하는 bkit 구성 요소는 전체 스킬 43개 중 **30개 이상**, 에이전트 21개 중 **대다수**가 해당한다(Grep 전수 확인).

| 구분 | 주요 사용처 | UX 개선 체감도 |
|------|------------|---------------|
| 스킬 (30+/43) | `pdca`, `plan-plus`, `skill-create`, `phase-1-schema`~`phase-7-seo-security`, `deploy`, `rollback`, `qa-phase`, `zero-script-qa`, `simplify`, `development-pipeline` 등 | 🟢 HIGH -- PDCA 문서 생성·수정 워크플로우 전반에서 승인 시 파일 경로 시인성 복원 |
| 에이전트 (21/21) | `pm-prd`, `pm-strategy`, `cto-lead`, `pdca-iterator`, `report-generator`, `gap-detector`, `design-validator`, `bkend-expert`, `frontend-architect` 등 | 🟢 HIGH -- 에이전트 드리프트 방지, "어떤 파일을 수정 중인지" 즉시 확인 가능 |

### 2.3 사용자 경험 개선 예상 효과

- **No Guessing 원칙 강화**: 승인 다이얼로그에서 파일 경로를 시각적으로 확인 → 사용자가 "어느 경로를 수정하는지" 추측 없이 판단
- **PDCA 문서 승인 속도 향상**: Plan/Design/Report 생성 시 경로 혼동으로 인한 취소·재생성 감소
- **보안 리뷰 안정성**: `before-tool.js`가 위험 경로 감지하여 `decision: 'ask'`로 전환할 때, 사용자가 경로 보고 즉시 판단 가능
- **회귀로부터 복원**: v0.38.0~v0.38.1 기간 "파일 이름 누락" 기간의 사용자 혼동 제거

### 2.4 추가 작업 필요 여부

**없음**. bkit 측 코드/설정 수정 없이 업그레이드만으로 UX가 자동 복원된다.

---

## 3. 🔴 CRITICAL: SessionStart 훅 중복 렌더링 (Issue #25655)

> **이 섹션은 v0.38.2 릴리스 이후 보고된 후속 이슈로, 업스트림 수정 PR이 조사일(2026-04-20) 기준 존재하지 않는다. bkit는 수동 회귀 테스트와 방어 가드로 대응해야 한다.**

### 3.1 이슈 요약

| 항목 | 내용 |
|------|------|
| 업스트림 이슈 | [#25655](https://github.com/google-gemini/gemini-cli/issues/25655) |
| 영향 대상 | **SessionStart 훅만** (BeforeAgent/BeforeTool 훅은 정상 1회 렌더) |
| 증상 1 | 훅이 반환한 `systemMessage`가 **2회 렌더링**됨 |
| 증상 2 | ANSI escape sequence가 **리터럴 문자열**로 출력됨 (예: `\x1b[33m` → `\x1b[33m`) |
| 증상 3 | 훅 반환 payload의 `notifications: false` 플래그 **무시됨** |
| 재현 환경 | Windows 11, Node 24.14.0 (macOS/Linux 확인 필요) |
| 릴리스 포함 | v0.38.2 **포함** (Upstream 수정 PR 없음) |

### 3.2 영향 받는 bkit 파일

| 파일 | 역할 | 증상 예상 | 영향도 | 라인 참조 |
|------|------|----------|--------|----------|
| `hooks/scripts/session-start.js` | SessionStart 훅 진입점, 정상 경로에서 `systemMessage` 반환 | bkit Welcome 섹션 + PDCA 상태 + Phase-Aware Context이 **2회 연속 출력** | 🔴 Critical | **Line 87-105** (정상), **Line 112-116** (fallback) |
| `lib/gemini/platform.js` | `outputAllow(context, _hookEvent)` 헬퍼 | `output.systemMessage = context` → 동일 이중 출력 경로 | 🔴 Critical (공유) | **Line 97-108** |
| `hooks/hooks.json` | SessionStart 훅 등록 선언 | 구성 자체에는 영향 없음 | 🟢 Low | Line 4-15 |
| 그 외 BeforeAgent / AfterTool / BeforeTool 훅 스크립트 | `systemMessage` 반환 | **정상 1회 출력** (이슈 범위 밖) | 🟢 Low | — |

### 3.3 구체적 증상 시나리오

사용자가 `gemini` CLI를 `bkit` extension과 함께 신규 세션 시작 시:

**예상 (v0.38.1까지)**:
```
bkit Vibecoding Kit v2.0.4 activated (Gemini CLI) - Level: Dynamic

# bkit Session Start

## PDCA Core Rules (Always Apply)
...
```

**v0.38.2에서 (#25655 회귀)**:
```
bkit Vibecoding Kit v2.0.4 activated (Gemini CLI) - Level: Dynamic

# bkit Session Start

## PDCA Core Rules (Always Apply)
...
bkit Vibecoding Kit v2.0.4 activated (Gemini CLI) - Level: Dynamic     ← DUPLICATE

# bkit Session Start                                                    ← DUPLICATE

## PDCA Core Rules (Always Apply)                                       ← DUPLICATE
...
```

추가로 bkit의 `systemMessage`에는 Markdown 헤딩만 있고 ANSI escape 사용은 없으므로, "ANSI 리터럴 출력" 증상은 bkit에서 관찰되지 않을 가능성이 높음. 단, `buildCoreRules()`가 향후 색상 코드를 추가하면 즉시 이슈에 포섭된다.

### 3.4 회귀 테스트 방안

#### 재현 절차 (수동)

1. bkit extension 활성화 상태로 `gemini` 실행
2. 출력 상단에서 `bkit Vibecoding Kit v2.0.4 activated` 문자열 등장 횟수 확인
3. 정상 = 1회, 회귀 = 2회

#### 자동 감지 (권장 테스트 신설)

- **신설 파일**: `tests/suites/tc107-v0382-session-start-duplication.js`
- **테스트 목적**: session-start.js를 실행 → stdout JSON 파싱 → `systemMessage`에 고유 sentinel(`bkit Session Start`)이 정확히 1회만 존재하는지 검증
- **추가 검증**: `lib/gemini/platform.js#outputAllow`의 계약(JSON 1건 배출)이 훅 프로세스 수준에서는 정상임을 재확인 (CLI 상위 레이어에서 중복 발생하므로 훅 자체는 영향 없음)
- **주의**: Gemini CLI 상위 CLI 레벨의 렌더러 버그이므로, 훅 단위 테스트로는 `stdout=1회`만 확인되고 재현 자체는 E2E(실제 `gemini` 실행) 필요

#### 완화책 (workaround)

| 옵션 | 내용 | 적용 난이도 | 사이드 이펙트 |
|------|------|------------|-------------|
| **A (권장, 임시)** | bkit 업스트림 이슈 추적, v0.38.3 또는 v0.39.x 수정 반영 대기 | 0 | 사용자 출력이 2회 보일 수 있음 |
| B (방어) | `session-start.js`의 `systemMessage` 총 길이를 **50% 이하로 축소** → 2회 출력되어도 시각적 부담 완화. Phase-Aware 섹션을 `BeforeAgent` 훅으로 이관 | 중간 (2h) | BeforeAgent 훅 부하 증가, 세션 초기화 타이밍 시프트 |
| C (회피) | `session-start.js`를 no-op로 설정(`decision: allow` + `systemMessage` 생략) → PDCA 상태 초기화는 stdout 없이 파일시스템에만 수행 | 낮음 (30분) | v2.0.4의 Welcome UX가 일시적으로 사라짐, 사용자 혼동 |
| D (설정 의존) | `notifications: false` 플래그 명시 | 1분 | **#25655에서 무시됨 → 효과 없음** |

**결론**: 옵션 A + 테스트 신설(#3.4 자동 감지) 병행. bkit v2.0.4 현행 계약을 유지하면서 향후 업스트림 수정(v0.38.3 또는 v0.39.0)에서 자동 해결될 것을 전제.

### 3.5 영향도 분류 근거

- **🔴 Critical 선정 이유**: 사용자 세션의 첫 화면이 2회 중복 출력 → **제품 첫인상 직결**, PDCA 지침·Welcome·Output Style이 중복되어 사용자 혼동. 단, 기능 동작 자체(PDCA status 초기화, policy 생성, memory store)는 정상 작동하므로 "Build 실패"급은 아님. bkit-system/philosophy의 **core-mission.md** "사용자 신뢰 우선" 원칙과 직결되어 Critical로 분류.
- **수정 가능성**: bkit 자체로는 업스트림 버그 **근본 수정 불가**, 완화만 가능.
- **비상 Exit**: bkit 측 session-start.js를 no-op로 전환하면 증상 완전 제거 가능(옵션 C). 필요 시 hotfix.

---

## 4. 스킬 영향 분석 (증분)

| 스킬 | 영향 항목 | 영향도 | 대응 방안 |
|------|----------|--------|----------|
| 전체 43개 | SessionStart 훅 이중 렌더(§3) 제외 | 🟢 None | 수정 불필요 |
| `pdca`, `plan-plus`, `skill-create`, `phase-1`~`phase-7`, `deploy`, `rollback`, `qa-phase`, `zero-script-qa`, `simplify` 등 30개+ | Edit/WriteFile 확인 UI 파일 경로 **복원 수혜**(§2) | 🟢 Low (긍정) | 문서화만 -- `output-styles/` 안내문에 "파일 경로 표시 복원됨" 추가 선택적 |
| `gemini-cli-learning/SKILL.md` | v0.38.2 릴리스 노트 반영 | 🟢 Low | 교육 자료 업데이트 시 "v0.38.2 UI 핫픽스" 1줄 추가 |

---

## 5. 에이전트 영향 분석 (증분)

| 에이전트 | 영향 항목 | 영향도 | 대응 방안 |
|----------|----------|--------|----------|
| 전체 21개 | 프레임워크 계약 변경 없음 | 🟢 None | 수정 불필요 |
| `pm-prd`, `cto-lead`, `pdca-iterator`, `report-generator`, `design-validator`, `code-analyzer`, `frontend-architect`, `bkend-expert`, `qa-strategist`, 나머지 모두 | Edit/WriteFile 경로 표시 복원 → 승인 의사결정 품질 향상 | 🟢 Low (긍정) | 문서화 옵션 |

---

## 6. 스크립트·라이브러리·MCP 영향 분석 (증분)

### 6.1 Hook 스크립트 (12개)

| 파일 | 영향 항목 | 영향도 | 비고 |
|------|----------|--------|------|
| `hooks/scripts/session-start.js` | §3 **SessionStart 이중 렌더링 영향** (간접) | 🔴 Critical | Line 89, 114가 `systemMessage` 배출. 코드 수정 없이 업스트림 수정 대기 |
| `hooks/scripts/before-model.js` | v0.38.1 분석의 Plan Mode × BeforeModel 상호작용(현행 no-op) | 🟢 Low | 이번 증분에 추가 검증 필요 없음 |
| 나머지 10개 (`before-agent`, `after-model`, `before-tool-selection`, `before-tool`, `after-tool`, `after-agent`, `pre-compress`, `session-end`) | 영향 없음 | 🟢 None | 계약 무변경 |

### 6.2 라이브러리 (`lib/`, 34개 모듈)

| 모듈 | 영향 항목 | 영향도 |
|------|----------|--------|
| `lib/gemini/platform.js` | `outputAllow` 헬퍼가 §3 이슈 대상 JSON 포맷 작성 (Line 97-108) | 🔴 간접 Critical (수정 불필요, 이슈는 상위 CLI 레이어) |
| `lib/gemini/version.js` | `testedVersions`에 `"0.38.1"`, `"0.38.2"` 추가 권장 | 🟢 Low |
| `lib/gemini/tools.js`, `hooks.js`, `policy.js`, `tracker.js`, `model-resolver.js`, `context-fork.js` | 영향 없음 | 🟢 None |
| `lib/core/*` (memory, permission, paths) | 영향 없음 | 🟢 None |
| `lib/pdca/*` (5개), `lib/intent/*` (5개), `lib/task/*`, `lib/team/*` | 영향 없음 | 🟢 None |

### 6.3 MCP 서버 (`mcp/`, 3개 파일)

| 파일 | 영향 항목 | 영향도 | 근거 |
|------|----------|--------|------|
| `mcp/bkit-server.js` | **영향 없음** | 🟢 None | `systemMessage` 미사용(Grep 확인), `--approval-mode=yolo|default`만 사용(Line 1054-1056) |
| `mcp/start-server.sh` | 영향 없음 | 🟢 None | POSIX 호환 유지 |
| `mcp/gemini-extension.json` | 영향 없음 | 🟢 None | MCP 스키마 무변경 |
| `mcp/tools/` | 영향 없음 | 🟢 None | 도구 계약 무변경 |

---

## 7. 설정 파일 영향 분석 (증분)

| 파일 | 영향 항목 | 영향도 | 대응 |
|------|----------|--------|------|
| `bkit.config.json` | `compatibility.testedVersions`에 `"0.38.1"`, `"0.38.2"` 추가 권장 (현재 `"0.37.0"`까지 기재, Line 120) | 🟢 Low | 문자열 2개 추가, 5분 |
| `gemini-extension.json` | 영향 없음 | 🟢 None | 스키마 무변경 |
| `hooks/hooks.json` | 영향 없음 | 🟢 None | 19개 훅 이벤트 계약 무변경 |
| `policies/bkit-extension-policy.toml` | 영향 없음 | 🟢 None | TOML 스키마 무변경 |
| `GEMINI.md` | 영향 없음 | 🟢 None | `@import` 디렉티브 무변경 |
| `.gemini/settings.json` | 영향 없음 | 🟢 None | v0.38.2는 노출 설정 0건 추가 |
| `package.json` | 영향 없음 | 🟢 None | 의존성 무변경 |

---

## 8. 철학 정합성 검증 결과

bkit-system/philosophy/ 4대 문서를 기준으로 검증:

| 원칙 | 상태 | v0.38.2 증분 관점 | 비고 |
|------|------|-------------------|------|
| **core-mission.md** -- Automation First | ✅ 유지 | SessionStart 훅은 여전히 자동 실행. PDCA/Policy/Memory 초기화 경로 무영향 | 이슈 #25655로 "이중 출력"되어도 기능 자동화는 유지 |
| **core-mission.md** -- No Guessing | ⚠️ 주의 (UX 저하) | PR #24974 UX 복원으로 **향상**, 그러나 #25655로 인해 SessionStart Welcome이 중복되어 "첫인상 신뢰도" 소폭 저하 | Net **약한 긍정**, 사용자에게 중복 출력 공지 가능 |
| **core-mission.md** -- Docs = Code | ✅ 유지 | 설계-구현 동기화 메커니즘 무영향 | — |
| **ai-native-principles.md** -- AI as Partner | ✅ 유지 (개선) | Edit/Write UI 복원 → 파일 경로 시인성 회복은 사용자·AI 협력 품질 향상 | — |
| **context-engineering.md** -- 6-Layer Context | ⚠️ 주의 | session-start.js의 Phase-Aware Context 주입이 **이중**으로 소비되면 6-Layer Layer 1(SessionStart) 토큰 예산 순간 2배 | 실제 중복 출력은 display 레이어, 컨텍스트 엔진에는 1회만 들어갈 가능성 높음. 추가 조사 필요 |
| **pdca-methodology.md** -- PDCA Methodology | ✅ 유지 | PDCA 사이클 5단계(Plan/Design/Do/Check/Act) 메커니즘 무영향. SessionStart 상태 로딩 정상 | — |

**결론**: 6개 원칙 중 4개 완전 유지, 2개(No Guessing / Context Engineering)는 **약한 주의**. 전체 정합성 유지되나 #25655 해소 전까지 Context Layer 1의 **실제 토큰 소비량**이 중복되는지 확인 필요.

---

## 9. 기능 개선 기회 (증분)

| # | 새 기능 / 상황 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|--------------|---------------|-----------|----------|-------|
| 1 | Edit/Write 확인 UI 파일 경로 복원 (PR #24974) | bkit 스킬 문서에서 "승인 시 파일 경로 확인" 가이드를 output-style에 추가 | UX 보조, 사용자 승인 속도 향상 | P3 | 10분 |
| 2 | Issue #25655 SessionStart 중복 렌더 | 방어 테스트 `tc107-v0382-session-start-duplication.js` 신설, 훅 stdout JSON이 정확히 1회 배출됨 확인 | 향후 CLI 상위 레이어 회귀에 대한 조기 경보 | P1 | 1-2h |
| 3 | Issue #25655 임시 완화 | SessionStart 훅의 `systemMessage` 본문을 **Phase-Aware Context 섹션만 제거**하여 중복 렌더 시 시각적 부담 완화. Phase-Aware는 BeforeAgent로 이관 | 중복 출력 시 토큰·시각 부담 50% 감소 | P2 (업스트림 수정 지연 시) | 2-3h |
| 4 | `tool.description` ANSI sanitization (리뷰 지적) | bkit 훅이 description에 외부 입력 주입하지 않는지 grep 재확인, 방어 코드 추가 | 보안 강화 (잠재) | P2 | 30분 |
| 5 | `bkit.config.json` testedVersions 업데이트 | `["0.38.1", "0.38.2"]` 2개 문자열 추가 | 호환성 선언 | P0 | 5분 |
| 6 | v0.39.0-preview.0 감시 | Legacy subagent wrapping tools 제거, `autoMemory` 도입 등 다음 대형 변경 사전 조사 | 다음 stable 대응 준비 | P3 | 1h |

---

## 10. v0.38.1 대비 증분 영향 (요약 테이블)

| 영역 | v0.38.2 증분 | 변경 요약 |
|------|-------------|----------|
| Breaking Changes 매핑 | **No Change** | 0건 추가 |
| 스킬 (43개) | **No Change** (30+ 긍정 체감) | Edit/Write 경로 복원 수혜 |
| 에이전트 (21개) | **No Change** (전원 긍정 체감) | Edit/Write 경로 복원 수혜 |
| Hook 스크립트 (12개) | **1개 🔴 간접 Critical** | `session-start.js`가 #25655 회귀 영향 |
| 라이브러리 lib/ (34개) | **1개 🔴 간접** | `platform.js#outputAllow` 경로 동일 |
| MCP 서버 (7개) | **No Change** | `systemMessage` 미사용, `--approval-mode=plan` 미사용 |
| 설정 파일 (7개) | **`bkit.config.json`** | `testedVersions`에 `"0.38.1"`, `"0.38.2"` 추가 |
| 철학 정합성 | **대체로 유지** | No Guessing/Context Engineering 약한 주의 |
| 기능 개선 기회 | **+1건** (중복 방어 테스트) | 나머지는 P2/P3 |
| 필수 수정 항목 | **1건** | `bkit.config.json` testedVersions (v0.38.0 migration 작업에 통합) |

---

## 11. 권장 조치 요약

### 즉시 (P0, 이번 마이그레이션 Do phase에서 실행)

1. `bkit.config.json`의 `compatibility.testedVersions` 배열에 `"0.38.1"`, `"0.38.2"` 2개 문자열 추가 (5분)
2. `lib/gemini/version.js`의 `testedVersions` 또는 feature-flag 레지스트리에 `"0.38.2"` 동기화 (5분, 존재 여부 확인 후)
3. 이 보고서의 §3 Critical 이슈를 관찰 가능 상태로 수동 회귀 테스트 (실제 `gemini` 실행하여 "bkit Session Start" 문자열 출현 횟수 확인)

### 단기 (P1-P2, 1-2주 내)

4. 방어 테스트 신설: `tests/suites/tc107-v0382-session-start-duplication.js`
5. Gemini 업스트림 #25655 상태 추적, v0.38.3 또는 v0.39.0-preview.x에 fix 포함되는지 모니터링
6. bkit output-style 또는 Welcome 섹션에 "v0.38.2 UI 복원 활용" 안내문 추가 (선택적)

### 장기 모니터링 (P3)

7. v0.39.0-preview.0 breaking changes 추적: Legacy subagent wrapping tools 제거, `autoMemory` 설정 도입
8. 업스트림 `fix(core): fix ShellExecutionConfig spread and add ProjectRegistry save backoff`(2026-04-17 main 커밋)이 다음 stable에 반영될 때 MCP 서버 상호작용 재검증
9. `tool.description` ANSI sanitization 업스트림 강화 지켜보기 (보안 잠재 이슈)

### 하지 않을 것 (의도적)

- **별도 v0.38.2 migration plan.md 작성 안 함**: 단일 UI 핫픽스 + 간접 이슈 1건이므로 기존 v0.38.1 plan의 target version을 `v0.38.2`로 in-place swap하고 §3 Critical 방어 테스트만 추가한다.
- **`notifications: false` 플래그 시도 안 함**: #25655에서 무시됨이 확인되어 작업 낭비.

---

## 12. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Breaking Changes 증분 영향 | ⬛⬛⬛⬛⬛ | 0건 확정 (Research §3 신뢰도 ⬛⬛⬛⬛⬛) |
| 새 기능 영향 (Edit/Write UI) | ⬛⬛⬛⬛⬛ | PR #24974 소스 확인, bkit 스킬·에이전트 전수 grep |
| Issue #25655 bkit 영향 | ⬛⬛⬛⬛⬜ | `hooks/scripts/session-start.js` Line 89/114 직접 확인. 실제 재현은 E2E 필요 (조사 시점 Windows 11만 확인됨) |
| 스킬 증분 영향 | ⬛⬛⬛⬛⬛ | 43개 전수 frontmatter 및 write_file 사용 확인 |
| 에이전트 증분 영향 | ⬛⬛⬛⬛⬛ | 21개 전수 확인 |
| MCP 서버 증분 영향 | ⬛⬛⬛⬛⬛ | systemMessage/approval-mode grep 결과 0건(systemMessage) / yolo·default만(approval-mode) 확정 |
| 설정 파일 증분 영향 | ⬛⬛⬛⬛⬛ | 스키마 무변경 확정 |
| 철학 정합성 | ⬛⬛⬛⬛⬜ | Context Engineering 토큰 예산 실측은 추가 확인 필요 |

---

## 13. 부록 -- 선행 분석과의 차이 요약

| 구분 | v0.38.0 분석 | v0.38.1 증분 | v0.38.2 증분 (본 문서) |
|------|------------|-------------|----------------------|
| 분석 시점 | 2026-04-16 | 2026-04-17 | 2026-04-20 |
| 커버 범위 | v0.37.2 → v0.38.1 (포괄) | v0.38.0 → v0.38.1 | v0.38.1 → v0.38.2 |
| Breaking Changes | 7건 (전부 Low) | 0건 | **0건** |
| 직접 영향 파일 | 14개 | 0개 | **0개** |
| 간접/검증 파일 | — | 1개 (before-model.js) | **1개 (session-start.js)** |
| Critical/High/Medium/Low | 0/0/3/4 | 0/0/0/2 | **1/0/0/2** |
| Critical 원인 | — | — | **Issue #25655 후속 이슈 (수정 PR 없음)** |
| 필수 수정 항목 | 3건 | 1건 (testedVersions 문자열 1개) | **1건 (testedVersions 2개 문자열)** |
| 기능 개선 기회 | 6건 | +1건 | **+1건 (중복 방어 테스트)** |
| 마이그레이션 위험도 | LOW | LOW | **MEDIUM** (Issue #25655 간접 영향) |

---

## 14. 최종 결론

v0.38.2 자체의 증분 변경은 **순수 UI 핫픽스(PR #24974)** 로 bkit 계약에 영향이 **0건**이며, bkit 스킬·에이전트 대다수가 파일 경로 시인성 복원이라는 긍정 UX 혜택을 받는다. **단**, 릴리스 직후 보고된 업스트림 [Issue #25655 "SessionStart 훅 systemMessage 이중 렌더링"](https://github.com/google-gemini/gemini-cli/issues/25655)이 bkit의 **SessionStart 훅이 반환하는 systemMessage 경로에 정면 적중**하기 때문에, 실제 사용자 세션 시작 시점에 Welcome/PDCA/Phase-Aware Context가 **2회 연속 출력**될 가능성이 있다. 이는 "빌드 실패"급 Critical은 아니지만 사용자 첫인상·신뢰 측면에서 Critical로 분류했고, 업스트림 수정 PR이 부재한 상태이므로 bkit는 **관찰 가능한 방어 테스트(`tc107-v0382-session-start-duplication.js`)** 를 신설하고 v0.38.3/v0.39.0 stable 릴리스를 모니터링하는 것이 권장된다. 별도 v0.38.2 전용 migration plan은 불필요하며, v0.38.1 plan의 target을 `v0.38.2`로 in-place swap 한다.

---

*분석 종료: 2026-04-20 (v0.38.1 → v0.38.2 증분 전용 보고서)*
*bkit-impact-analyzer agent*

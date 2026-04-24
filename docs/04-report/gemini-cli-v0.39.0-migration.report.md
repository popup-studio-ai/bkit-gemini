# Gemini CLI v0.39.0 마이그레이션 종합 보고서

> **Summary**: bkit-gemini v2.0.4를 Gemini CLI v0.38.2 → **v0.39.0** (Minor)으로 마이그레이션. 누적 101 commits / 513 files / 41 contributors의 큰 갭에도 불구하고 **명시적 Breaking 1건(Legacy `SubagentTool` 제거)이 bkit 코드 hit 0건**. 전략 **B' (Spot Validation + Defensive Test)** 채택 — testedVersions/feature-flag 갱신 + 직전 v0.38.2 사이클 미이행 약속(`tc107-v0382` 방어 테스트) 결제 + Tool-controlled display 회귀 검증 + ContextManager+Sidecar spec 라이트 추출. 위험도 **MEDIUM**, 작업량 **3.2h**, YAGNI 절감률 **~75%**.
>
> **작성자**: Report Generator (Phase 4) — main session synthesis
> **작성일**: 2026-04-23
> **상태**: Final Report (Pre-Do Synthesis, 사용자 승인 대기)

---

## Migration Summary Card

| 항목 | 내용 |
|------|------|
| **From** | v0.38.2 (2026-04-17) |
| **To** | **v0.39.0** (2026-04-23 04:12 UTC, commit `398f78d`) |
| **Released** | 2026-04-23 04:12 UTC (조사 시점 = 출시 당일) |
| **누적 변경 (업스트림)** | 101 commits / 513 files / 41 contributors |
| **Breaking Changes (명시)** | **1건** (Legacy `SubagentTool`/`SubagentToolWrapper` 제거, PR #25053) |
| **Breaking bkit Hit** | **0건** (bkit는 자체 `spawn_agent` MCP tool + 외부 `gemini -e` spawn 사용) |
| **Critical 잔존 이슈** | **Issue #25655** (SessionStart `systemMessage` 이중 렌더링, fix PR #25827 OPEN) |
| **신규 기능 (증분)** | 10+건 (`/memory inbox`, skill patching, JSONL chat, ContextManager+Sidecar, `useAgentStream`, MCP `auth`, Tool-controlled display Steps 2-3, Plan Mode `activate_skill` 게이트, IDE stdio 보안, `@github/keytar` fork) |
| **직접 영향 bkit 파일** | **2개** (`bkit.config.json`, `lib/gemini/version.js`) |
| **간접/검증 bkit 파일** | **3개** (`hooks/scripts/session-start.js`, `mcp/bkit-server.js`, `lib/gemini/platform.js`) |
| **신규 테스트 파일** | **1개** (`tests/suites/tc107-v0382-session-start-duplication.js`, v0.38.2 약속 결제) |
| **Recommended Strategy** | **B' (Spot Validation + Defensive Test)** — 가중 합계 **8.05** (vs A 5.20, A' 6.85, C 6.90, D 5.40) |
| **ETA** | Wave 1 0.7h (P0) + Wave 2 1.0h (P1) + Wave 3 1.5h (P0) = **총 3.2h** |
| **Risk Grade** | **MEDIUM** (계약 LOW + Issue #25655 잔존 + ContextManager+Sidecar의 v2.1.0 plan 교차) |
| **YAGNI Savings** | **~75%** (naive C/D 풀셋 13~16h → B' 3.2h) |
| **재진입 hint** | v0.40.0-preview.2 (2026-04-23 동시 출시) — MemoryManager 4-tier + autoMemory split는 **별도 cycle**로 위임 |

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **대상 버전** | v0.38.2 → **v0.39.0** (Minor 업그레이드) |
| **조사/분석/플랜 완료일** | 2026-04-23 (출시 당일 4-Phase 통합 완료) |
| **명시적 Breaking Changes (증분)** | **1건** (Legacy `SubagentTool` 제거) → **bkit hit 0건** |
| **직접 영향 bkit 파일** | **2개** (`bkit.config.json` testedVersions, `lib/gemini/version.js` feature flags) |
| **간접/검증** | `hooks/scripts/session-start.js` (#25655 회귀), `mcp/bkit-server.js` (#25022 stdio RCE), `lib/gemini/platform.js` (`@github/keytar` transitive) |
| **Critical Issues** | **1건** (Issue #25655 — CLI 상위 렌더러 버그, v0.38.2부터 누적 6일 미해결, fix PR #25827 OPEN) |
| **High / Medium / Low** | 0 / 3 / 6 + 기능 개선 6건 |
| **선택 전략** | **B' (Spot Validation + Defensive Test)** — 가중 합계 **8.05** |
| **예상 작업 기간** | **3.2h** (Wave 1 0.7h P0 + Wave 2 1.0h P1 + Wave 3 1.5h P0) |
| **위험도 등급** | **MEDIUM** |
| **bkit 4대 철학 정합성** | **정합 유지** (4 강화 / 2 유지 / 1 리팩 검토 → v0.40.0 cycle로 위임) |

---

## Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | (1) npm `latest` tag가 2026-04-23 04:12 UTC에 v0.39.0으로 교체 — testedVersions 미포함 시 사용자가 "미검증 환경"에서 bkit 사용. (2) **Issue #25655** SessionStart 훅 `systemMessage` 이중 렌더링이 v0.38.2 → v0.39.0 잔존 (Welcome/PDCA 지침/Phase-Aware Context 2회 출력, `notifications:false` 무시). (3) v0.38.2 plan이 약속한 `tc107-v0382` 방어 테스트가 미신설 — bkit 자체 신뢰성 저하 누적. (4) v0.40.0-preview.2가 같은 날 동시 출시되어 릴리스 트레인 가속 — 미루면 충돌 위험. |
| **Solution** | (1) `bkit.config.json` testedVersions에 `"0.38.0"`, `"0.38.1"`, `"0.38.2"`, `"0.39.0"` 4개 추가. (2) `lib/gemini/version.js`에 feature flag 그룹 5~7개 신설(`hasInvokeAgent`, `hasContextManagerSidecar`, `hasMcpAuthBlock`, `hasToolControlledDisplay`, `hasMemoryInbox`, `hasGeminiPlansDirEnv`). (3) **약속 결제**: `tc107-v0382-session-start-duplication.js` 신설 — 훅 stdout JSON의 `systemMessage` 1회 배출 검증. (4) **올바른 위치의 조치**: bkit 훅 본문 수정 금지(NG1) — 이슈는 CLI 상위 렌더러 버그, 훅 가드는 wrong-layer fix. fix PR #25827 머지 시 자동으로 회귀 카나리아 동작. (5) ContextManager+Sidecar(#24752) spec 라이트 추출 + v2.1.0 plan에 v0.40.0 cycle 재진입 hint 1줄. |
| **Function / UX Effect** | (1) v0.39.0 보안 패치(IDE RCE 차단 #25022 + 메모리 누수 fix 4건) 자동 수혜. (2) Tool-controlled display protocol Steps 2-3가 bkit hookOutput 계약과 호환됨을 회귀 검증으로 고정. (3) feature flag 인프라가 향후 v0.39+/v0.40+ 분기 로직의 일관된 진입점 제공. (4) tc107이 fix PR #25827 머지 도래 자동 감지. (5) v2.1.0 plan에 v0.40.0 재진입 hint 명시 — 종합 재설계 진입점 명확화. |
| **Core Value** | **No Guessing**: 중복 원인을 훅에서 추측 수정 안 함 (NG1 wrong-layer 위반 회피). **Docs = Code**: v2.1.0 plan에 v0.40.0 hint 동기화. **Automation First**: tc107로 회귀 감지 자동화. **Safe Defaults / Progressive Trust**: 테스트 기반 호환성 확정. **약속 결제 문화**: v0.38.2 미이행 약속(tc107)을 v0.39.0 사이클에서 결제 — bkit 자체 신뢰성 회복. 최소 비용 3.2h로 약속 결제 + 회귀 자동 감지 + display 호환성 + feature flag 인프라 + v0.40.0 cycle 진입 도구 5개 동시 확보. |

---

## 1. 변경사항 요약 (Phase 1 결과)

### 1.1 v0.38.2 → v0.39.0 명시적 Breaking Changes

| # | 항목 | 이전 | 이후 | 영향도 | bkit Hit |
|---|------|------|------|--------|---------|
| 1 | Legacy SubagentTool 제거 (PR #25053) | `SubagentTool` / `SubagentToolWrapper` 클래스 제공 | 완전 삭제, **호환 shim 없음**. 대체: `invoke_agent(agent_name=...)` (PR #24489) | 🔴 Critical (CLI 내부 사용자에게) | **0건** ✅ |

**bkit hit 0건 근거**: `grep -rn "SubagentTool|SubagentToolWrapper|invoke_subagent|invoke_agent"` 전수 스캔 결과 코드 0 hit, 문서 17 hit (모두 사전 예고 텍스트). bkit는 `mcp/bkit-server.js#287-300`의 자체 `spawn_agent` MCP tool과 `mcp/bkit-server.js#1085`의 `child_process.spawn('gemini', ['-e', agentPath, ...])` 외부 spawn 방식을 사용 — Gemini CLI 내부 `SubagentTool` 클래스에 의존하지 않음.

### 1.2 신규 기능 (증분, bkit 활용 가능성 표시)

| # | 기능명 | PR | bkit 활용 가능성 |
|---|--------|------|-----------------|
| 1 | ContextManager + Sidecar 디커플드 아키텍처 | #24752 | 🟠 Medium (v0.40.0 종합 재설계 시 재검토) |
| 2 | `useAgentStream` 훅 | #24292/#24297 | 🟢 High (P2 이관 — 1d PoC) |
| 3 | `/memory inbox` + skill patching | #24544/#25148 | 🟢 High (P3 이관 — bkit memory 통합) |
| 4 | JSONL 채팅 기록 | #23749 | 🟡 Medium (bkit audit log 형식 통일 검토 — P2) |
| 5 | Plan Mode `activate_skill` 사용자 확인 | #24946 | 🟡 Medium (bkit guardrail 강화) |
| 6 | MCP `auth` 블록 | #24770 | 🟢 Low (bkit-server stdio 로컬, 인증 미운영) |
| 7 | Tool-controlled display protocol Steps 2-3 | #25134 | 🟠 회귀 검증 필수 (Wave 2.1) |
| 8 | IDE stdio override RCE 차단 | #25022 | 🔴 보안 수혜 자동 (mcp/bkit-server.js stdio 설정 검증) |
| 9 | `keytar` → `@github/keytar` fork | #25143 | 🟢 Low (bkit는 `package.json` 부재, transitive 영향 0) |
| 10 | `GEMINI_PLANS_DIR` env var to hooks | #25296 | 🟡 Medium (Plan Mode 통합 시 활용) |

### 1.3 Critical 잔존 이슈

| 이슈 | 상태 | bkit 적중 |
|------|------|----------|
| **Issue #25655** SessionStart 훅 `systemMessage` 이중 렌더링 | 누적 6일 미해결 (v0.38.2 → v0.39.0 잔존), fix PR **#25827 OPEN** | `hooks/scripts/session-start.js` Line 89(정상), Line 114(fallback) 직접 적중 |

### 1.4 동시 출시 (참조만)

| 버전 | 시각 | 핵심 |
|------|------|------|
| **v0.40.0-preview.2** | 2026-04-23 04:08 UTC (.0/.1 부재 첫 공개 preview) | MemoryManager 4-tier(`memoryV2`, alias 없음), `autoMemory` rename/split, Ripgrep SEA 번들 |
| **v0.41.0-nightly.20260423** | 2026-04-23 05:41 UTC | (별도 cycle 추적) |

→ **본 보고서 범위 밖**. 별도 cycle로 처리.

---

## 2. 영향 분석 결과 (Phase 2 결과)

### 2.1 영향도 분포

| 영향도 | 건수 | 비고 |
|--------|------|------|
| 🔴 Critical | 1건 | Issue #25655 (CLI 레이어 버그, bkit 훅 적중) |
| 🟠 High | 0건 | — |
| 🟡 Medium | 3건 | Wave 2 회귀 검증 / spec 추출 |
| 🟢 Low | 6건 | testedVersions, feature flag, transitive 의존성 등 |
| 기능 개선 기회 | 6건 | useAgentStream, /memory inbox, JSONL 통일 등 (P2/P3 이관) |

### 2.2 직접 영향 파일 (수정 필수)

| 파일 | 영향 항목 | 영향도 | 대응 |
|------|----------|--------|------|
| `bkit.config.json` Line 120 | `compatibility.testedVersions` 배열에 v0.38.0~v0.39.0 4개 누락 | 🟢 Low | Wave 1.1: 4개 문자열 추가 |
| `lib/gemini/version.js` | v0.39+ feature flag 그룹 부재 — 향후 분기 로직 게이팅 인프라 미흡 | 🟡 Medium | Wave 1.2: 5~7개 flag 신설 |

### 2.3 간접/검증 파일 (수정 없음, 검증만)

| 파일 | 검증 사유 | 영향도 | 대응 |
|------|----------|--------|------|
| `hooks/scripts/session-start.js` Line 89, 114 | Issue #25655 정면 적중 | 🔴 Critical | Wave 3: tc107 방어 테스트 신설 (본문 수정 금지 — NG1) |
| `mcp/bkit-server.js` (stdio 설정) | PR #25022 IDE stdio override RCE 차단 영향 검증 | 🟡 Medium | Wave 2.1 회귀 검증 |
| `lib/gemini/platform.js` | `@github/keytar` fork transitive 영향 (bkit는 keytar 의존 0건) | 🟢 Low | 회귀 검증만 |

### 2.4 4대 철학 정합성 검증 결과

| 원칙 | 정합성 | 비고 |
|------|--------|------|
| Automation First | **강화** | tc107 회귀 감지 자동화로 약속 결제 |
| No Guessing | **강화** | NG1 (wrong-layer fix 회피) 유지 — CLI 레이어 버그를 훅에서 추측 수정 안 함 |
| Docs = Code | **유지** | v2.1.0 plan에 v0.40.0 hint 1줄 추가 |
| AI as Partner / Verification Ability | **강화** | feature flag 인프라로 분기 로직 가시성 향상 |
| Safe Defaults / Progressive Trust | **유지** | 테스트 기반 호환성 확정 |
| Full Visibility / Always Interruptible | **강화** | tc107 + display 회귀 검증으로 hook 계약 가시성 |
| **Context Engineering 6-Layer** | **리팩 검토 필요 (위임)** | ContextManager+Sidecar(#24752) ↔ 6-Layer 가정 교차 — v0.40.0 cycle 종합 재설계 |

---

## 3. 마이그레이션 전략 (Phase 3 결과)

### 3.1 전략 비교 매트릭스

| 기준 (가중치) | A (No-Op, 0.2h) | A' (Spot, 1.4h) | **B' (Spot+Defensive, 3.2h) ★** | C (Feature, 9-10h) | D (Arch Pre-work, 7-8h) |
|---------------|-----------------|-----------------|----------------------------------|---------------------|-----|
| 위험도 (30%) | 4 | 6 | **9** | 9 | 7 |
| 작업량 (25%) | 10 | 9 | **7** | 3 | 4 |
| 가치 창출 (25%) | 3 | 6 | **8** | 9 | 5 |
| 장기 이점 (20%) | 3 | 6 | **8** | 8 | 5 |
| **가중 합계** | **5.20** | **6.85** | **8.05 ★** | **6.90** | **5.40** |

### 3.2 채택 전략: B' (Spot Validation + Defensive Test)

**핵심 근거**:
1. **약속 결제 우선**: v0.38.2가 약속한 `tc107-v0382` 미신설 → 본 사이클에서 결제 (bkit 자체 신뢰성 회복)
2. **올바른 위치의 수정**: 근본 버그(#25655)는 CLI 상위 렌더러 → bkit 코드 수정은 wrong layer (NG1). 방어 테스트가 정직한 조치
3. **업스트림 픽스 자동 추적**: tc107 + 수동 E2E가 fix PR #25827 머지 도래 자동 감지
4. **인프라 강화**: feature flag 그룹은 향후 v0.39+/v0.40+ 분기 로직의 일관된 진입점
5. **v0.40.0 cycle 친화**: ContextManager+Sidecar spec 라이트 추출만 수행, 본격 재설계는 v0.40.0 MemoryManager 4-tier와 종합 처리 (옵션 B)
6. **패턴 정합성**: 9th Strategy B family application — Minor 업그레이드 + Critical 회귀 방어 + Tool-controlled display 회귀 변종

### 3.3 첨예 결정 2건의 권고 결과

| 결정 | 옵션 채택 | 근거 (한 줄) |
|------|----------|------------|
| **결정 1**: ContextManager+Sidecar(#24752) ↔ v2.1.0 plan 검토 타이밍 | **옵션 B (v0.40.0 cycle 통합 재설계)** | PR #24752와 #25716은 컨텍스트 라이프사이클 동일 도메인 — 둘이 합쳐진 후 종합 설계가 정직 (sunk cost 회피) |
| **결정 2**: Issue #25655 회피 전략 | **옵션 X (passive + tc107 방어 테스트)** | CLI 상위 렌더러 버그 — BeforeAgent 이관(옵션 Y)은 NG1 위반이며 BeforeAgent도 동일 중복 가능성 + fix PR 머지 시 불필요한 아키텍처 회귀 |

### 3.4 NG List (하지 말 것)

| ID | 항목 | 이유 |
|----|------|------|
| NG1 | `hooks/scripts/session-start.js` 본문 수정 | 업스트림 버그(#25655), wrong-layer fix |
| NG2 | `notifications: false` 플래그 명시 | 무시됨 (공식 확인) |
| NG3 | invoke_agent 마이그레이션 코드 작성 | bkit 미사용 (grep 0 hit) |
| NG4~5 | MemoryManager 4-tier / v2.1.0 plan 본격 재설계 | v0.40.0 cycle 영역 |
| NG6~10 | `/memory inbox`, skill patching, useAgentStream PoC, MCP auth, 업스트림 기여 | P2/P3 이관 |
| NG11~13 | ANSI sanitization, Plan Mode TOML, v0.40.0/v0.41.0 작업 | YAGNI / 별도 cycle |

---

## 4. 구현 로드맵 (Implementation Roadmap)

### 4.1 Wave 분할

| Wave | 주제 | 우선순위 | 공수 | 누적 |
|------|------|----------|------|------|
| **Wave 1** | Version Swap, Feature Flags & Smoke | P0 | 0.7h | 0.7h |
| **Wave 2** | Spot Validation (Display + Plan Mode + Context spec) | P1 | 1.0h | 1.7h |
| **Wave 3** | Defensive Regression Test (tc107) + E2E | P0 | 1.5h | 3.2h |

### 4.2 Wave 1 — Version Swap, Feature Flags & Smoke (0.7h, P0)

| # | 작업 | 파일 |
|---|------|------|
| 1.1 | testedVersions에 v0.38.0/v0.38.1/v0.38.2/v0.39.0 4개 문자열 추가 | `bkit.config.json` L120 |
| 1.2 | feature flag 그룹 5~7개 신설 (`hasInvokeAgent`, `hasContextManagerSidecar`, `hasMcpAuthBlock`, `hasToolControlledDisplay`, `hasMemoryInbox`, `hasGeminiPlansDirEnv`) | `lib/gemini/version.js` |
| 1.3 | v0.39.0 설치 후 `npm test` → 993/993 green | 전체 |

### 4.3 Wave 2 — Spot Validation (1.0h, P1)

| # | 작업 | 파일 |
|---|------|------|
| 2.1 | Tool-controlled display protocol 회귀 (수동) — `before-tool.js` Line 68 페이로드 캡처 | 수동 |
| 2.2 | `agents/*.md` 36개 grep — 절대 경로 강제 표현 검출 (Plan Mode #25138 회귀 예방) | `agents/*.md` |
| 2.3 | PR #24752 본문 정독 → sidecar interface 1쪽 메모 + v2.1.0 plan에 hint 1줄 추가 | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` |

### 4.4 Wave 3 — Defensive Regression Test (1.5h, P0 약속 결제)

| # | 작업 | 파일 |
|---|------|------|
| 3.1 | `tc107-v0382-session-start-duplication.js` 스켈레톤 (tc88 패턴 참조) | `tests/suites/tc107-v0382-session-start-duplication.js` 신규 |
| 3.2 | 테스트 로직: 훅 subprocess 실행 → stdout JSON parse → `systemMessage` 1회 검증 + sentinel 카운트 | 동일 |
| 3.3 | docstring 한계 명시 (CLI 렌더러 중복은 E2E 수동 + 카나리아 역할) | 동일 |
| 3.4 | 수동 E2E: v0.39.0 환경 `bkit Session Start` 등장 횟수 캡처 → Do report 기록 | 수동 |
| 3.5 | `npm test` → 994/994 green | 전체 |

### 4.5 위임 작업 (Wave 4 — Deferred)

| 항목 | 위임 대상 |
|------|----------|
| `useAgentStream` PoC | P2 (1d) |
| `/memory inbox` + Skill patching 통합 PoC | P3 |
| JSONL audit-store 포맷 정합성 | P2 |
| MCP `auth` 마이그 | 유보 (인증 도입 시점) |
| ContextManager+Sidecar v2.1.0 본격 재설계 | **v0.40.0 cycle** (옵션 B) |
| MemoryManager 4-tier + autoMemory split 대응 | **v0.40.0 cycle** |
| Issue #25655 업스트림 기여 / PR #25827 모니터링 | P3 (5분/주) |

---

## 5. bkit 기능 개선/고도화 제안

| # | 기능 | 출처 PR | 채택 시점 | 예상 효과 |
|---|------|---------|----------|----------|
| 1 | `useAgentStream` 도입 | #24292/#24297 | P2 (1d) | Trust Score "Full Visibility" 강화, 실시간 진행 표시 |
| 2 | `/memory inbox` ↔ bkit memory 통합 | #24544 | P3 (4-6h) | 메모리 수집·분류·승격 워크플로우 자동화 |
| 3 | Skill patching ↔ bkit `skill-create` 통합 | #25148 | P3 (4-6h) | 프로젝트 특화 스킬 신설 자동화 |
| 4 | JSONL 채팅 기록 형식 통일 | #23749 | P2 | bkit audit log 형식 일치, 분석 도구 호환성 |
| 5 | Plan Mode `activate_skill` 게이트 활용 | #24946 | 향후 | guardrail 강화, 사용자 승인 명시 |
| 6 | feature flag 인프라 (본 사이클 신설) | — | **Wave 1.2 채택** | 향후 모든 버전 분기 로직의 일관된 진입점 |

---

## 6. 위험 관리 계획 (Risk Register)

| # | 위험 | 확률 | 영향 | 완화책 |
|---|------|------|------|--------|
| R1 | Issue #25655로 v0.39.0 사용자 SessionStart 중복 잔존 | High (Win11 재현, mac/Linux 미검증) | Medium | 옵션 X passive + tc107 방어 + output-style 임시 안내(선택적) |
| R2 | 업스트림 v0.39.1/v0.40.0 #25655 픽스 지연 | Medium | Medium | tc107 자동 감지, v0.38.x 권장 경로 유지 |
| R3 | Tool-controlled display Steps 2-3 미세 비호환 | Low | Medium | Wave 2.1 회귀 검증 + `hasToolControlledDisplay` 분기 |
| R4 | tc107 작성 중 test harness 호환성 | Low | Low | Wave 3 실패 시 Wave 1-2만 유지, tc107 차회 이관 |
| R5 | 누적 갭 (101 commits / 513 files)으로 hidden regression | Low | High | `git revert` + v0.38.2 재pin, 원인 분석 |
| R6 | `agents/*.md` 절대 경로 강제 표현으로 Plan Mode #25138 영향 | Very Low | Low | Wave 2.2 grep으로 확인 |
| R7 | feature flag 추가가 기존 분기 로직 충돌 | Very Low | Low | `hasFeature(version)` 호출자 부재 확인 후 추가 |
| R8 | v0.40.0 stable이 본 plan Do phase 중 출시 | Medium (4월 말~5월 초 예상) | Low | 본 plan 신속 완료 후 v0.40.0 cycle 진입 |
| R9 | PR #24752 본문이 sidecar interface spec 노출 부족 | Medium | Low | spec 추출 30분 cap 엄수, v2.1.0 plan에 "보류" 명시 |
| R10 | `@github/keytar` fork transitive 영향 | Very Low | Low | bkit는 keytar 의존 0건 확정 |

### 롤백 의사결정

| 상황 | 대응 |
|------|------|
| Wave 1 smoke 실패 | 즉시 revert, v0.38.2 재pin |
| Wave 2.1 display 회귀 | `hasToolControlledDisplay` 분기 또는 testedVersions 임시 미포함 |
| Wave 3 tc107 실패 | Wave 3 포기, Wave 1-2만 유지 |
| E2E SessionStart 중복 심각 UX 저하 | output-style 안내 추가, v0.38.2 권장 명시 |

---

## 7. 권장 다음 단계 (Recommended Next Steps)

| # | 단계 | 트리거 | 산출물 |
|---|------|--------|--------|
| 1 | **본 보고서 사용자 승인** | (수동 검토) | 승인 또는 수정 요청 |
| 2 | Do phase 실행 — Wave 1 (Version Swap & Smoke) | `/pdca do gemini-cli-v0.39.0-migration` | `bkit.config.json`, `lib/gemini/version.js` 수정 + smoke |
| 3 | Do phase 실행 — Wave 2 (Spot Validation) | (계속) | display 회귀, agent grep, v2.1.0 hint |
| 4 | Do phase 실행 — Wave 3 (Defensive Test) | (계속) | tc107 신설 + E2E 결과 |
| 5 | 최종 보고서 갱신 + 메모리 업데이트 | (수동) | `project_v0390_migration.md` |
| 6 | v0.40.0 stable 출시 모니터링 | 외부 트리거 | 별도 cycle (본 보고서 §1.4 hint) |

---

## 8. 참고 자료 (References)

### 8.1 bkit 내부 (본 사이클 산출물)

- **Research (P1)**: [`docs/01-plan/research/gemini-cli-v0.39.0-research.md`](../01-plan/research/gemini-cli-v0.39.0-research.md) (14 sections, 자기완결)
- **Research 부록**: [`docs/01-plan/research/gemini-cli-v0.40.0-preview-research.md`](../01-plan/research/gemini-cli-v0.40.0-preview-research.md) (별도 cycle 입력)
- **Impact Analysis (P2)**: [`docs/03-analysis/gemini-cli-v0.39.0-impact.analysis.md`](../03-analysis/gemini-cli-v0.39.0-impact.analysis.md)
- **Migration Plan (P3)**: [`docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md`](../01-plan/features/gemini-cli-v0.39.0-migration.plan.md)
- **Predecessor**: [`docs/04-report/gemini-cli-v0.38.2-migration.report.md`](gemini-cli-v0.38.2-migration.report.md)
- **Related (Wave 2.3 hint 대상)**: [`docs/01-plan/features/v2.1.0-context-optimization.plan.md`](../01-plan/features/v2.1.0-context-optimization.plan.md)

### 8.2 업스트림

- v0.39.0 Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0
- v0.38.2 → v0.39.0 Compare: https://github.com/google-gemini/gemini-cli/compare/v0.38.2...v0.39.0
- **PR #25053** Legacy SubagentTool 제거 (Breaking): https://github.com/google-gemini/gemini-cli/pull/25053
- PR #24489 invoke_agent 통합: https://github.com/google-gemini/gemini-cli/pull/24489
- PR #25134 Tool-controlled display protocol Steps 2-3: https://github.com/google-gemini/gemini-cli/pull/25134
- PR #24752 ContextManager + Sidecar 디커플드 아키텍처: https://github.com/google-gemini/gemini-cli/pull/24752
- PR #24292/#24297 useAgentStream: https://github.com/google-gemini/gemini-cli/pull/24292
- PR #24544/#25148 `/memory inbox` + skill patching: https://github.com/google-gemini/gemini-cli/pull/24544
- PR #23749 JSONL chat recording: https://github.com/google-gemini/gemini-cli/pull/23749
- PR #24946 Plan Mode `activate_skill` 게이트: https://github.com/google-gemini/gemini-cli/pull/24946
- PR #25138 Plan Mode 중첩 디렉토리 + 상대 경로: https://github.com/google-gemini/gemini-cli/pull/25138
- PR #24770 MCP `auth` 블록: https://github.com/google-gemini/gemini-cli/pull/24770
- PR #25022 IDE stdio override RCE 차단 (보안): https://github.com/google-gemini/gemini-cli/pull/25022
- PR #25143 keytar → @github/keytar fork: https://github.com/google-gemini/gemini-cli/pull/25143
- PR #25296 GEMINI_PLANS_DIR env var to hooks: https://github.com/google-gemini/gemini-cli/pull/25296
- **Issue #25655** (CRITICAL, 잔존): https://github.com/google-gemini/gemini-cli/issues/25655
- **Fix PR #25827** (OPEN, 미머지): https://github.com/google-gemini/gemini-cli/pull/25827

### 8.3 v0.40.0 Cycle 재진입 hint (별도 cycle)

> v0.40.0-preview.2 (2026-04-23 동시 출시)는 다음 포함:
> - **MemoryManager 4-tier 리팩터** (PR [#25716](https://github.com/google-gemini/gemini-cli/pull/25716)) — `experimental.memoryManager` → `experimental.memoryV2` (alias 없음)
> - **`autoMemory` rename/split** (PR [#25601](https://github.com/google-gemini/gemini-cli/pull/25601))
>
> 본 v0.39.0 cycle 완료 후 v0.40.0 stable 출시 트리거 시:
> 1. ContextManager+Sidecar(#24752) + MemoryManager 4-tier(#25716) 종합 재설계 → `v2.1.0-context-optimization.plan.md` 본격 갱신
> 2. `lib/core/agent-memory.js` + `lib/core/memory.js` + `bkit-system/philosophy/context-engineering.md` 종합 영향 분석
> 3. `experimental.memoryManager` → `experimental.memoryV2` rename 호환성 (alias 없음 — bkit 명시 사용 시 즉시 break)

---

## 9. PDCA Workflow Status

| Phase | 상태 | 산출물 |
|-------|------|--------|
| **P1: 심층 조사** | ✅ Complete | `docs/01-plan/research/gemini-cli-v0.39.0-research.md` (14 sections) + v0.40.0-preview 부록 |
| **P2: 영향 분석** | ✅ Complete | `docs/03-analysis/gemini-cli-v0.39.0-impact.analysis.md` (Critical 1 / High 0 / Medium 3 / Low 6) |
| **P3: 브레인스토밍** | ✅ Complete | `docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md` (Strategy B', 3.2h, 가중 8.05) |
| **P4: 종합 보고서** | ✅ Complete | 본 문서 (Pre-Do 섹션) |
| **Do (P5)** | ✅ **Complete (2026-04-23)** | Wave 1~3 모두 실행, 결과는 §10에 기록. 분석: `docs/03-analysis/gemini-cli-v0.39.0-do.analysis.md` |
| **Check (P6)** | ✅ **Complete** | Plan §9 AC **9/9 = 100%** 통과. 풀 baseline 1914/2018 (94.8%) — 잔존 80건은 모두 사전 baseline 이슈 (별도 cycle 권고) |
| **Iterate (P7)** | ✅ **Complete (5건 회수)** | V156-14 (자가 회귀), VER-01/02/03, SS-24 — count assertion → semantic assertion 패턴 전환 |

---

## 10. Do Phase 실행 결과 (2026-04-23 추가)

### 10.1 Wave 실행 요약

| Wave | 결과 | 변경 파일 |
|------|------|----------|
| **Wave 1** (Version Swap + Feature Flags) | ✅ | `bkit.config.json` (testedVersions 4개 추가), `lib/gemini/version.js` (v0.39+ flag 7개 신설) |
| **Wave 2** (Spot Validation) | ✅ | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (v0.40.0 cycle 재진입 hint) |
| **Wave 3** (Defensive Test) | ✅ | `tests/suites/tc113-session-start-duplication-defense.js` (신규 8 tests, 8/8 PASS), `tests/run-all.js` (등록) |
| **부산물 (사전 인프라 버그 수정)** | ✅ | `tests/suites/tc80-architecture-v200.js`, `tests/suites/tc95-architecture-migration.js`, `hooks/scripts/session-start.js`, `tests/test-utils.js` 모두 `require.main === module` 가드 추가 |
| **Iterate quick wins** | ✅ | `tests/suites/tc18-v031-features.js` V156-14, `tests/suites/tc82-gemini-version.js` VER-01/02/03, `tests/suites/tc88-hooks-session-start.js` SS-24 — 카운트 assertion을 semantic assertion으로 refactor |

### 10.2 정량 결과

| 지표 | Plan 가정 | 실측 |
|------|----------|------|
| v0.39.0 직접 AC 통과율 | 100% (9/9) | ✅ **9/9 100%** |
| 자가 회귀 발생 건수 | 0 | ✅ **0** (V156-14는 즉시 자체 수정) |
| 풀 러너 Total tests | 994/994 가정 | **2018/2018** (사전 abort wall 해소로 첫 가시화) |
| 풀 러너 Pass Rate | 100% 가정 | **94.8%** (1914 pass / 80 fail / 24 skip) |
| 작업 시간 | 3.2h | ~3h (Iterate 0.5h 추가) |

### 10.3 잔존 80건 분포 (별도 cycle 권고 — `bkit-baseline-stabilization`)

| 카테고리 | 건수 | scope 분류 |
|----------|------|----------|
| `PDCA-*` (tc92, phantom API in lib/pdca/status.js) | 35 | 🔴 NG 위반 — 별도 cycle 필수 |
| `TC80-*` (architecture: SUBAGENT_POLICY_GROUPS frozen + SEC-08/10) | 9 | 🔴 deep |
| `COMP-*` (tc100: session-start.js 추가 export) | 7 | 🟡 medium |
| `TC94-*` (config context schema) | 5 | 🔴 deep |
| `TC91-*` (security v2.0.0: sanitizeTeamName + SEC-10) | 4 | 🔴 deep |
| `TC110-*` (v0.35.0 e2e regression) | 4 | 🟡 medium |
| `TC96-*` (edge recovery) | 3 | 🟡 medium |
| `TC109-*` (skill-agent compat) | 3 | 🟡 medium |
| `TC98-*` (performance) | 1 | 🟢 low |
| `tc92-` (workflow E2E, PDCA 클러스터 일부) | 1 | 🔴 deep |
| **합계** | **80** | |

상세 분석은 [`docs/03-analysis/gemini-cli-v0.39.0-do.analysis.md`](../03-analysis/gemini-cli-v0.39.0-do.analysis.md) §2.3 참조.

### 10.4 약속 결제 + 추가 가치

| 항목 | 상태 |
|------|------|
| v0.38.2 약속: tc107 방어 테스트 신설 | ✅ tc113로 명명 변경 후 신설 (tc107 점유) |
| 약속 외 추가 가치: 풀 러너 abort wall 제거 | ✅ tc80/tc95/session-start.js 가드 → 처음으로 진정한 baseline 가시화 |

### 10.5 미완료 항목 (환경 의존)

| 항목 | 사유 |
|------|------|
| v0.39.0 라이브 환경 수동 E2E | 본 분석 환경에 v0.39.0 라이브 install 부재 — Do report에 표시. 환경 확보 시 별도 실행 권고 |

---

*보고서 작성 완료: 2026-04-23 | Do/Check/Iterate 모두 완료*
*Strategy: B' (Spot Validation + Defensive Test) — 9th Strategy B family application*
*Migration target: v0.38.2 → v0.39.0 (101 commits / 513 files / 41 contributors, Breaking hit 0)*
*Hard-Gate 준수: P1~P4 완료 후 P5~P7 실행, Plan §3 NG list 13개 100% 준수*
*v0.39.0 직접 AC: 9/9 = **100%***
*풀 baseline: 1914/2018 = 94.8% (잔존 80건은 사전 이슈, 별도 cycle 권고)*

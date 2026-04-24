# bkit v2.0.5 Finalization — Session Slim + List-Agents Fix + Version Bump

> **Feature**: bkit-v2.0.5-finalization
> **Created**: 2026-04-24
> **Status**: Plan
> **Strategy**: A' (Spot Validation) — minimal-risk feature additions + targeted bugfix
> **Branch**: `feature/v2.0.5-gemini-cli-v0.39.0-migration` (이어서 commit)
> **Mode**: L4 Full-Auto (사용자 명시)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | (1) 사용자 가시 SessionStart 본문이 너무 길어 Issue #25655 이중 출력 시 화면 압도. (2) `mcp_bkit_list_agents`가 21개 중 16개만 노출. (3) manifest 버전이 v2.0.4 그대로라 v0.39.0 cycle 산출물 미반영. |
| **Solution** | (1) systemMessage **default를 한 줄**(activated 헤더만)로 슬림화 + 풀 본문은 GEMINI.md context file로 이관. (2) `BKIT_SESSION_START_VERBOSE=true` env var로 풀 본문 복원. (3) handleListAgents에서 모든 21개 agent 노출. (4) manifest + 코드의 v2.0.4 → v2.0.5 일괄 갱신. |
| **Function UX Effect** | v0.39.0 환경 화면 차지 ~80% 감소 (60줄 × 2 → 1줄 × 2). 정보 손실 0 (GEMINI.md 자동 로드). list_agents 완전성 회복. |
| **Core Value** | **No Guessing** (Issue #25655 추측 수정 회피, NG1 유지) + **Docs = Code** (manifest/코드/docs 버전 동기화) + **Verification Ability** (list_agents가 실제 21개 정확 노출) |

## Context Anchor

| 차원 | 값 |
|------|---|
| WHY | v0.39.0 마이그레이션 후 사용자 환경 검증에서 식별된 3건의 마감 항목 |
| WHO | bkit 사용자(SessionStart 가시성), bkit 개발자(list_agents 정합), 다음 cycle (v0.40.0 진입 전 v2.0.5 release-ready 상태) |
| RISK | session-start.js 슬림화 시 사용자가 의존하는 표시 정보 손실 가능 → GEMINI.md 이관으로 보완 |
| SUCCESS | (1) SessionStart 한 줄 출력 (verbose=false 기본) (2) list_agents 21개 (3) manifest = v2.0.5 (4) tc113 8/8 PASS 유지 + tc114 신설 PASS |
| SCOPE | session-start.js, GEMINI.md, mcp/bkit-server.js, gemini-extension.json, bkit.config.json, templates/GEMINI.template.md, tests/suites/tc114 |

---

## 1. Goals (Acceptance Criteria)

| ID | 목표 | 수용 기준 |
|----|------|---------|
| G1 | manifest 버전 갱신 | `gemini-extension.json` `"version": "2.0.5"` + 본문 'v2.0.4' 문자열 모두 'v2.0.5'로 갱신 |
| G2 | SessionStart 슬림 default | hook stdout JSON `systemMessage`가 **한 줄**: `bkit Vibecoding Kit v2.0.5 activated (Gemini CLI) - Level: {level}` |
| G3 | verbose 복원 옵션 | `BKIT_SESSION_START_VERBOSE=true` 환경변수로 기존 풀 본문 복원 가능 |
| G4 | 풀 본문 GEMINI.md 이관 | PDCA Core Rules / Auto-Triggers / Natural Language Handling이 templates/GEMINI.template.md (또는 imports) 통해 매 세션 자동 컨텍스트 |
| G5 | list_agents 21개 노출 | `mcp_bkit_list_agents` 호출 결과 `agents.length === 21` |
| G6 | 회귀 0 | tc113 8/8 PASS 유지, 풀 baseline 변동 없음, v0.39.0 cycle 산출물 영향 없음 |
| G7 | tc114 신설 | 슬림 모드 + verbose 모드 단위 테스트 5+ tests, 모두 PASS |

## 2. Non-Goals

| ID | 항목 | 이유 |
|----|------|------|
| NG1 | Issue #25655 본문 우회 시도 | upstream 버그, NG1 wrong-layer 고수 |
| NG2 | session-start.js의 모든 부수 로직(Phase-aware context, returning user 등) 제거 | verbose=true 시 복원되어야 하므로 보존 |
| NG3 | bkit-server.js의 다른 tool 변경 | scope creep 회피, list_agents만 수정 |
| NG4 | GEMINI.md 전면 재작성 | 본 cycle은 PDCA Core Rules / Auto-Triggers 추가만 |
| NG5 | 사전 baseline 80건 회복 | `bkit-baseline-stabilization` 별도 cycle |
| NG6 | Plan Mode `activate_skill` 등 v0.39.0 신기능 통합 | 별도 cycle |

## 3. Implementation Waves

| Wave | 작업 | 공수 |
|------|------|-----|
| **W1** | 버전 일괄 갱신 (manifest + bkit.config + session-start.js + 테스트) | 0.3h |
| **W2** | session-start.js 슬림화 (verbose 분기 + GEMINI.md 이관) | 1.0h |
| **W3** | mcp/bkit-server.js list_agents 21개 노출 패치 | 0.5h |
| **W4** | tc114 신설 + tc113 회귀 + 풀 러너 회귀 | 0.7h |
| **W5** | QA — 수정 파일 외 모든 기능 회귀 검증 | 0.5h |
| **합계** | | **~3h** |

## 4. Risk Register

| # | 위험 | 확률 | 영향 | 완화 |
|---|------|------|------|------|
| R1 | GEMINI.md 자동 로드가 환경별로 다름 (사용자 마다 GEMINI.md 다른 위치) | Medium | Medium | extensionPath 기준 GEMINI.md를 imports로 명시 |
| R2 | verbose=true 사용자 경로가 슬림 모드 변경으로 인해 다른 동작 | Low | Low | tc114에 verbose 모드 단위 테스트 포함 |
| R3 | list_agents 16→21이 다른 tool과 schema 충돌 | Very Low | Low | spawn_agent agent_name 매개변수와 정합성 확인 |
| R4 | tc113 8/8이 슬림 모드에서 깨짐 (systemMessage 1회 검증은 그대로지만 sentinel 카운트가 변할 수 있음) | Low | Medium | tc113-05 sentinel 검증을 verbose 모드 가정으로 환경변수 토글 |

## 5. Documents

| 문서 | 위치 |
|------|------|
| Plan | 본 문서 |
| Design | `docs/02-design/features/bkit-v2.0.5-finalization.design.md` |
| Report | `docs/04-report/bkit-v2.0.5-finalization.report.md` (사이클 후) |

---

*Plan 작성: 2026-04-24 — L4 자동 모드, 사용자 confirmation 자동 통과*

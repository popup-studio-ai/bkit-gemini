# Gemini CLI v0.36.0 마이그레이션 완료 보고서 — bkit v2.0.2

> **Feature**: gemini-cli-v036-migration
> **Version**: bkit v2.0.2
> **Created**: 2026-03-28
> **Status**: Completed
> **Duration**: Plan → Design → Do → Iterate → Report (L4 Full Auto)
> **Branch**: feature/v2.0.2-gemini-v036-migration

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **대상 버전** | v0.35.0 → v0.35.3 (Stable) + v0.36.0 (Preview→Stable 대비) |
| **완료일** | 2026-03-28 |
| **전략** | 접근법 B: Enhancement (Strategy B 3회차) |
| **총 수정 파일** | 8개 (수정 5 + 신규 3) |
| **Gap Match Rate** | **10/10 = 100%** |
| **테스트 결과** | **120/120 PASS (회귀 0)** |
| **신규 TC** | TC-111 (5 TC) + TC-105 추가 (4 TC) + TC-109 추가 (2 TC) = 11 TC |
| **YAGNI 절감** | 81% (25.5h → 4.8h) |

## Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | v0.36.0에서 enableAgents 기본값 false로 bkit 21개 에이전트 전체 비활성화 위험 |
| **Solution** | session-start.js에서 settings.json 자동 생성 + v0.36.0 Feature Flag 7개 + BeforeTool ask 지원 |
| **Function UX Effect** | 사용자 무중단 에이전트 경험. v0.36.0 업데이트 시 아무런 추가 조치 불필요 |
| **Core Value** | bkit 안정성 확보 + v0.36.0 기능 기반 확보 + 검증된 패턴 3회 연속 적용 |

---

## 1. PDCA 사이클 결과

### Plan
- 3개 접근법 비교 (Hotfix / Enhancement / Major)
- 접근법 B (Enhancement) 선택: 가중 합계 7.85 최고점
- YAGNI 리뷰로 10건 제외 → 81% 공수 절감

### Design
- 수정 파일 8개 상세 설계
- 검증 기준 10개 항목 (G1~G10) 정의
- TC-111 5개 시나리오 설계

### Do (3 Waves)

#### Wave 1: P0 Critical — enableAgents 방어
| 파일 | 변경 |
|------|------|
| `hooks/scripts/session-start.js` | `ensureAgentsEnabled()` 함수 추가 + Line 52 호출 |
| `.gemini/settings.json` | 신규 생성 `{ experimental: { enableAgents: true } }` |
| `bkit.config.json` | testedVersions에 `"0.35.3"`, `"0.36.0"` 추가 |

#### Wave 2: P1 기반 확보
| 파일 | 변경 |
|------|------|
| `lib/gemini/version.js` | v0.36.0 Feature Flag 7개 + getBkitFeatureFlags canUse* 3개 |
| `hooks/scripts/before-tool.js` | BeforeTool ask 결정 분기 (v0.36.0+ Feature Flag 보호) |

#### Wave 3: 테스트
| 파일 | 변경 |
|------|------|
| `tests/suites/tc111-v036-enableagents.js` | 신규 5 TC |
| `tests/suites/tc105-v035-feature-gates.js` | v0.36.0 플래그 4 TC 추가 (8→12) |
| `tests/suites/tc109-v035-skill-agent-compat.js` | enableAgents 2 TC 추가 (10→12) |
| `tests/run-all.js` | TC-111 등록 (Sprint 8) |

### Iterate — Gap Analysis

| # | 검증 항목 | 결과 |
|---|-----------|------|
| G1 | ensureAgentsEnabled() 함수 + 호출 | ✅ |
| G2 | settings.json enableAgents: true | ✅ |
| G3 | testedVersions 4개 버전 | ✅ |
| G4 | v0.36.0 Feature Flag 7개 | ✅ |
| G5 | getBkitFeatureFlags 3개 | ✅ |
| G6 | BeforeTool ask 분기 | ✅ |
| G7 | TC-111 5 TC PASS | ✅ |
| G8 | TC-105 12 TC PASS | ✅ |
| G9 | TC-109 12 TC PASS | ✅ |
| G10 | 회귀 120 TC PASS | ✅ |
| **Match Rate** | **10/10 = 100%** | |

---

## 2. 테스트 결과 상세

### 신규 테스트 (TC-111)

| TC | 시나리오 | 결과 |
|----|----------|------|
| TC-111-01 | settings.json 미존재 → 자동 생성 | PASS |
| TC-111-02 | enableAgents 미설정 → true 추가 | PASS |
| TC-111-03 | enableAgents=true → 변경 없음 | PASS |
| TC-111-04 | enableAgents=false → 사용자 의도 존중 | PASS |
| TC-111-05 | 다른 설정 키 보존 | PASS |

### 업데이트된 테스트

| 스위트 | 이전 | 이후 | 결과 |
|--------|------|------|------|
| TC-105 | 8 TC | 12 TC (+4) | 12/12 PASS |
| TC-109 | 10 TC | 12 TC (+2) | 12/12 PASS |

### 전체 회귀 (Sprint 7)
- **120/120 PASS, 100% Pass Rate**
- 회귀 없음

---

## 3. v0.35.0 마이그레이션과의 비교

| 항목 | v0.35.0 (이전) | v0.36.0 (현재) |
|------|----------------|----------------|
| 전략 | Strategy B' | Strategy B (동일) |
| Critical | 2건 | 1건 |
| 총 영향 파일 | 27개 | 34개 |
| 실제 수정 파일 | 12개 | 8개 |
| 추천 공수 | 11.8h | 4.8h |
| YAGNI 절감 | 42% | 81% |
| 핵심 수정 | policy.js 6개소 | session-start.js 1개소 |
| 테스트 | TC-101~110 (10 suites) | TC-111 + TC-105/109 업데이트 |

---

## 4. v2.1.0 이관 항목 (YAGNI 제외)

| 기능 | 공수 | 우선순위 |
|------|------|----------|
| Git Worktree 병렬 PDCA | 8h | P2 |
| Task Tracker 네이티브 통합 | 4h | P2 |
| Plan Mode 비대화형 CI/CD | 3h | P1 |
| Write-Protected Governance | 1h | P2 |
| Extension skill 콜론 구분자 | 1h | P2 |
| Dynamic Model Resolution | 8h | P3 |

---

## 5. 파일 변경 요약

```
수정:
  hooks/scripts/session-start.js     +33 lines (ensureAgentsEnabled 함수)
  hooks/scripts/before-tool.js       +8 lines (ask 분기)
  lib/gemini/version.js              +13 lines (7 flags + 3 canUse)
  bkit.config.json                   +1 line (testedVersions)
  tests/suites/tc105-v035-feature-gates.js  +24 lines (4 TC)
  tests/suites/tc109-v035-skill-agent-compat.js  +16 lines (2 TC)
  tests/run-all.js                   +3 lines (TC-111 등록)

신규:
  .gemini/settings.json              (enableAgents: true)
  tests/suites/tc111-v036-enableagents.js  (5 TC)
  docs/01-plan/features/gemini-cli-v036-migration.plan.md
  docs/02-design/features/gemini-cli-v036-migration.design.md
  docs/04-report/gemini-cli-v036-migration.report.md
```

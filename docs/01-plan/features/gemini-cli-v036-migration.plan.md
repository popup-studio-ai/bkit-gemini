# Gemini CLI v0.36.0 Migration Plan — bkit v2.0.2

> **Feature**: gemini-cli-v036-migration
> **Version**: bkit v2.0.2
> **Created**: 2026-03-28
> **Status**: Approved (L4 Auto)
> **Strategy**: B (Enhancement) — 검증된 Strategy B 패턴 3회차 적용
> **Migration Scope**: v0.35.0 → v0.35.3 (Stable) + v0.36.0 (Preview→Stable 대비)

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| 대상 버전 | v0.35.0 → v0.35.3 + v0.36.0 대비 |
| Critical Issues | 1건 (enableAgents 기본값 false 전환) |
| 추천 전략 | 접근법 B: Enhancement (4.8h) |
| YAGNI 절감 | 81% (25.5h → 4.8h) |
| Wave 구성 | 3 Waves (P0→P1→Tests) |
| 수정 파일 | 8개 |

## Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | v0.36.0에서 enableAgents 기본값 false로 21개 에이전트 전체 비활성화 |
| Solution | session-start.js에서 settings.json 자동 생성 + Feature Flag + BeforeTool ask |
| Function UX Effect | 사용자 무중단 에이전트 경험 + Hook UX 개선 |
| Core Value | bkit 안정성 확보 + v0.36.0 기능 기반 확보 |

---

## 1. 배경

### 1.1 v0.36.0 Breaking Changes

| # | 항목 | 영향도 | bkit 호환성 |
|---|------|--------|------------|
| 1 | `experimental.enableAgents` 기본값 `true` → `false` (PR #23546) | **P0 Critical** | 미호환 — 수정 필요 |
| 2 | `toolName` 정책 필수화 (PR #23330) | OK | 100% 호환 |
| 3 | SandboxManager 무상태 (PR #23141) | OK | 직접 영향 없음 |

### 1.2 v0.35.1~v0.35.3 Stable 패치

| 패치 | 내용 | 조치 |
|------|------|------|
| v0.35.1 | Plan Mode 경로 해석 수정 | npm 업데이트 |
| v0.35.2 | A2A 서버 정책 수정 | npm 업데이트 |
| v0.35.3 | Sandbox networkAccess 기본값 true | npm 업데이트 |

### 1.3 v0.36.0 새 기능 (채택 2건)

| 기능 | 채택 | 근거 |
|------|------|------|
| BeforeTool Hook 'ask' 결정 (PR #21146) | **채택** | 구현 비용 낮음, UX 즉시 개선 |
| Feature Flag 기반 확보 | **채택** | 모든 후속 작업의 전제 조건 |
| Git Worktree, Task Tracker 등 8건 | YAGNI 제외 | v2.1.0 이관 |

---

## 2. Wave 구성

### Wave 1: P0 Critical — enableAgents 방어 (40min)

| # | 작업 | 파일 | 변경 내용 |
|---|------|------|-----------|
| W1-1 | ensureAgentsEnabled() 함수 추가 | `hooks/scripts/session-start.js` | 정책 생성 직후(Line 47)에 settings.json 검증/생성 로직 추가 |
| W1-2 | settings.json 초기 파일 | `.gemini/settings.json` | `{ "experimental": { "enableAgents": true } }` |
| W1-3 | testedVersions 업데이트 | `bkit.config.json` | `["0.34.0", "0.35.0"]` → `["0.34.0", "0.35.0", "0.35.3", "0.36.0"]` |

### Wave 2: P1 기반 확보 (2h)

| # | 작업 | 파일 | 변경 내용 |
|---|------|------|-----------|
| W2-1 | v0.36.0 Feature Flag 7개 추가 | `lib/gemini/version.js` | getFeatureFlags()에 v0.36.0 블록, getBkitFeatureFlags()에 canUse* 3개 추가 |
| W2-2 | BeforeTool Hook 'ask' 결정 지원 | `hooks/scripts/before-tool.js` | processHook()에서 v0.36.0+ 감지 시 중위험 작업에 ask 반환 |

### Wave 3: 테스트 (2h)

| # | 작업 | 파일 | 변경 내용 |
|---|------|------|-----------|
| W3-1 | TC-111 신규 (5 TC) | `tests/suites/tc111-v036-enableagents.js` | settings.json 자동 생성/검증 5개 시나리오 |
| W3-2 | TC-105 업데이트 (4 TC 추가) | `tests/suites/tc105-v035-feature-gates.js` | v0.36.0 Feature Flag 검증 |
| W3-3 | TC-109 업데이트 (2 TC 추가) | `tests/suites/tc109-v035-skill-agent-compat.js` | enableAgents 설정 검증 |

---

## 3. 위험 관리

| 위험 | 완화 방안 |
|------|-----------|
| settings.json 기존 설정 덮어씌움 | enableAgents 키만 조건부 추가. 다른 설정 미변경 |
| v0.36.0 Stable이 preview와 다른 동작 | Feature Flag 보호 + Stable 후 실증 |
| BeforeTool 'ask'가 v0.35.x에서 오류 | Feature Flag로 v0.36.0+ 전용 |
| Extension skill 콜론 구분자 | v0.36.0 출시 후 모니터링. 1h 핫픽스 |

### 롤백 전략

각 Wave는 독립 commit. `git revert` 단일 명령으로 롤백 가능.

---

## 4. YAGNI 제외 목록

| 항목 | 공수 | 제외 근거 |
|------|------|-----------|
| Git Worktree 병렬 PDCA | 8h | preview 안정성 미검증, 아키텍처 변경 |
| Task Tracker 네이티브 통합 | 4h | 기존 브릿지 정상 동작 |
| Write-Protected Governance | 1h | Enterprise 수요 없음 |
| Plan Mode 비대화형 CI/CD | 3h | CI/CD 수요 없음 |
| macOS Seatbelt | 1h | 자동 적용, 코드 변경 불필요 |
| Dynamic Model Resolution | 8h | 단일 모델 운영 |
| skill 콜론 구분자 | 1h | Stable 후 모니터링 |
| toolName 가드 | 0.5h | 이미 100% 호환 |
| /mcp reload 문서 | 0.2h | 코드 참조 없음 |
| Memory Manager 평가 | 2h | 자체 메모리 정상 |

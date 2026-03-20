# bkit-gemini v2.0.0 리팩토링 계획서

> 작성일: 2026-03-19
> Feature: bkit-gemini-v200-refactoring
> 현재 버전: v1.5.9 (Gemini CLI v0.34.0)
> 목표 버전: v2.0.0
> 접근법: C (하이브리드 + YAGNI 강화) — 8개 전문 에이전트 분석 결과 종합

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | bkit-gemini v2.0.0 — Gemini CLI 네이티브 아키텍처 전환 |
| 현재 버전 | v1.5.9 (49 JS files, 12,618 LOC, 60+ Feature Flags) |
| 목표 버전 | v2.0.0 (~40 JS files, ~12,200 LOC, ~12 Feature Flags) |
| 예상 기간 | 8주 (4 Sprint) |
| 총 영향 파일 | ~30개 수정, ~8개 제거 |
| 참여 에이전트 | 8개 (gemini-researcher, bkit-impact-analyzer, enterprise-expert, security-architect, frontend-architect, product-manager, qa-strategist, migration-strategist) |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | CC 유산 잔존(CLAUDE_TO_GEMINI_MAP 등), 할루시네이션(세션 시작 ~2000+ 토큰 과부하), PDCA 강제로 초보자 이탈, 모든 에이전트 동일 권한(SEC-01 CRITICAL) |
| Solution | CC 완전 제거 + Phase-Aware Context 조건부 로딩 + 투명한 PDCA 자동화 + 에이전트 안전 티어 도입 |
| Function UX Effect | 세션 시작 토큰 60% 감소, "아이디어만 말하면" PDCA 자동 실행, 읽기 전용 에이전트 코드 수정 불가 |
| Core Value | **"Write your idea. bkit does the rest."** — Gemini CLI 네이티브 확장으로서의 정체성 확립 |

---

## 1. 프로젝트 배경

### 1.1 bkit의 여정

bkit는 Claude Code용 플러그인으로 시작하여, 바이브코딩에서 중요한 4대 철학(Automation First, No Guessing, Docs=Code, AI as Partner)을 기반으로 만들어졌습니다. 멀티 에이전트 대응을 위해 bkit-gemini으로 발전했으나, Context Engineering은 Claude Code 기반이라 Gemini CLI가 추구하는 철학과 부합하지 않는 부분이 존재합니다.

### 1.2 Gemini CLI의 Context Engineering 5대 원칙 (Phase 1 조사 결과)

| 원칙 | 설명 | bkit v1.5.9 정합성 |
|------|------|-------------------|
| **Context as Dynamic Resource** | 선택적 로딩(Select) + 압축(Compress) + 격리(Isolate) | ⚠️ 7개 @import 항상 로딩 |
| **Docs = Source of Truth** | Plan Mode가 .md만 쓰기 허용, GEMINI.md 계층 | ✅ PDCA 문서 기반 워크플로우 |
| **Human in the Loop** | Policy Engine(5-Tier) + Plan Mode + Hook 미들웨어 | ⚠️ subagent/modes 미활용 |
| **Progressive Disclosure** | Skills 지연 로딩 + JIT Context + Subagent 격리 | ❌ 세션 시작 시 전부 로딩 |
| **Defense in Depth** | 5-Tier TOML Policy 계층적 보안 | ⚠️ 3-Tier만 활용, yolo 우회 |

### 1.3 현재 아키텍처의 핵심 문제 (Phase 2 분석 결과)

| 문제 | 심각도 | 근거 |
|------|--------|------|
| CC 유산 잔존 (16개 파일) | Medium | CLAUDE_TO_GEMINI_MAP, PlatformAdapter ABC, ${CLAUDE_PLUGIN_ROOT} |
| 모든 에이전트 yolo 모드 | **CRITICAL** | spawn-agent-server.js:699 — 읽기 전용 에이전트도 쓰기 가능 (SEC-01) |
| 세션 시작 토큰 과부하 | High | 7개 @import 항상 로딩 ~2000+ 토큰 → Progressive Disclosure 위반 |
| Tracker hint-only | High | 실제 API 미호출 → Automation First 위반 |
| Feature Flags 과부하 | Medium | 55개 중 23개가 항상 true (v0.29~v0.33 레거시) |
| MCP spawn-agent 병목 | High | child_process.spawn 오버헤드, hang 위험 |

---

## 2. v2.0.0 핵심 목표 3가지

### 목표 1: 할루시네이션 감소 — Context Anchoring System

**전략**: PDCA 문서가 생성 순간부터 LLM 컨텍스트에 자동 포함 + 불필요한 컨텍스트 제거

| 지표 | v1.5.9 현재 | v2.0.0 목표 |
|------|-------------|-------------|
| 세션 시작 주입 토큰 | ~2000+ | ~800 (60% 감소) |
| Phase별 무관 컨텍스트 | 70% (7/7 항상 로딩) | 20% (조건부 로딩) |
| CC 관련 혼란 요소 | 18개 매핑 잔존 | 0 |
| Feature Flags | 55개 | ~12개 |
| Gap Analysis Match Rate 평균 | 90% | 95%+ |

### 목표 2: 바이브코딩 민주화 — "Write your idea. bkit does the rest."

**전략**: PDCA를 사용자가 실행하는 것이 아니라 AI가 백그라운드에서 자동 실행

| 레벨 | v1.5.9 경험 | v2.0.0 경험 |
|------|-------------|-------------|
| Starter | "PDCA가 뭐야?" → 이탈 | "로그인 만들어줘" → bkit이 조용히 Plan→Design→Do→Check |
| Dynamic | /pdca plan → /pdca design 수동 실행 | 자연어 대화 → PDCA 백그라운드 자동 + 확인만 |
| Enterprise | 기능 발견성 문제 | 팀 정책 자동 적용 + ACP 에이전트 통신 |

### 목표 3: 보안 강화 — 에이전트 안전 티어 + Defense in Depth

**전략**: 최소 권한 원칙(Least Privilege) 시스템 레벨 강제

| 지표 | v1.5.9 현재 | v2.0.0 목표 |
|------|-------------|-------------|
| 에이전트 권한 모델 | 모두 yolo (동일 권한) | 3-Tier (READONLY/DOCWRITE/FULL) |
| subagent TOML 규칙 | 0개 | 읽기전용 4개 + 문서전용 2개 + 분석전용 2개 |
| modes 정책 | 미사용 | Plan Mode 코드 작성 deny |
| 보안 감사 로그 | 없음 | .gemini/security-audit.log |
| CRITICAL 취약점 | 2건 (SEC-01, SEC-02) | 0건 |

---

## 3. 아키텍처 전환 설계

### 3.1 접근법: C (하이브리드 + YAGNI 강화)

8개 에이전트 분석 결과, **접근법 C**가 가중 점수 7.55/10으로 최고:

| 기준 | A: 점진적 | B: 클린 리라이트 | **C: 하이브리드** |
|------|:-:|:-:|:-:|
| 위험도 | 9 | 3 | **7** |
| 작업량 | 9 | 3 | **6** |
| CC 제거율 | 3 | 10 | **9** |
| Context 효율 | 4 | 10 | **8** |
| 장기 유지보수 | 4 | 9 | **8** |
| **가중 합계** | 6.05 | 6.35 | **7.55** |

**핵심 원칙**: "Aggressive Internal, Conservative External"
- 내부: `lib/adapters/` → `lib/gemini/`로 평탄화, CC 유산 전량 제거
- 외부: 스킬 이름, 에이전트 이름, PDCA 명령어 모두 불변

### 3.2 디렉토리 구조 변경

```
v1.5.9 (AS-IS)                    v2.0.0 (TO-BE)
lib/                                lib/
├── adapters/                       ├── gemini/           ← adapters/gemini/ 승격
│   ├── index.js          (삭제)   │   ├── platform.js   ← GeminiAdapter (ABC 불필요)
│   ├── platform-interface.js (삭제)│   ├── tools.js      ← CC 매핑 제거
│   └── gemini/                     │   ├── version.js    ← 12 flags only
│       ├── index.js      (이동)   │   ├── policy.js     ← v0.30 가드 제거
│       ├── version-detector.js     │   ├── hooks.js      ← command fallback 제거
│       ├── tool-registry.js        │   ├── tracker.js    ← direct CRUD
│       ├── hook-adapter.js         │   ├── context-fork.js (유지)
│       ├── policy-migrator.js      │   └── import-resolver.js (유지)
│       ├── tracker-bridge.js       ├── core/             (변경 없음)
│       ├── context-fork.js         ├── pdca/             (변경 없음)
│       └── import-resolver.js      ├── intent/           (변경 없음)
├── common.js             (삭제)   ├── task/             (변경 없음)
├── core/                           ├── team/             (변경 없음)
├── pdca/                           ├── context-hierarchy.js (유지)
├── intent/                         └── skill-orchestrator.js (Level-Aware 추가)
├── task/
├── team/
├── context-hierarchy.js
├── skill-orchestrator.js
└── common.js
```

### 3.3 YAGNI 제거 목록 (12항목)

| # | 항목 | LOC | 제거 근거 |
|---|------|-----|-----------|
| Y-1 | `CLAUDE_TO_GEMINI_MAP` | ~20 | Gemini 전용, CC 매핑 불필요 |
| Y-2 | `FORWARD_ALIASES` | ~10 | Issue #1391 1년 미구현 |
| Y-3 | `REVERSE_FORWARD_ALIASES` | ~5 | Y-2 역매핑 |
| Y-4 | `getVersionedToolName()` | ~5 | 빈 함수 (항상 원본 반환) |
| Y-5 | `PlatformAdapter` ABC | ~80 | 구현체 1개만 존재 |
| Y-6 | `lib/adapters/index.js` | ~30 | 항상 Gemini 반환 |
| Y-7 | v0.29~v0.33 Feature Flags (23개) | ~50 | minVersion 0.34.0이면 항상 true |
| Y-8 | `reverseMapToolName()` | ~5 | 호출처 없음 |
| Y-9 | `mapToolName()` | ~5 | CC→Gemini 매핑 불필요 |
| Y-10 | `diffSnapshots()` | ~25 | 내외부 호출처 없음 |
| Y-11 | `BKIT_LEGACY_NAMES` | ~5 | v1.5.2 이전 레거시 |
| Y-12 | CC 변수 치환 | ~5 | `${CLAUDE_PLUGIN_ROOT}` 불필요 |
| | **합계** | **~245 LOC** | |

---

## 4. 구현 로드맵 (4 Sprint, 8주)

### Sprint 1: CC 유산 제거 + 보안 CRITICAL 수정 (Week 1-2)

| Wave | 작업 | 파일 | 공수 |
|------|------|------|------|
| **1-1** | CLAUDE_TO_GEMINI_MAP + 관련 매핑 전량 삭제 | tool-registry.js, index.js | 2h |
| **1-2** | PlatformAdapter ABC + adapters/index.js 삭제 | 2 files 삭제 | 1h |
| **1-3** | lib/common.js 제거, 직접 import 전환 | ~15 files | 3h |
| **1-4** | `${CLAUDE_PLUGIN_ROOT}` + isClaudeCode() 삭제 | 3 files | 1h |
| **1-5** | **SEC-01: 에이전트 안전 티어 도입** | spawn-agent-server.js | 4h |
| **1-6** | **SEC-02: subagent TOML 정책** | policy-migrator.js, 3 TOML | 4h |
| **1-7** | **SEC-03: team_assign path traversal** | spawn-agent-server.js | 1h |
| **1-8** | **SEC-04: run_shell_command 기본 ask_user** | bkit-permissions.toml | 0.5h |
| **1-9** | **SEC-08: modes 정책 Plan Mode deny** | TOML 정책 | 2h |

**Sprint 1 게이트**: TC Pass Rate ≥ 99%, Export diff 0 삭제, SEC-01/02 해소

### Sprint 2: Context Engineering 고도화 (Week 3-4)

| Wave | 작업 | 파일 | 공수 |
|------|------|------|------|
| **2-1** | version-detector → lib/gemini/version.js (12 flags) | version.js | 3h |
| **2-2** | minGeminiCliVersion "0.34.0" + 설정 정리 | bkit.config.json | 1h |
| **2-3** | GEMINI.md 경량화 — Phase-Aware 조건부 @import | GEMINI.md, context/* | 4h |
| **2-4** | contextFileName 배열 전환 | gemini-extension.json | 2h |
| **2-5** | before-model.js modelRouting 힌트 | before-model.js | 2h |
| **2-6** | Context Anchoring — PDCA 문서 자동 컨텍스트 주입 | before-model.js, session-start.js | 4h |
| **2-7** | Tracker CRUD 직접 호출 모드 | tracker-bridge.js | 4h |

**Sprint 2 게이트**: 세션 시작 토큰 ≤ 800, Phase-Aware 로딩 동작 확인

### Sprint 3: 바이브코딩 민주화 + 어댑터 평탄화 (Week 5-6)

| Wave | 작업 | 파일 | 공수 |
|------|------|------|------|
| **3-1** | lib/adapters/gemini/ → lib/gemini/ 이동 | ~8 files | 4h |
| **3-2** | 전체 require() 경로 업데이트 | ~20 files | 4h |
| **3-3** | Progressive Onboarding — 레벨별 SessionStart | session-start.js | 4h |
| **3-4** | Auto-Level Detection 강화 (대화 의도 기반) | intent/trigger.js, session-start.js | 3h |
| **3-5** | 투명한 PDCA — 백그라운드 자동 실행 로직 | after-tool.js, skill-orchestrator.js | 6h |
| **3-6** | Skill Visibility Control (레벨별 필터링) | skill-orchestrator.js | 3h |
| **3-7** | Feature Report 조건부 출력 | feature-report.md, output styles | 2h |

**Sprint 3 게이트**: 전체 require() 무결성, Starter 사용자 3단계 온보딩 테스트

### Sprint 4: 안정화 + 문서 + 릴리스 (Week 7-8)

| Wave | 작업 | 파일 | 공수 |
|------|------|------|------|
| **4-1** | 철학 문서 업데이트 (Gemini CE 반영) | bkit-system/philosophy/*.md | 4h |
| **4-2** | CHANGELOG.md v2.0.0 작성 | CHANGELOG.md | 2h |
| **4-3** | 모든 버전 문자열 "2.0.0" 통일 | hooks.json, config, extension | 1h |
| **4-4** | 통합 Regression (79 TC + 신규 TC-80~82) | tests/ | 4h |
| **4-5** | Skill Eval 확장 (25/35 커버리지) | evals/ | 6h |
| **4-6** | E2E PDCA 사이클 전체 검증 | 수동 테스트 | 4h |
| **4-7** | template 내 CC 잔재 제거 | templates/*.md | 2h |
| **4-8** | tool-reference.md CC 매핑 섹션 제거 | .gemini/context/ | 1h |
| **4-9** | 보안 감사 로그 도입 (SEC-09) | Hook 전반 | 4h |

**Sprint 4 게이트**: TC Pass Rate ≥ 99%, Skill Eval ≥ 25/35, CRITICAL 0건

---

## 5. 품질 보증 전략

### 5.1 핵심 품질 메트릭

| 메트릭 | 목표값 | 측정 방법 |
|--------|--------|-----------|
| TC Pass Rate | ≥ 99% | 기존 79 TC + 신규 3개 |
| Export 하위 호환성 | 삭제 0건 (Sprint 1 후) | baseline diff |
| Skill Eval 커버리지 | ≥ 80% (25/35) | eval.yaml 파일 수 |
| Hook ERROR | 0건 | Zero Script QA 로그 |
| CRITICAL 보안 이슈 | 0건 | security-architect 검증 |
| 세션 시작 토큰 | ≤ 800 | 토큰 카운트 측정 |
| PDCA Match Rate 평균 | ≥ 95% | .pdca-status.json |

### 5.2 롤백 전략

- **Sprint 단위 브랜치**: `feature/v2.0.0-sprint1` ~ `sprint4`
- **Sprint 완료 태그**: `v2.0.0-alpha.1` ~ `v2.0.0-alpha.4`
- **v1.5.9 LTS**: main 브랜치에 v1.5.9 유지, v2.0.0은 별도 브랜치
- **롤백 기준**: P0 TC 1건 실패, export 삭제 1건, hook ERROR, 보안 게이트 실패 → 즉시 revert

### 5.3 v0.34.0 미만 사용자 대응

- v2.0.0은 **Gemini CLI v0.34.0+ 전용** (Breaking Change)
- v1.5.9를 LTS로 유지하여 v0.33 이하 사용자 지원
- CHANGELOG에 명시적 Breaking Change 고지

---

## 6. 보안 강화 계획 (9.5일)

### 6.1 CRITICAL (Sprint 1 필수)

| ID | 이슈 | 수정 방안 | 공수 |
|---|---|---|---|
| SEC-01 | 모든 에이전트 yolo 모드 | 안전 티어 도입 (READONLY/DOCWRITE/FULL) | 4h |
| SEC-02 | subagent TOML 미사용 | 3그룹 deny 규칙 생성 | 4h |

### 6.2 HIGH (Sprint 1-2)

| ID | 이슈 | 수정 방안 | 공수 |
|---|---|---|---|
| SEC-03 | team_assign path traversal | sanitize 적용 | 1h |
| SEC-04 | shell 기본 ALLOW | 기본 ask_user | 0.5h |
| SEC-05 | Policy Engine 시 bkit 검사 skip | 이중 방어 복원 | 2h |

### 6.3 MEDIUM (Sprint 2-4)

| ID | 이슈 | 수정 방안 | 공수 |
|---|---|---|---|
| SEC-06 | 상태 파일 스키마 미검증 | JSON Schema 검증 도입 | 2h |
| SEC-07 | 버전 fallback 보안 | 실패 시 보안 최대화 | 1h |
| SEC-08 | modes 정책 미사용 | Plan Mode deny 규칙 | 2h |
| SEC-09 | 보안 감사 로그 없음 | .gemini/security-audit.log | 4h |
| SEC-10 | 에러 경로 노출 | 에이전트 이름으로 대체 | 1h |

---

## 7. 철학 업데이트 (v2.0.0)

### 7.0 symlink 독립화

현재 `bkit-system/philosophy/`는 `bkit-claude-code/bkit-system/philosophy/`의 **심볼릭 링크**입니다.
v2.0.0에서 Gemini CE 원칙을 추가하면 CC 버전과 철학이 달라지므로, **symlink를 끊고 독립 복사본**으로 전환합니다.

```
Sprint 4 작업:
1. cp -RL bkit-system/philosophy/ bkit-system/philosophy-backup/
2. rm bkit-system/philosophy (symlink 제거)
3. mv bkit-system/philosophy-backup/ bkit-system/philosophy/
4. Gemini CE 원칙 2개 추가 (Progressive Disclosure, Defense in Depth)
5. Context Engineering 문서를 Gemini CLI 관점으로 업데이트
```

### 7.1 기존 4대 철학 유지 + Gemini CE 통합

| 철학 | v1.x 해석 | v2.0.0 진화 |
|------|-----------|-------------|
| **Automation First** | 사용자가 /pdca 실행 → 자동 가이드 | **투명한 자동화**: 사용자가 의도만 표현 → bkit이 PDCA 전체 자동 실행 |
| **No Guessing** | 문서 없으면 → 질문 | **Context Anchoring**: 문서가 항상 컨텍스트에 → 추측 자체가 불가능 |
| **Docs = Code** | Design 먼저 → 구현 | **Gemini Plan Mode 통합**: Plan Mode = Plan 단계, write deny = 시스템 강제 |
| **AI as Partner** | 21개 전문 에이전트 | **안전 티어 + Progressive Disclosure**: 역할별 권한 + 필요 시점에 에이전트 |

### 7.2 신규 원칙 추가

| 원칙 | 설명 |
|------|------|
| **Progressive Disclosure** | 필요한 컨텍스트만, 필요한 시점에. 과부하 = 할루시네이션의 원인 |
| **Defense in Depth** | Policy Engine 5-Tier + 에이전트 안전 티어 + Hook 검증 = 3중 방어 |

---

## 8. gemini-cli-034-enhancement 통합

이전 설계서(`docs/02-design/features/gemini-cli-034-enhancement.design.md`)의 7개 작업을 v2.0.0 Sprint에 통합:

| 034-enhancement 작업 | v2.0.0 Sprint | 변경사항 |
|----------------------|---------------|---------|
| A-1: Tracker CRUD | Sprint 2 (2-7) | 동일 |
| A-2: subagent TOML | Sprint 1 (1-6) | SEC-02와 통합 |
| A-3: modes 정책 | Sprint 1 (1-9) | SEC-08과 통합 |
| B-1: modelRouting | Sprint 2 (2-5) | 동일 |
| B-2: contextFileNameArray | Sprint 2 (2-4) | 동일 |
| B-3: MCP Prompt Loader | Sprint 4 (백로그) | 우선순위 하향 |

---

## 9. 위험 관리

| # | 위험 | 가능성 | 영향 | 완화 |
|---|------|:---:|:---:|------|
| R-1 | require() 경로 변경 누락 | 높음 | 높음 | grep 전수 검사 + CI 체인 테스트 |
| R-2 | v0.34.0 미만 사용자 호환성 | 중간 | 중간 | v1.5.9 LTS 유지 |
| R-3 | Hook 스크립트 모듈 미발견 | 높음 | 높음 | hooks.json 경로 불변, 내부 require만 변경 |
| R-4 | Gemini CLI v0.35+ Breaking Changes | 높음 | 높음 | Feature Flag 시스템 유지 (12개) |
| R-5 | 투명한 PDCA가 사용자 의도 오판 | 중간 | 중간 | AskUserQuestion 확인 단계 유지 |
| R-6 | common.js 제거 시 외부 스크립트 깨짐 | 중간 | 높음 | Sprint 1에서 전수 검사 후 제거 |

---

## 10. 성공 기준

| 기준 | 목표값 | 측정 시점 |
|------|--------|-----------|
| CC 유산 코드 라인 | 0 LOC | Sprint 1 완료 |
| Feature Flags | ≤ 12개 | Sprint 2 완료 |
| 세션 시작 토큰 | ≤ 800 | Sprint 2 완료 |
| CRITICAL 보안 이슈 | 0건 | Sprint 1 완료 |
| TC Pass Rate | ≥ 99% | Sprint 4 완료 |
| Skill Eval 커버리지 | ≥ 80% | Sprint 4 완료 |
| Starter 사용자 첫 PDCA 완료 시간 | 50% 단축 | Sprint 3 완료 |
| PDCA Match Rate 평균 | ≥ 95% | Sprint 4 완료 |

---

## 11. v2.0.0 이후 발전 방향

| 우선순위 | 기능 | 예상 버전 |
|---------|------|-----------|
| 1 | RuntimeHook SDK 전면 전환 | v2.1.0 |
| 2 | Native Skill System 통합 | v2.1.0 |
| 3 | ACP 에이전트 통신 | v2.2.0 |
| 4 | Extension Registry Client | v2.2.0 |
| 5 | JIT Context Loading (v0.35.0+) | v2.3.0 |
| 6 | InjectionService 패턴 | v2.3.0 |

---

## 부록: 8개 에이전트 분석 요약

| 에이전트 | 핵심 결론 |
|----------|-----------|
| **gemini-researcher** | Gemini CE 5대 원칙 발견. Progressive Disclosure가 bkit의 최대 갭 |
| **bkit-impact-analyzer** | 49 JS / 12,618 LOC / 60+ flags. MCP spawn-agent가 최대 병목 |
| **enterprise-expert** | 옵션 C 권장. CLAUDE_TO_GEMINI_MAP 삭제가 정체성 결정 |
| **security-architect** | CRITICAL 2건(SEC-01 yolo, SEC-02 subagent). 안전 티어 도입 필수 |
| **frontend-architect** | DX 72/100. PDCA 투명 자동화 = 핵심 UX 전환. Progressive Onboarding |
| **product-manager** | "Write your idea. bkit does the rest." Context Anchoring + Verification Loop |
| **qa-strategist** | 210 exports 하위호환이 최대 리스크. 4단계 게이트. TC ≥ 99% |
| **migration-strategist** | 접근법 C 가중점수 7.55. 4 Wave 10일. ~400 LOC 제거. 30%+ 토큰 효율 |

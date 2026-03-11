# bkit-gemini v1.5.8 종합 Gap 분석 보고서

> 작성일: 2026-03-11 | 3개 리서치 보고서 종합 분석

---

## Executive Summary

| 항목 | 값 |
|------|-----|
| Gemini CLI 최신 안정 버전 | v0.32.1 (2026-03-04) |
| Gemini CLI 프리뷰 버전 | v0.33.0-preview.4 (2026-03-06) |
| bkit-gemini 현재 버전 | v1.5.7 |
| bkit-claude-code 현재 버전 | v1.6.1 |
| 총 Gap 항목 | 27개 |
| 긴급 대응 (P0) | 3개 |
| 주요 기능 격차 (P1) | 12개 |
| 개선 기회 (P2) | 8개 |
| 미래 준비 (P3) | 4개 |

---

## 1. Gemini CLI 변경사항 대응 필목 (P0 - 긴급)

### 1.1 도구 스키마 Breaking Changes

| # | 변경사항 | 영향 범위 | 대응 방안 |
|---|---------|----------|----------|
| G-01 | `read_file` 라인번호 1-기반 변경 | 에이전트 프롬프트, 도구 레지스트리 | tool-registry.js 업데이트, 에이전트 프롬프트 수정 |
| G-02 | `replace`에 `allow_multiple` 파라미터 추가 | 에이전트 도구 사용 패턴 | tool-registry.js에 파라미터 추가, 에이전트 가이드 업데이트 |
| G-03 | `grep_search` → `include_pattern` 파라미터명 변경 | 에이전트 도구 호출 | tool-registry.js Forward Alias 업데이트 |

### 1.2 호환성 업데이트

| # | 항목 | 현재 | 필요 |
|---|------|------|------|
| G-04 | testedVersions | ~v0.32.1 | v0.33.x 추가 |
| G-05 | 기능 플래그 | 34개 (v0.32.0) | v0.33.x 기능 추가 |
| G-06 | minGeminiCliVersion | 0.29.0 | 유지 (하위 호환) |

---

## 2. bkit-claude-code 대비 기능 격차 (P1 - 주요)

### 2.1 미구현 에이전트 (5개)

| # | 에이전트 | 역할 | 우선순위 |
|---|---------|------|:--------:|
| CC-01 | pm-lead | PM 팀 리드 오케스트레이션 | P1 |
| CC-02 | pm-discovery | 기회 발견 (OST) | P1 |
| CC-03 | pm-strategy | 전략 (JTBD, Lean Canvas) | P1 |
| CC-04 | pm-research | 시장 조사 | P1 |
| CC-05 | pm-prd | PRD 작성 | P1 |

### 2.2 미구현 스킬 (3개+)

| # | 스킬 | 기능 | 우선순위 |
|---|------|------|:--------:|
| CC-06 | plan-plus | 브레인스토밍 기반 고도화 계획 | P1 |
| CC-07 | simplify | 코드 정리/간소화 | P1 |
| CC-08 | loop | 반복 실행 (Cron) | P2 |
| CC-09 | batch | 병렬 작업 처리 | P2 |
| CC-10 | output-style-setup | 출력 스타일 설치 | P2 |

### 2.3 미구현 시스템 기능

| # | 기능 | 설명 | 우선순위 |
|---|------|------|:--------:|
| CC-11 | CTO Team 오케스트레이션 완전 구현 | 5가지 패턴 (Leader/Council/Swarm/Pipeline/Watchdog) | P1 |
| CC-12 | lib/team/ 모듈 (9개) | 코디네이터, 전략, CTO 로직, 통신, 태스크 큐, 상태 기록 | P1 |
| CC-13 | Skills 2.0 분류 체계 | Workflow(9)/Capability(18)/Hybrid(1) 분류 | P2 |
| CC-14 | Skill Evals | 28개 스킬 평가 프레임워크 | P2 |
| CC-15 | Skill Creator | 스킬 생성기 | P3 |
| CC-16 | Path Registry | 상태 파일 경로 중앙 관리 | P1 |
| CC-17 | Version-Gated Features | getFeatureFlags() 기반 점진적 활성화 | P2 |
| CC-18 | Template Validator | PostToolUse hook 문서 검증 | P2 |
| CC-19 | Executive Summary 자동 출력 | PDCA 문서 작업 후 요약 테이블 자동 출력 | P1 |
| CC-20 | Feature Usage Report 자동 출력 | 매 응답 bkit 기능 사용 보고서 | P1 |

---

## 3. Gemini CLI 특화 고도화 기회 (P2 - 개선)

### 3.1 gemini-extension.json 새 필드 활용

| # | 필드 | 활용 방안 | 우선순위 |
|---|------|----------|:--------:|
| GE-01 | `plan.directory` | PDCA Plan 모드와 Gemini Plan 통합 | P2 |
| GE-02 | `excludeTools` | 레벨별 도구 제한 (Starter 안전 모드) | P2 |
| GE-03 | `themes` | bkit output-styles와 Gemini themes 연동 | P3 |
| GE-04 | `agents` | .gemini/agents/*.md 네이티브 에이전트 통합 | P2 |

### 3.2 MCP v2 마이그레이션 준비

| # | 항목 | 설명 | 우선순위 |
|---|------|------|:--------:|
| GE-05 | MCP v2 프로토콜 | 2026-03 말 예정, 프로토콜 변경 대응 | P2 |
| GE-06 | OAuth 2.1 + PKCE | 인증 플로우 업그레이드 | P3 |

### 3.3 서브에이전트 네이티브 전환

| # | 항목 | 설명 | 우선순위 |
|---|------|------|:--------:|
| GE-07 | .gemini/agents/*.md | MCP spawn → 네이티브 에이전트 하이브리드 | P2 |
| GE-08 | transferToAgent/delegateToAgent | 내장 에이전트 전환 기능 활용 | P2 |

---

## 4. 아키텍처 및 구조 개선 (P2 - 개선)

| # | 항목 | 현황 | 개선 방안 | 우선순위 |
|---|------|------|----------|:--------:|
| AR-01 | bkit-system/ 디렉토리 | 비어 있음 | 활용 또는 제거 | P2 |
| AR-02 | .claude/ 디렉토리 | CC 호환 잔재 | Gemini 전용 정리 | P2 |
| AR-03 | .bkit/ vs .gemini/ | 상태 분산 | 단일 디렉토리 통합 | P2 |
| AR-04 | 새 기능 감지 패턴 | 4개 언어만 | ES/FR/DE/IT 추가 | P2 |
| AR-05 | 테스트 자동화 | 수동 실행 | CI/CD 통합 | P3 |
| AR-06 | 에이전트 모델 하드코딩 | gemini-3.1-pro 고정 | 설정 외부화 | P2 |
| AR-07 | 스냅샷 파일 누적 | 자동 정리 없음 | 오래된 스냅샷 자동 정리 정책 | P3 |
| AR-08 | Context Fork LRU | 10 고정 | 동적 크기 조정 | P3 |

---

## 5. v1.5.8 고도화 우선순위 종합

### Tier 1: 즉시 대응 (Breaking Changes + 핵심 기능)

| 우선순위 | 항목 | 작업량(예상) |
|:--------:|------|:-----------:|
| **P0** | G-01~G-03: 도구 스키마 Breaking Changes 대응 | 중 |
| **P0** | G-04~G-05: Gemini CLI v0.33.x 호환성 업데이트 | 소 |
| **P1** | CC-01~CC-05: PM Agent Team (5개 에이전트) | 대 |
| **P1** | CC-06: plan-plus 스킬 | 대 |
| **P1** | CC-07: simplify 스킬 | 중 |
| **P1** | CC-11~CC-12: CTO Team 오케스트레이션 완전 구현 | 대 |
| **P1** | CC-16: Path Registry | 중 |
| **P1** | CC-19~CC-20: Executive Summary/Feature Usage Report | 중 |

### Tier 2: 기능 강화 (bkit-CC 동등성 + Gemini 특화)

| 우선순위 | 항목 | 작업량(예상) |
|:--------:|------|:-----------:|
| **P2** | CC-08~CC-10: loop, batch, output-style-setup 스킬 | 중 |
| **P2** | CC-13~CC-14: Skills 2.0 분류, Skill Evals | 중 |
| **P2** | CC-17~CC-18: Version-Gated Features, Template Validator | 중 |
| **P2** | GE-01~GE-02: plan.directory, excludeTools 활용 | 소 |
| **P2** | GE-04~GE-05: 네이티브 에이전트 통합, MCP v2 준비 | 대 |
| **P2** | AR-01~AR-04, AR-06: 구조 정리, 언어 패턴 추가, 모델 외부화 | 중 |

### Tier 3: 미래 준비

| 우선순위 | 항목 | 작업량(예상) |
|:--------:|------|:-----------:|
| **P3** | CC-15: Skill Creator | 중 |
| **P3** | GE-03, GE-06: themes 연동, OAuth 업그레이드 | 소 |
| **P3** | AR-05, AR-07~AR-08: CI/CD, 스냅샷 정리, LRU 동적화 | 중 |

---

## 6. 핵심 인사이트

### 6.1 bkit-claude-code에서 배울 핵심 패턴

1. **SessionStart 동적 context 주입**: 정적 GEMINI.md 대신 훅에서 PDCA 상태, 팀 상태, 출력 스타일 등을 동적 주입
2. **lib/common.js 브릿지 패턴**: 208개 함수를 단일 진입점으로 재export하여 하위 호환성 유지
3. **5가지 오케스트레이션 패턴**: PDCA 단계별 자동 패턴 선택 (Leader/Council/Swarm/Pipeline/Watchdog)
4. **unified-stop.js 핸들러 레지스트리**: 단일 진입점에서 context 기반 라우팅
5. **Version-Gated Features**: getFeatureFlags() 기반 점진적 기능 활성화

### 6.2 Gemini CLI 특화 차별점 유지/강화

1. **RuntimeHook SDK 듀얼 모드**: 40-97% 지연 감소 (CC에 없는 고유 강점)
2. **4-Tier TOML Policy Engine**: Gemini 네이티브 보안 (CC의 permission.json 대비 강력)
3. **Task Tracker-PDCA Bridge**: 인스트럭션 기반 동기화 (CC에 없는 고유 기능)
4. **34개 기능 플래그 버전 감지**: 광범위 버전 지원 (CC에 없는 고유 기능)
5. **TOML 커맨드 고급 문법**: @{path}, !{command}, {{args}} (CC에 없는 고유 기능)

### 6.3 v1.5.8 핵심 방향성

> **"bkit-claude-code v1.6.1 기능 동등성 달성 + Gemini CLI v0.33.x 대응 + Gemini 고유 강점 강화"**

1. **Breaking Changes 즉시 대응**: 도구 스키마 변경 + 버전 호환성 업데이트
2. **PM Agent Team + plan-plus**: bkit-CC의 핵심 차별 기능 이식
3. **CTO Team 완전 구현**: 멀티 에이전트 오케스트레이션 활성화
4. **Gemini 네이티브 통합 심화**: 네이티브 에이전트, Plan 모드, excludeTools 등

---

> 본 보고서는 3개 리서치 보고서(gemini-cli-update-research.md, bkit-claude-code-analysis.md, bkit-gemini-current-analysis.md)를 종합 분석하여 작성되었습니다.

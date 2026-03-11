# bkit-gemini v1.5.8 고도화 계획서

> **요약**: Gemini CLI v0.33.x 대응 + bkit-claude-code v1.6.1 기능 동등성 달성 + Gemini 고유 강점 강화
>
> **프로젝트**: bkit-gemini
> **현재 버전**: v1.5.7 → **타깃 버전**: v1.5.8
> **작성자**: CTO Team (10명 체제)
> **작성일**: 2026-03-11
> **상태**: Draft

---

## Executive Summary

| 항목 | 값 |
|------|-----|
| Feature | bkit-gemini v1.5.8 고도화 |
| 작성일 | 2026-03-11 |
| 대상 | Gemini CLI v0.29.0~v0.33.x |
| 총 작업 항목 | 27개 (P0: 3, P1: 12, P2: 8, P3: 4) |

### Value Delivered (4관점)

| 관점 | 내용 |
|------|------|
| **Problem** | Gemini CLI v0.33.x Breaking Changes 미대응, bkit-CC v1.6.1 대비 핵심 기능 15개 미구현 |
| **Solution** | 도구 스키마 즉시 대응 + PM Agent Team/plan-plus/CTO Team 이식 + Gemini 네이티브 통합 심화 |
| **기능/UX 효과** | 버전 호환성 보장, PM 워크플로우 추가, 팀 오케스트레이션 활성화, 네이티브 에이전트 통합 |
| **핵심 가치** | "bkit-CC 동등 수준 + Gemini 특화 차별성"을 갖춘 완성도 높은 Vibecoding Kit |

---

## 1. 개요

### 1.1 목적

bkit-gemini v1.5.8은 다음 3가지 목표를 달성한다:

1. **Gemini CLI v0.33.x Breaking Changes 즉시 대응**: 도구 스키마 변경(read_file, replace, grep_search)에 대한 호환성 확보
2. **bkit-claude-code v1.6.1 기능 동등성**: PM Agent Team, plan-plus, CTO Team 오케스트레이션, Skills 2.0 분류 등 핵심 기능 이식
3. **Gemini CLI 고유 강점 강화**: 네이티브 에이전트 통합, Plan 모드 연동, excludeTools 활용 등

### 1.2 배경

- Gemini CLI가 v0.32.1(안정) → v0.33.0-preview.4(프리뷰)로 진화하면서 도구 스키마, MCP v2, 네이티브 에이전트 등 주요 변경 발생
- bkit-claude-code는 v1.6.1까지 진화하여 PM Agent Team(5개), plan-plus, Skills 2.0, CTO Team 완전 오케스트레이션 등 고급 기능 보유
- bkit-gemini v1.5.7은 핵심 PDCA + 16에이전트 + 29스킬 기반은 탄탄하나, 위 기능들이 미구현

### 1.3 관련 문서

- 리서치: `docs/01-plan/research/gemini-cli-update-research.md`
- 리서치: `docs/01-plan/research/bkit-claude-code-analysis.md`
- 리서치: `docs/01-plan/research/bkit-gemini-current-analysis.md`
- Gap 분석: `docs/01-plan/research/gap-analysis-synthesis.md`

---

## 2. 범위

### 2.1 In Scope

#### Sprint 1: 긴급 대응 (P0 - Gemini CLI 호환성)
- [x] G-01: `read_file` 1-기반 라인번호 대응
- [x] G-02: `replace`의 `allow_multiple` 파라미터 대응
- [x] G-03: `grep_search` → `include_pattern` 파라미터명 대응
- [x] G-04: testedVersions에 v0.33.x 추가
- [x] G-05: 기능 플래그에 v0.33.x 기능 추가

#### Sprint 2: 핵심 기능 이식 (P1 - bkit-CC 동등성)
- [ ] CC-01~05: PM Agent Team (5개 에이전트: pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd)
- [ ] CC-06: plan-plus 스킬 (브레인스토밍 기반 고도화 계획)
- [ ] CC-07: simplify 스킬 (코드 정리/간소화)
- [ ] CC-11~12: CTO Team 오케스트레이션 완전 구현 (lib/team/ 9개 모듈, 5가지 패턴)
- [ ] CC-16: Path Registry (상태 파일 경로 중앙 관리)
- [ ] CC-19~20: Executive Summary / Feature Usage Report 자동 출력

#### Sprint 3: 기능 강화 (P2 - Gemini 특화 + 개선)
- [ ] CC-08~10: loop, batch, output-style-setup 스킬
- [ ] CC-13~14: Skills 2.0 분류 체계, Skill Evals
- [ ] CC-17~18: Version-Gated Features, Template Validator
- [ ] GE-01~02: gemini-extension.json 새 필드 활용 (plan.directory, excludeTools)
- [ ] GE-04: 네이티브 에이전트 하이브리드 통합
- [ ] AR-01~06: 구조 정리, 언어 패턴 추가, 모델 외부화

### 2.2 Out of Scope

- Gemini CLI v0.34.x (나이틀리) 전용 기능 대응 (불안정)
- MCP v2 완전 마이그레이션 (v0.33.x에서 아직 프리뷰)
- Skill Creator (P3, 다음 버전으로 연기)
- CI/CD 파이프라인 구축 (P3, 별도 이슈)
- OAuth 2.1 + PKCE 업그레이드 (P3, MCP v2 안정화 후)

---

## 3. 요구사항

### 3.1 기능 요구사항

#### Sprint 1: 긴급 대응 (P0)

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|:--------:|:----:|
| FR-01 | tool-registry.js에 read_file 1-기반 라인번호 반영 | P0 | Pending |
| FR-02 | tool-registry.js에 replace allow_multiple 파라미터 추가 | P0 | Pending |
| FR-03 | tool-registry.js에 grep_search include_pattern 매핑 추가 | P0 | Pending |
| FR-04 | bkit.config.json testedVersions에 v0.33.x 추가 | P0 | Pending |
| FR-05 | version-detector.js에 v0.33.x 기능 플래그 추가 | P0 | Pending |
| FR-06 | 16개 에이전트 프롬프트에서 도구 사용 가이드 업데이트 | P0 | Pending |
| FR-07 | .gemini/context/tool-reference.md 도구 레퍼런스 업데이트 | P0 | Pending |

#### Sprint 2: 핵심 기능 이식 (P1)

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|:--------:|:----:|
| FR-10 | PM Agent Team: pm-lead 에이전트 구현 | P1 | Pending |
| FR-11 | PM Agent Team: pm-discovery 에이전트 구현 | P1 | Pending |
| FR-12 | PM Agent Team: pm-strategy 에이전트 구현 | P1 | Pending |
| FR-13 | PM Agent Team: pm-research 에이전트 구현 | P1 | Pending |
| FR-14 | PM Agent Team: pm-prd 에이전트 구현 | P1 | Pending |
| FR-15 | pm-discovery 스킬 구현 (PM 팀 오케스트레이션 커맨드) | P1 | Pending |
| FR-16 | plan-plus 스킬 구현 (브레인스토밍 + PDCA Plan 결합) | P1 | Pending |
| FR-17 | simplify 스킬 구현 (코드 정리, /simplify 커맨드) | P1 | Pending |
| FR-20 | lib/team/ 모듈 구현 (9개: coordinator, strategy, cto-logic, communication, task-queue, state-recorder 등) | P1 | Pending |
| FR-21 | CTO Team 5가지 오케스트레이션 패턴 구현 (Leader/Council/Swarm/Pipeline/Watchdog) | P1 | Pending |
| FR-22 | bkit.config.json에 team.enabled: true 활성화 + 패턴 설정 | P1 | Pending |
| FR-23 | Path Registry 구현 (lib/core/paths.js) | P1 | Pending |
| FR-24 | 상태 파일 경로 중앙 관리 및 자동 마이그레이션 | P1 | Pending |
| FR-25 | SessionStart hook에 Executive Summary 규칙 주입 | P1 | Pending |
| FR-26 | SessionStart hook에 Feature Usage Report 규칙 주입 | P1 | Pending |
| FR-27 | GEMINI.md에 Executive Summary / Feature Usage Report 섹션 추가 | P1 | Pending |

#### Sprint 3: 기능 강화 (P2)

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|:--------:|:----:|
| FR-30 | loop 스킬 구현 (반복 실행, Cron) | P2 | Pending |
| FR-31 | batch 스킬 구현 (병렬 작업 처리) | P2 | Pending |
| FR-32 | output-style-setup 스킬 구현 | P2 | Pending |
| FR-33 | Skills 2.0 분류 체계 도입 (W/C/H 메타데이터) | P2 | Pending |
| FR-34 | Skill Evals 프레임워크 기초 구현 | P2 | Pending |
| FR-35 | Version-Gated Features (getFeatureFlags 개선) | P2 | Pending |
| FR-36 | Template Validator (AfterTool hook에서 문서 검증) | P2 | Pending |
| FR-37 | gemini-extension.json에 plan.directory 필드 추가 | P2 | Pending |
| FR-38 | gemini-extension.json에 excludeTools 필드 활용 (레벨별) | P2 | Pending |
| FR-39 | 네이티브 에이전트 하이브리드 모드 (.gemini/agents/ + MCP spawn) | P2 | Pending |
| FR-40 | 새 기능 감지 패턴 ES/FR/DE/IT 4개 언어 추가 | P2 | Pending |
| FR-41 | 에이전트 모델 설정 외부화 (bkit.config.json에서 관리) | P2 | Pending |
| FR-42 | bkit-system/ 디렉토리 활용 또는 정리 | P2 | Pending |
| FR-43 | .claude/ 디렉토리 Gemini 전용 정리 | P2 | Pending |

### 3.2 비기능 요구사항

| 카테고리 | 기준 | 측정 방법 |
|---------|------|----------|
| 호환성 | Gemini CLI v0.29.0~v0.33.x 전체 지원 | 버전별 기능 플래그 테스트 |
| 성능 | SessionStart hook < 3초, RuntimeHook < 100ms | 타이밍 로그 |
| 안정성 | CTO Team 세션 2시간+ 안정 동작 | 장시간 세션 테스트 |
| 보안 | 기존 4-Tier 정책 유지, TOML 인젝션 방지 | 보안 테스트 |
| 테스트 | 기존 24개 TC + 신규 기능 TC 추가 | 테스트 스위트 실행 |

---

## 4. 성공 기준

### 4.1 Definition of Done

- [ ] Sprint 1: 모든 P0 항목 구현 및 v0.33.x 호환성 테스트 통과
- [ ] Sprint 2: PM Agent Team 5개 + plan-plus + simplify + CTO Team 동작 확인
- [ ] Sprint 3: Skills 2.0 분류, 새 스킬 3개, 구조 정리 완료
- [ ] 기존 24개 TC 모두 통과 (회귀 없음)
- [ ] 신규 기능별 TC 추가 및 통과
- [ ] Gap 분석 Match Rate ≥ 90%
- [ ] 코드 리뷰 완료

### 4.2 품질 기준

- [ ] 기존 테스트 전체 통과 (회귀 방지)
- [ ] 새 기능 테스트 커버리지 80% 이상
- [ ] 린트 에러 0개
- [ ] PDCA 문서 완전성 (Plan + Design + Analysis + Report)

---

## 5. 리스크 및 완화

| 리스크 | 영향 | 가능성 | 완화 방안 |
|--------|:----:|:------:|----------|
| Gemini CLI v0.33.x 프리뷰 변경 | 높음 | 중간 | 기능 플래그로 조건부 활성화, 안정 버전 우선 |
| bkit-CC lib/team/ 이식 복잡도 | 높음 | 높음 | 단계적 이식 (coordinator → strategy → cto-logic 순서) |
| MCP v2 스펙 미확정 | 중간 | 높음 | v1 호환 유지하면서 v2 준비, 2026-03 말 스펙 확정 후 대응 |
| CTO Team 장시간 세션 메모리 누수 | 중간 | 중간 | bkit-CC v1.5.7의 13개 메모리 누수 수정 패턴 적용 |
| 에이전트 모델 변경 (gemini-3.x) | 낮음 | 중간 | 모델 설정 외부화로 빠른 대응 가능하게 구조화 |
| Context window 초과 (팀 오케스트레이션) | 높음 | 중간 | PreCompress hook 최적화, 스냅샷 보존 우선순위 설정 |

---

## 6. 아키텍처 고려사항

### 6.1 프로젝트 레벨

| Level | 특성 | 선택 |
|-------|------|:----:|
| **Starter** | 단순 구조 | ☐ |
| **Dynamic** | 기능 기반 모듈 | ☐ |
| **Enterprise** | 엄격한 계층 분리, DI | ☒ |

### 6.2 핵심 아키텍처 결정

| 결정 | 옵션 | 선택 | 이유 |
|------|------|------|------|
| lib/team/ 이식 방식 | 직접 이식 / 어댑터 패턴 / 재작성 | 어댑터 패턴 | Gemini CLI 특성에 맞게 변환하면서 CC 핵심 로직 유지 |
| PM Agent 도구 세트 | CC 동일 / Gemini 네이티브 | Gemini 네이티브 | read_file, write_file, grep_search, google_web_search 등 Gemini 도구 활용 |
| CTO Team 통신 | MCP spawn / 네이티브 에이전트 | 하이브리드 | MCP spawn(기존) + 네이티브 에이전트(v0.33+) 병행 |
| Path Registry | lib/core/paths.js 신규 | lib/core/paths.js | bkit-CC 패턴 그대로 이식, .bkit/ 경로 관리 |
| Skills 2.0 분류 | frontmatter 메타데이터 | SKILL.md frontmatter에 `classification` 필드 추가 | 최소 변경으로 분류 체계 도입 |

### 6.3 디렉토리 구조 변경 계획

```
bkit-gemini/  (v1.5.8 변경사항)
├── agents/
│   ├── (기존 16개)
│   ├── pm-lead.md           # NEW: PM 팀 리드
│   ├── pm-discovery.md      # NEW: 기회 발견
│   ├── pm-strategy.md       # NEW: 전략 (JTBD, Lean Canvas)
│   ├── pm-research.md       # NEW: 시장 조사
│   └── pm-prd.md            # NEW: PRD 작성
│
├── skills/
│   ├── (기존 29개)
│   ├── plan-plus/SKILL.md   # NEW: 브레인스토밍 기반 계획
│   ├── simplify/SKILL.md    # NEW: 코드 정리
│   ├── loop/SKILL.md        # NEW: 반복 실행 (P2)
│   ├── batch/SKILL.md       # NEW: 병렬 처리 (P2)
│   └── output-style-setup/SKILL.md  # NEW: 스타일 설치 (P2)
│
├── commands/
│   ├── (기존 18개)
│   ├── plan-plus.toml       # NEW: /plan-plus 커맨드
│   ├── simplify.toml        # NEW: /simplify 커맨드
│   ├── loop.toml            # NEW: /loop 커맨드 (P2)
│   └── batch.toml           # NEW: /batch 커맨드 (P2)
│
├── lib/
│   ├── (기존 모듈)
│   ├── core/paths.js        # NEW: Path Registry
│   └── team/                # NEW: 팀 오케스트레이션
│       ├── index.js
│       ├── coordinator.js
│       ├── strategy.js
│       ├── cto-logic.js
│       ├── communication.js
│       ├── task-queue.js
│       ├── state-recorder.js
│       ├── pattern-selector.js
│       └── memory.js
│
├── evals/                   # NEW: Skill Evals 기초 (P2)
│   └── ...
│
└── .gemini/context/
    ├── (기존 6개)
    ├── executive-summary-rules.md  # NEW
    └── feature-report-rules.md     # NEW (기존 feature-report.md 확장)
```

---

## 7. 컨벤션 전제사항

### 7.1 기존 프로젝트 컨벤션 확인

- [x] `GEMINI.md` 코딩 컨벤션 섹션 있음
- [x] `bkit.config.json`의 conventions 섹션 정의됨
- [x] 에이전트: Gemini frontmatter 형식 (model, tools, temperature 등)
- [x] 스킬: YAML frontmatter + SKILL.md 형식
- [x] 커맨드: TOML 형식 (@{path}, !{command}, {{args}})
- [x] 훅: hooks.json + scripts/*.js 형식
- [x] lib: CommonJS 모듈 (module.exports)

### 7.2 v1.5.8 추가 컨벤션

| 카테고리 | 규칙 | 우선순위 |
|---------|------|:--------:|
| PM 에이전트 | bkit-CC 에이전트와 동일 구조, Gemini frontmatter로 변환 | High |
| 새 스킬 | 기존 SKILL.md frontmatter 형식 유지, classification 필드 추가 | High |
| lib/team/ | bkit-CC lib/team/ 구조 차용, Gemini 어댑터 패턴 적용 | High |
| Path Registry | bkit-CC lib/core/paths.js 패턴 이식, .bkit/ 경로 | Medium |
| Skill 분류 | W(Workflow)/C(Capability)/H(Hybrid) frontmatter 메타데이터 | Medium |

---

## 8. 브레인스토밍 (Plan-Plus 요소)

### 8.1 사용자 의도 탐색

**핵심 질문**: "bkit-gemini 사용자가 v1.5.8에서 가장 필요로 하는 것은 무엇인가?"

1. **Gemini CLI 최신 버전 호환**: v0.33.x로 업그레이드해도 bkit이 정상 동작해야 함
2. **CC 수준의 팀 오케스트레이션**: CTO Team + PM Team으로 대규모 프로젝트 관리
3. **브레인스토밍 기반 계획**: /plan-plus로 더 깊은 사고를 거친 Plan 문서 생성
4. **코드 품질 관리**: /simplify로 PDCA 후 코드 정리

### 8.2 경쟁 분석 (bkit-CC vs bkit-Gemini)

| 기능 영역 | bkit-CC v1.6.1 | bkit-Gemini v1.5.7 | v1.5.8 목표 |
|----------|:--------------:|:------------------:|:-----------:|
| 에이전트 수 | 21개 | 16개 | 21개 ✅ |
| 스킬 수 | 28개 | 29개 | 34개 ✅ |
| 팀 오케스트레이션 | 5패턴 완전 | 기초만 | 5패턴 완전 ✅ |
| PM 워크플로우 | 5에이전트 | 없음 | 5에이전트 ✅ |
| 호환 CLI 버전 | CC 최신 | v0.29~v0.32.1 | v0.29~v0.33.x ✅ |
| 네이티브 통합 | CC 전용 | Gemini 전용 | Gemini 특화 강화 ✅ |

### 8.3 차별화 전략

bkit-gemini v1.5.8의 차별화 포인트:

1. **Gemini 네이티브 하이브리드 에이전트**: MCP spawn + .gemini/agents/ 네이티브 병행
2. **RuntimeHook SDK 성능**: 40-97% 지연 감소 (CC에 없는 고유 강점 유지)
3. **4-Tier TOML 정책**: Gemini CLI Policy Engine 최대 활용 (CC의 단순 permission보다 강력)
4. **도구 레지스트리 + Forward Alias**: 미래 도구명 변경에 선제 대응
5. **excludeTools 레벨 안전 모드**: Starter에서 위험 도구 자동 비활성화

### 8.4 기술적 도전 및 해결 방안

| 도전 | 해결 방안 |
|------|----------|
| lib/team/ 9개 모듈 이식 | CC 코드를 참조하되 Gemini 어댑터로 래핑. MCP spawn 대신 네이티브 에이전트 우선 탐색 |
| PM Agent의 WebSearch 도구 | Gemini CLI의 google_web_search 도구 활용 (CC의 WebSearch 대응) |
| CTO Team 컨텍스트 관리 | PreCompress hook에서 팀 상태 스냅샷 보존, agent-memory로 세션 간 연속성 |
| Skills 2.0 분류 | SKILL.md frontmatter에 `classification: workflow|capability|hybrid` 필드 추가 |
| Version-Gated Features | 기존 version-detector.js의 34개 플래그 체계 확장 (v0.33.x 플래그 추가) |

---

## 9. 구현 로드맵

### Sprint 1: 긴급 대응 (P0) - 예상 작업량: 중

```
Week 1:
├── Day 1-2: 도구 스키마 Breaking Changes 대응
│   ├── FR-01: tool-registry.js read_file 업데이트
│   ├── FR-02: tool-registry.js replace allow_multiple 추가
│   ├── FR-03: tool-registry.js grep_search include_pattern 매핑
│   └── FR-07: .gemini/context/tool-reference.md 업데이트
├── Day 3: 버전 호환성 업데이트
│   ├── FR-04: bkit.config.json testedVersions
│   └── FR-05: version-detector.js 기능 플래그
└── Day 4-5: 에이전트 업데이트 + 테스트
    ├── FR-06: 16개 에이전트 도구 사용 가이드
    └── 기존 TC 회귀 테스트
```

### Sprint 2: 핵심 기능 이식 (P1) - 예상 작업량: 대

```
Week 2-3:
├── Phase A: PM Agent Team (FR-10~15)
│   ├── pm-lead.md (Gemini frontmatter)
│   ├── pm-discovery.md
│   ├── pm-strategy.md
│   ├── pm-research.md
│   ├── pm-prd.md
│   └── pm-discovery 스킬 + pdca pm 커맨드
│
├── Phase B: Plan-Plus + Simplify (FR-16~17)
│   ├── plan-plus 스킬 + 커맨드
│   └── simplify 스킬 + 커맨드
│
├── Phase C: CTO Team (FR-20~22)
│   ├── lib/team/ 9개 모듈 구현
│   ├── 5가지 오케스트레이션 패턴
│   └── bkit.config.json team 활성화
│
└── Phase D: 기반 인프라 (FR-23~27)
    ├── lib/core/paths.js (Path Registry)
    ├── 상태 파일 자동 마이그레이션
    ├── Executive Summary 규칙
    └── Feature Usage Report 규칙
```

### Sprint 3: 기능 강화 (P2) - 예상 작업량: 중

```
Week 4:
├── Phase E: 새 스킬 (FR-30~32)
│   ├── loop, batch, output-style-setup
│   └── 대응 TOML 커맨드
│
├── Phase F: Skills 2.0 (FR-33~36)
│   ├── frontmatter classification 필드
│   ├── Skill Evals 기초
│   ├── Version-Gated Features
│   └── Template Validator
│
└── Phase G: Gemini 특화 + 정리 (FR-37~43)
    ├── gemini-extension.json 확장
    ├── 네이티브 에이전트 하이브리드
    ├── 언어 패턴 추가
    ├── 에이전트 모델 외부화
    └── 디렉토리 정리
```

---

## 10. 다음 단계

1. [ ] Design 문서 작성 (`bkit-gemini-v158-upgrade.design.md`)
2. [ ] 팀 리뷰 및 승인
3. [ ] Sprint 1 즉시 착수 (P0 긴급 대응)
4. [ ] Sprint 2 병렬 착수 (PM Agent Team + CTO Team)

---

## Version History

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|--------|
| 0.1 | 2026-03-11 | 초안 작성 (3개 리서치 + Gap 분석 기반) | CTO Team |

---

*bkit-gemini v1.5.8 고도화 계획서 - Plan-Plus 브레인스토밍 기반*
*Copyright 2024-2026 POPUP STUDIO PTE. LTD.*

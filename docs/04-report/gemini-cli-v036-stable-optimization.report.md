# Gemini CLI v0.36.0 Stable 심층 최적화 보고서

> 작성일: 2026-04-06
> 작성자: gemini-migration 워크플로우 (4-Phase Pipeline)
> bkit 버전: v2.0.2 → v2.0.3 (예정)
> CLI 버전: v0.35.3 → v0.36.0 stable (2026-04-01 릴리스)
> 선행: [v0.36.0 Phase 1 보고서](gemini-cli-v036-migration.report.md) (2026-03-28, Completed)

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| 대상 버전 | v0.35.3 → v0.36.0 stable |
| 조사 완료일 | 2026-04-06 |
| 총 CLI 변경 | 150건 (46 기능, 59 버그수정, 3 성능, 16 문서, 26 기타) |
| Breaking Changes | 6건 (4건 대응완료, 1건 P2, 1건 미사용) |
| 총 영향 파일 | 34개 |
| Critical Issues | **0건** (모든 P0 이미 대응) |
| 기능 개선 기회 | 10건 (5건 채택, 5건 보류) |
| 선택 전략 | Approach B: Enhancement (3.5h) |
| YAGNI 절감 | 67% (10.7h → 3.5h) |
| 예상 작업 기간 | 3.5h (Wave 3개) |

---

## Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | Extension skill `bkit:` 접두사 변경으로 SKILL_HANDLERS 매칭 실패 가능; 에이전트 도구 격리가 approval mode에만 의존 |
| Solution | 범용 prefix stripping + Multi-Registry 네이티브 도구 격리 + 선별 P3 개선 |
| Function UX Effect | 35개 스킬 모두 접두사 형식과 무관하게 정상 처리; READONLY 에이전트가 CLI 레벨에서 진정한 읽기전용 |
| Core Value | CLI 접두사 변경에 대한 내성(resilience) 확보 + 에이전트 보안 심층 방어(defense-in-depth) |

---

## 1. 변경사항 요약 (Phase 1 결과)

### 1.1 Breaking Changes

| # | 항목 | 영향도 | bkit 상태 | 참조 |
|---|------|--------|----------|------|
| 1 | `enableAgents` 기본값 `false` | 🔴→✅ | **대응 완료** (session-start.js `ensureAgentsEnabled()`) | [PR #23546](https://github.com/google-gemini/gemini-cli/pull/23546) |
| 2 | Policy `toolName` 필수화 | 🟠→✅ | **호환 확인** (모든 rule에 toolName 명시) | [PR #23330](https://github.com/google-gemini/gemini-cli/pull/23330) |
| 3 | Extension skills 접두사 `.` → `:` | 🟡→🔧 | **P2 조치 예정** (범용 prefix stripping) | [PR #23566](https://github.com/google-gemini/gemini-cli/pull/23566) |
| 4 | AgentSession 도입 | 🟡→✅ | hooks 기반이므로 영향 없음 | [PR #23159](https://github.com/google-gemini/gemini-cli/pull/23159) |
| 5 | Auth type `oauth2` → `oauth` | 🟢→✅ | bkit 미사용 | [PR #23639](https://github.com/google-gemini/gemini-cli/pull/23639) |
| 6 | `coreToolScheduler` 삭제 | 🟢→✅ | bkit 미사용 | [PR #23502](https://github.com/google-gemini/gemini-cli/pull/23502) |

### 1.2 주요 새 기능 (bkit 활용 가능)

| # | 기능 | 채택 | 활용 방안 |
|---|------|------|----------|
| 1 | BeforeTool `ask` decision | ✅ 완료 | before-tool.js 조건부 사용자 확인 |
| 2 | Multi-Registry + Tool Isolation | 🔧 P2 | spawn-agent-server.js 에이전트 도구 격리 |
| 3 | `allowRedirection` | 🔧 P3 | policy.js 셸 리디렉션 세밀 제어 |
| 4 | Task `blocked` status | 🔧 P3 | tracker.js PDCA 의존성 표현 |
| 5 | Sandbox Governance | 🔧 P3 | bkend-security SKILL.md 안내 추가 |
| 6 | Git Worktree | ⏸️ 보류 | v2.1.0 백로그 (8h) |
| 7 | memoryManager Agent | ⏸️ 보류 | CLI 안정화 후 검토 |
| 8 | ModelChain | ⏸️ 보류 | 현재 정적 체인 충분 |
| 9 | Plan Mode Non-Interactive | ⏸️ 보류 | CI/CD 수요 발생 시 |
| 10 | Behavioral Evaluations | ⏸️ 보류 | 라우팅 고도화 시 |

---

## 2. 영향 분석 결과 (Phase 2 결과)

### 2.1 영향 매트릭스

| 영향도 | 건수 | 상태 |
|--------|------|------|
| 🔴 Critical | 0건 | P0 모두 대응 완료 |
| 🟠 High | 4건 | 호환 확인됨 |
| 🟡 Medium | 8건 | P2 2건 조치, P3 3건 채택 |
| 🟢 Low | 5건 | 정보성 |

### 2.2 핵심 발견사항

1. **Extension Skill Prefix**: `after-agent.js` SKILL_HANDLERS가 bare name 매핑 → `bkit:` prefix 매칭 실패 가능
2. **Feature Flags**: 7개 중 2개만 활용, `hasMultiRegistry` P2 활용 예정
3. **Sandbox Governance**: bkit에서 governance 파일 수정 코드 **없음**
4. **철학 정합성**: 6개 원칙 모두 유지, "AI as Partner" 향상 가능

### 2.3 주요 파일 영향

| 파일 | 영향 | 조치 |
|------|------|------|
| `hooks/scripts/after-agent.js` | skill prefix 매칭 실패 | P2: normalizer 적용 |
| `hooks/scripts/after-tool.js` | prefix 인라인 처리 | P2: normalizer 통일 |
| `mcp/spawn-agent-server.js` | Multi-Registry 미활용 | P2: --allowed-tools |
| `lib/gemini/policy.js` | allowRedirection 미지원 | P3: 템플릿 추가 |
| `lib/gemini/tracker.js` | blocked 미매핑 | P3: 상태 추가 |

---

## 3. 마이그레이션 전략 (Phase 3 결과)

### 3.1 전략 선택

| 접근법 | 가중점수 | 공수 | 판정 |
|--------|---------|------|------|
| A: 최소 수정 | 6.85 | 3h | 문서 부채 잔존 |
| **B: 기능 고도화** | **7.85** | **3.5h** | **✅ 선택** |
| C: 아키텍처 최적화 | 5.65 | 22.7h | YAGNI 위반 |

### 3.2 YAGNI 결과

- **채택**: 5건 (3.5h)
- **보류**: 4건 (13h → v2.1.0 백로그)
- **절감률**: 67%

---

## 4. 구현 로드맵

### Wave 1: P2 Core (2h)

| # | 작업 | 파일 |
|---|------|------|
| W1-1 | `bkit:` prefix stripping 유틸리티 | `hooks/scripts/utils/skill-normalizer.js` (신규) |
| W1-2 | after-agent.js 적용 | `hooks/scripts/after-agent.js` |
| W1-3 | after-tool.js 적용 | `hooks/scripts/after-tool.js` |
| W1-4 | Multi-Registry 도구 격리 | `mcp/spawn-agent-server.js` |

### Wave 2: P3 Polish (0.5h)

| # | 작업 | 파일 |
|---|------|------|
| W2-1 | allowRedirection 정책 | `lib/gemini/policy.js` |
| W2-2 | blocked 상태 매핑 | `lib/gemini/tracker.js` |
| W2-3 | Sandbox 안내 | `skills/bkend-security/SKILL.md` |

### Wave 3: Tests (1h)

| # | 작업 | 파일 |
|---|------|------|
| W3-1 | Prefix stripping 테스트 (6 TC) | `tests/suites/tc112-v036-skill-prefix.js` (신규) |
| W3-2 | Tool isolation 테스�� (+2 TC) | `tests/suites/tc111-v036-enableagents.js` |
| W3-3 | 회귀 테스트 (120+ TC) | 전체 |

### 의존성

```
W1-1 ──→ W1-2, W1-3
W1-4 ──→ (독립)
W2-* ──→ (모두 독립)
W3-1 ──→ W1 의존
W3-3 ──→ 전체 의존
```

---

## 5. 위험 관리

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 다른 prefix 형식 | Low | Medium | regex 기반, CLI 모니터링 |
| --allowed-tools 형식 차이 | Low | Medium | hasMultiRegistry 게이팅, fallback |
| allowRedirection 보안 | Low | Low | allow 규칙에만 적용 |
| blocked 상태 미인식 | Low | Low | custom status 처리 |

**롤백**: Wave별 독립 커밋 → `git revert` 가능
**하위호환**: 모든 변경이 추가적(additive) 또는 양방향 호환

---

## 6. v2.1.0 백로그 (보류 항목)

| # | 항목 | 예상 공수 | 선행 조건 |
|---|------|----------|----------|
| 1 | Git Worktree 병렬 PDCA | 8h | POC 검증 |
| 2 | memoryManager 통합 | 2h | CLI 안정화 |
| 3 | ModelChain 외부화 | 2h | 설정 구조 설계 |
| 4 | Plan Mode CI/CD | 3h | CI/CD 수요 |
| 5 | Behavioral Evaluations | 4h | 라우팅 데이터 |

---

## 7. Phase 산출물

| Phase | 문서 | 경로 |
|-------|------|------|
| P1: 심층 조사 | 변경사항 조사 보고서 | `docs/01-plan/research/gemini-cli-v036-stable-research.md` |
| P2: 영향 분석 | bkit 영향 분석 보고서 | `docs/03-analysis/gemini-cli-v036-impact.analysis.md` |
| P3: 전략 계획 | 마이그레이션 계획서 | `docs/01-plan/features/gemini-cli-v036-migration.plan.md` |
| P4: 종합 보고서 | 이 문서 | `docs/04-report/gemini-cli-v036-stable-optimization.report.md` |

---

## 8. 조사 신뢰도

| 영역 | 신뢰도 | 방법론 |
|------|--------|--------|
| Breaking Changes | HIGH (5/5) | PR 직접 확인 + 코드 전수 스캔 |
| 영향 분석 | HIGH (4/5) | 233개 파일 전수 스캔 + PR 대조 |
| 전략 수립 | HIGH (4/5) | 3개 접근법 가중 평가 + YAGNI |
| 공수 추정 | MEDIUM (3/5) | 과거 마이그레이션 데이터 기반 |

---

> **HARD-GATE**: 이 보고서 승인 후 Wave 1부터 구현을 시작합니다.
> 코드 수정은 보고서 승인 전에 착수하지 않습니다.

# Gemini CLI v0.34.0 미활용 기능 bkit 영향 분석

> 분석일: 2026-03-19
> 분석자: bkit-impact-analyzer agent
> bkit 현재 버전: v1.5.9 (Gemini CLI v0.34.0 완벽 지원)
> 목표: v0.34.0 미활용 기능 고도화 기회 식별

---

## Executive Summary

- 총 스캔 파일: 90+개
- 분석 대상 기능: 10개
- P1 즉시 권장: **3건** (Tracker CRUD, subagent 정책, modes 정책)
- P2 권장: **4건** (modelRouting, Skills native, contextFileNameArray, MCP Prompt)
- P3 선택: **3건** (충돌 해결, Registry, Hook 마이그레이션)

---

## 1. P1 즉시 권장 (3건)

### 1.1 Tracker CRUD 직접 활용

| 항목 | 내용 |
|------|------|
| Feature Flag | `hasTaskTracker` (v0.32.0+) |
| 현재 상태 | `tracker-bridge.js`가 텍스트 힌트만 반환, 실제 API 호출 없음 |
| 문제 | **Automation First 원칙 위반** — 가장 심각한 갭 |
| 수정 방안 | tracker-bridge.js를 실제 Gemini tracker 도구 호출 래퍼로 전환 |
| 예상 효과 | PDCA 6단계 태스크 자동 생성/추적, 수동 작업 제거 |
| 영향 파일 | tracker-bridge.js, lib/task/tracker.js, pdca-*-post.js 등 ~8개 |
| 영향도 | 🟠 High |
| 예상 공수 | 2-3일 |

### 1.2 subagent TOML 정책

| 항목 | 내용 |
|------|------|
| Feature Flag | `hasSubagentPolicies` (v0.34.0) |
| 현재 상태 | Feature Flag만 존재, 21개 에이전트 모두 동일 권한 |
| 문제 | 최소 권한 원칙(Least Privilege) 미적용 |
| 수정 방안 | 에이전트 역할별 차별화된 TOML 규칙 생성 |
| 예상 효과 | security-architect deny write_file, gap-detector deny replace 등 |
| 영향 파일 | 3개 TOML 정책, policy-migrator.js, bkit.config.json ~6개 |
| 영향도 | 🟠 High |
| 예상 공수 | 2-3일 |

**에이전트별 정책 예시:**

| 에이전트 | 역할 | deny 대상 |
|----------|------|-----------|
| security-architect | 읽기 전용 분석 | write_file, replace, run_shell_command |
| gap-detector | 읽기 전용 검증 | write_file, replace, run_shell_command |
| code-analyzer | 읽기 전용 분석 | write_file, replace |
| design-validator | 읽기 전용 검증 | write_file, replace, run_shell_command |
| report-generator | 문서만 작성 | run_shell_command |

### 1.3 modes 정책 필드

| 항목 | 내용 |
|------|------|
| Feature Flag | `hasSubagentPolicies` (v0.34.0, modes 포함) |
| 현재 상태 | TOML 정책에 modes 필드 미사용 |
| 문제 | Plan Mode에서도 코드 작성 가능 — PDCA Plan 단계 "코드 금지" 미강제 |
| 수정 방안 | `modes = ["plan_mode"]`로 Plan 단계에서 write_file/replace deny |
| 예상 효과 | PDCA 방법론의 시스템 레벨 강제 |
| 영향 파일 | 3개 TOML 정책, policy-migrator.js ~4개 |
| 영향도 | 🟡 Medium |
| 예상 공수 | 1일 |

---

## 2. P2 권장 (4건)

### 2.1 plan.modelRouting

| 항목 | 내용 |
|------|------|
| Feature Flag | Plan Mode 기본 활성화 (v0.34.0) |
| 현재 상태 | 모든 PDCA 단계에서 동일 모델 사용 |
| 수정 방안 | Plan/Check 단계에서 Flash, Do 단계에서 Pro 자동 전환 |
| 예상 효과 | API 비용 30-50% 절감 |
| 영향도 | 🟡 Medium |
| 예상 공수 | 1-2일 |

### 2.2 Skills native activation

| 항목 | 내용 |
|------|------|
| Feature Flag | `hasNativeSkillSystem` (v0.34.0) |
| 현재 상태 | bkit.config.json에 `nativeActivation: false` |
| 수정 방안 | v1.6.0 로드맵으로 네이티브 스킬 시스템 전환 준비 |
| 예상 효과 | 스킬 로딩 속도 향상, CLI 네이티브 통합 |
| 영향도 | 🟡 Medium |
| 예상 공수 | 5-7일 (대규모) |

### 2.3 contextFileNameArray

| 항목 | 내용 |
|------|------|
| Feature Flag | `hasContextFileNameArray` (v0.34.0) |
| 현재 상태 | GEMINI.md 단일 파일 + @import 7개 모듈 |
| 수정 방안 | 다중 컨텍스트 파일로 분리 (레벨별, 역할별) |
| 예상 효과 | v0.35.0 JIT Context Loading 대비, 초기 로딩 최적화 |
| 영향도 | 🟢 Low |
| 예상 공수 | 1-2일 |

### 2.4 MCP Prompt Loader

| 항목 | 내용 |
|------|------|
| Feature Flag | `hasMcpPromptLoader` (v0.34.0) |
| 현재 상태 | 미활용 |
| 수정 방안 | MCP 프롬프트를 슬래시 커맨드로 자동 변환 |
| 예상 효과 | bkend MCP 서버의 프롬프트를 직접 커맨드로 노출 |
| 영향도 | 🟢 Low |
| 예상 공수 | 2-3일 |

---

## 3. P3 선택 (3건)

| 기능 | 이유 | 예상 공수 |
|------|------|-----------|
| Slash command conflict resolution | 현재 충돌 보고 없음, 방어적 대응 | 0.5일 |
| Extension Registry Client | bkit 배포 전략 결정 후 | 3-5일 |
| Hook migration tool | 이미 dual-mode 구현, v0.35.0 대비 | 1일 |

---

## 4. 철학 정합성 검증

| 원칙 | 현재 | P1 적용 후 |
|------|------|-----------|
| **Automation First** | ⚠️ tracker 힌트만 | ✅ 직접 CRUD |
| **No Guessing** | ✅ 유지 | ✅ 강화 (subagent 정책) |
| **Docs = Code** | ✅ 유지 | ✅ 유지 |
| **AI as Partner** | ✅ 유지 | ✅ 유지 |
| **PDCA Cycle** | ✅ 유지 | ✅ 강화 (modes 단계 제한) |
| **Context Engineering** | ✅ 유지 | ✅ 강화 가능 (contextFileNameArray) |

---

## 5. 고도화 로드맵 제안

### Phase A: P1 즉시 (1주)
1. Tracker CRUD 직접 활용 (2-3일)
2. subagent TOML 정책 (2-3일)
3. modes 정책 필드 (1일)

### Phase B: P2 권장 (2주)
4. plan.modelRouting (1-2일)
5. contextFileNameArray (1-2일)
6. MCP Prompt Loader (2-3일)
7. Skills native activation (5-7일, 별도 브랜치)

### Phase C: P3 선택 (필요 시)
8. Slash command conflict resolution
9. Extension Registry Client
10. Hook migration tool

---

## 6. 기능 개선 기회 매트릭스

| 새 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 |
|---------|---------------|-----------|----------|
| Tracker CRUD | PDCA 태스크 자동 관리 | 자동화 수준 대폭 향상 | P1 |
| subagent 정책 | 에이전트 최소 권한 | 보안 강화 | P1 |
| modes 정책 | PDCA 단계별 권한 제한 | 방법론 시스템 강제 | P1 |
| modelRouting | PDCA 단계별 모델 전환 | 비용 30-50% 절감 | P2 |
| Skills native | CLI 네이티브 스킬 통합 | 로딩 속도, UX 향상 | P2 |
| contextFileNameArray | 레벨별 컨텍스트 분리 | JIT 대비, 로딩 최적화 | P2 |
| MCP Prompt Loader | bkend 프롬프트 커맨드화 | DX 향상 | P2 |

# Gemini CLI v0.34.0 미활용 기능 고도화 계획서

> 작성일: 2026-03-19
> Feature: gemini-cli-034-enhancement
> 접근법: B (P1+P2 일괄)
> 예상 기간: 2주

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Gemini CLI v0.34.0 미활용 기능 고도화 |
| 시작일 | 2026-03-19 |
| 예상 완료 | 2026-04-02 |
| 총 작업 항목 | 7건 (P1: 3건, P2: 4건) |
| 영향 파일 | ~30개 |
| 목표 bkit 버전 | v1.6.0 |

## Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | v0.34.0 기능의 30%만 활용, Automation First 원칙 위반 (Tracker 힌트만) |
| Solution | P1 3건(핵심) + P2 4건(비용/성능) 일괄 고도화 |
| Function UX Effect | PDCA 태스크 자동 추적, 에이전트 보안 강화, 비용 30-50% 절감 |
| Core Value | bkit 자동화 수준 향상 + 보안 강화 + 비용 최적화 |

---

## 1. 구현 범위

### Phase A: P1 즉시 (Week 1)

#### A-1. Tracker CRUD 직접 활용 (2-3일)
**목표**: tracker-bridge.js를 텍스트 힌트 → 실제 API 호출로 전환

**수정 파일:**
- `lib/adapters/gemini/tracker-bridge.js` — 핵심 수정
- `lib/task/tracker.js` — PDCA 태스크 템플릿
- `hooks/scripts/pdca-plan-post.js` — Plan 완료 시 태스크 생성
- `hooks/scripts/pdca-design-post.js` — Design 완료 시 태스크 업데이트
- `hooks/scripts/pdca-analyze-post.js` — Analyze 완료 시 태스크 업데이트
- `hooks/scripts/pdca-iterate-post.js` — Iterate 완료 시 태스크 업데이트
- `hooks/scripts/pdca-report-post.js` — Report 완료 시 태스크 완료
- `bkit.config.json` — taskTracker.directCrud: true

**구현 상세:**
```
1. tracker-bridge.js에 createTask(), updateTask(), completeTask() 래퍼 추가
2. PDCA Hook 스크립트에서 래퍼 호출
3. 태스크 생명주기: Plan→pending, Do→in_progress, Check→review, Report→completed
```

#### A-2. subagent TOML 정책 (2-3일)
**목표**: 21개 에이전트에 최소 권한 원칙 적용

**수정 파일:**
- `policies/bkit-extension-policy.toml` — subagent 규칙 추가
- `.gemini/policies/bkit-starter-policy.toml` — Starter 레벨 규칙
- `lib/adapters/gemini/policy-migrator.js` — subagent 규칙 생성 로직
- `bkit.config.json` — compatibility.subagentPolicies.enabled: true

**에이전트 권한 매트릭스:**

| 그룹 | 에이전트 | deny 대상 |
|------|----------|-----------|
| 읽기 전용 | security-architect, gap-detector, code-analyzer, design-validator | write_file, replace, run_shell_command |
| 문서 전용 | report-generator, product-manager | run_shell_command |
| 분석 전용 | qa-monitor, qa-strategist | write_file, replace |
| 전체 권한 | cto-lead, pdca-iterator, enterprise-expert | (제한 없음) |

#### A-3. modes 정책 필드 (1일)
**목표**: PDCA Plan 단계에서 코드 작성 시스템 레벨 차단

**수정 파일:**
- `policies/bkit-extension-policy.toml` — modes 규칙 추가
- `.gemini/policies/bkit-starter-policy.toml` — Starter 레벨 modes 규칙

**구현:**
```toml
# Plan Mode에서 코드 작성 차단
[[rules]]
description = "PDCA Plan 단계: 코드 작성 금지"
action = "deny"
tool = ["write_file", "replace", "run_shell_command"]
modes = ["plan_mode"]
priority = 80
```

---

### Phase B: P2 권장 (Week 2)

#### B-1. plan.modelRouting (1-2일)
**목표**: PDCA 단계별 자동 모델 전환으로 비용 절감

**수정 파일:**
- `lib/adapters/gemini/version-detector.js` — modelRouting feature gate
- `hooks/scripts/before-model.js` — 모델 라우팅 로직
- `bkit.config.json` — modelRouting 설정

**라우팅 규칙:**
| PDCA 단계 | 모델 | 이유 |
|-----------|------|------|
| Plan | Flash | 분석/구조화 작업 |
| Design | Pro | 창의적 설계 필요 |
| Do | Pro | 정확한 코드 생성 |
| Check/Analyze | Flash | 비교/검증 작업 |
| Report | Flash | 문서 생성 |

#### B-2. contextFileNameArray (1-2일)
**목표**: 다중 컨텍스트 파일로 분리, JIT 대비

**수정 파일:**
- `gemini-extension.json` — contextFileName을 배열로 전환
- `GEMINI.md` — 핵심 컨텍스트만 유지
- 새 파일: `GEMINI-agents.md`, `GEMINI-skills.md` 등

#### B-3. MCP Prompt Loader (2-3일)
**목표**: bkend MCP 프롬프트를 슬래시 커맨드로 노출

**수정 파일:**
- `lib/adapters/gemini/version-detector.js` — hasMcpPromptLoader gate 활용
- `.gemini/settings.json` — MCP 프롬프트 설정
- 문서 업데이트

#### B-4. plan.modelRouting 고급 (필요시)
- PDCA 단계 자동 감지 + 모델 전환 통합
- before-model.js에서 .pdca-status.json 읽어서 자동 판단

---

## 2. 의존성 그래프

```
A-1 (Tracker CRUD) ──┐
A-2 (subagent 정책) ──┼── B-1 (modelRouting)
A-3 (modes 정책) ─────┘     │
                             ├── B-2 (contextFileNameArray)
                             ├── B-3 (MCP Prompt Loader)
                             └── B-4 (modelRouting 고급)
```

- Phase A 3건은 독립적, 병렬 진행 가능
- Phase B는 Phase A 완료 후 시작

---

## 3. 테스트 전략

| 항목 | 테스트 방법 |
|------|------------|
| Tracker CRUD | PDCA 사이클 1회 전체 실행, 태스크 자동 생성 확인 |
| subagent 정책 | security-architect에서 write_file 시도 → deny 확인 |
| modes 정책 | Plan Mode에서 코드 작성 시도 → deny 확인 |
| modelRouting | PDCA 단계 전환 시 모델 변경 로그 확인 |
| contextFileNameArray | 세션 시작 시 다중 컨텍스트 로드 확인 |

---

## 4. 위험 관리

| 위험 | 확률 | 영향 | 대응 |
|------|------|------|------|
| Tracker API 변경 | 낮음 | 높음 | Feature Flag로 폴백 |
| subagent 정책 과도한 제한 | 중간 | 중간 | 점진적 deny 추가, 로그 모니터링 |
| modes deny가 사용자 작업 차단 | 중간 | 높음 | priority 조정으로 사용자 override 허용 |
| modelRouting 품질 저하 | 낮음 | 중간 | Flash 실패 시 Pro 폴백 |

---

## 5. 성공 기준

| 기준 | 목표값 |
|------|--------|
| Tracker CRUD 자동화율 | PDCA 태스크 100% 자동 생성 |
| subagent 정책 적용 | 읽기 전용 에이전트 5개 deny 적용 |
| modes 정책 | Plan Mode write_file deny 100% |
| modelRouting 비용 절감 | 30% 이상 |
| 기존 테스트 통과율 | 972 TCs 100% 유지 |

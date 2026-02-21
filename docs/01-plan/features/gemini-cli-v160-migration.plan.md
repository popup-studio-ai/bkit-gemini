# Gemini CLI v0.30.0 Migration Planning Document

> **Summary**: bkit-gemini v1.5.4 - Gemini CLI v0.30.0 호환성 확보 및 Context Engineering 고도화
>
> **Project**: bkit-gemini
> **Version**: v1.5.3 -> v1.5.4
> **Author**: CTO Team (AI-assisted)
> **Date**: 2026-02-21
> **Status**: Final
> **Analysis Doc**: [gemini-cli-version-upgrade-impact-analysis.analysis.md](../../03-analysis/gemini-cli-version-upgrade-impact-analysis.analysis.md)

---

## 1. Overview

### 1.1 Purpose

Gemini CLI v0.30.0의 breaking changes에 대응하여 bkit-gemini의 완전한 호환성을 확보하고, v0.29.0~v0.30.0에서 추가된 새로운 기능을 활용하여 Extension 품질을 향상시킨다.

### 1.2 Background

- Gemini CLI v0.29.0 (2026-02-17): Plan Mode, Gemini 3 기본화, Extension Discovery, Sub-agent 오버홀
- Gemini CLI v0.30.0-preview.3 (2026-02-19): **Policy Engine으로 전환** (`--allowed-tools`, `excludeTools` deprecated), SDK Package 도입, 도구 정의 중앙화
- bkit-gemini v1.5.3 (2026-02-19): Tool Registry 도입으로 v0.29.0 호환 완료, 그러나 v0.30.0 대비 미완

### 1.3 Related Documents

- Analysis: [gemini-cli-version-upgrade-impact-analysis.analysis.md](../../03-analysis/gemini-cli-version-upgrade-impact-analysis.analysis.md)
- Previous: [investigate-v1.5.3-changes.plan.md](investigate-v1.5.3-changes.plan.md)
- Gemini CLI Changelog: https://geminicli.com/docs/changelogs/preview/

---

## 2. Scope

### 2.1 In Scope

- [x] FR-01: Policy Engine 마이그레이션 (excludeTools -> TOML Policy)
- [x] FR-02: Tool Alias 방어 레이어 (미래 도구명 변경 대비)
- [x] FR-03: Agent Model 업데이트 (gemini-2.5-* -> gemini-3-*)
- [x] FR-04: Temperature 최적화 (Gemini 3 권장값 반영)
- [x] FR-05: Version Detection 시스템 (Gemini CLI 버전 감지 + 호환성 분기)
- [x] FR-06: Permission Manager -> Policy Engine 호환 레이어
- [x] FR-07: Extension Manifest 업데이트 (v1.5.4, deprecated 필드 정리)
- [x] FR-08: hooks.json 버전 정보 업데이트
- [x] FR-09: bkit.config.json 버전 및 설정 업데이트
- [x] FR-10: README.md 업데이트 (v1.5.4 호환성 정보)
- [x] FR-11: CHANGELOG.md v1.5.4 항목 작성
- [x] FR-12: .gemini/context/*.md 도구 참조 문서 업데이트
- [x] FR-13: MCP spawn-agent-server.js Gemini 3 모델 참조 업데이트
- [x] FR-14: session-start.js 버전 정보 업데이트

### 2.2 Out of Scope

- SDK 통합 (`@google/gemini-cli-core`) - v1.6.0에서 별도 진행
- Conductor Extension 연동 - v1.7.0에서 별도 진행
- Sub-agent Skills 지원 - Gemini CLI upstream 이슈 (#18276) 해결 대기
- Extension Registry 등록 - v1.6.0에서 별도 진행
- A2A (Agent-to-Agent) 프로토콜 - 실험적 기능, 안정화 후 검토

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Policy Engine TOML 파일 생성 및 bkit.config.json permissions 기반 자동 변환 | Critical | Pending |
| FR-02 | Tool Registry에 Forward Alias 매핑 추가 (미래 도구명 호환) | High | Pending |
| FR-03 | 16 agents의 model 필드를 gemini-3-pro/flash로 업데이트 | High | Pending |
| FR-04 | 16 agents의 temperature 값을 Gemini 3 권장 범위로 조정 | Medium | Pending |
| FR-05 | Gemini CLI 버전 감지 모듈 구현 (v0.29.x vs v0.30.x 분기) | High | Pending |
| FR-06 | Permission Manager에 Policy Engine fallback 로직 추가 | High | Pending |
| FR-07 | gemini-extension.json에서 excludeTools 제거, 버전 1.5.4로 업데이트 | Critical | Pending |
| FR-08 | hooks.json description을 v1.5.4로 업데이트 | Low | Pending |
| FR-09 | bkit.config.json version을 1.5.4로 업데이트, 신규 설정 추가 | Medium | Pending |
| FR-10 | README.md에 v1.5.4 호환성 섹션 추가, 버전 배지 업데이트 | Low | Pending |
| FR-11 | CHANGELOG.md에 v1.5.4 변경사항 작성 | Low | Pending |
| FR-12 | .gemini/context/tool-reference.md에 Alias 정보 추가 | Medium | Pending |
| FR-13 | MCP spawn-agent-server.js의 agent model 참조 정리 | Medium | Pending |
| FR-14 | session-start.js 버전 표시를 v1.5.4로 업데이트 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Backward Compatibility | v0.29.0~v0.29.5에서 기존 기능 100% 동작 | 기존 144개 Interactive Test 전수 통과 |
| Forward Compatibility | v0.30.0-preview에서 deprecated 경고 없이 동작 | v0.30.0-preview 설치 후 수동 검증 |
| Zero Regression | 기존 16 agents, 29 skills, 18 commands, 10 hooks 정상 로딩 | 자동화 테스트 실행 |
| Performance | Hook 실행 시간 기존 대비 10% 이내 | 타이밍 측정 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] 모든 14개 FR 항목 구현 완료
- [x] v0.29.0에서 100% 호환성 유지 (regression test)
- [x] v0.30.0-preview에서 deprecated 경고 없음
- [x] 16 agents 전체 로딩 성공
- [x] 29 skills 전체 로딩 성공
- [x] 18 TOML commands 전체 동작
- [x] 10 hooks 전체 정상 실행

### 4.2 Quality Criteria

- [x] Gap Analysis match rate >= 90%
- [x] 모든 파일 변경사항이 CHANGELOG.md에 기록
- [x] README.md 호환성 정보 최신화

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| v0.30.0에서 Policy TOML 형식 변경 | High | Medium | v0.30.0-preview.3 기준 구현 + 형식 감지 로직 |
| Tool naming 추가 변경 (replace -> edit_file) | High | High | Forward Alias 매핑으로 자동 대응 |
| Gemini 3 temperature 변경으로 agent 동작 불안정 | Medium | Medium | 기존 값 유지 옵션 + A/B 비교 |
| hooks.json matcher 패턴 비호환 | Medium | Low | v0.29.0 matcher 형식 유지, v0.30.0 확인 |
| MCP server prefix 요구사항 변경 | High | Medium | prefix 자동 감지 + fallback |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature modules, services | Web apps, SaaS MVPs | ☐ |
| **Enterprise** | Strict layers, microservices | High-traffic systems | ☐ |

> bkit-gemini은 Extension 프로젝트로 레벨 분류 대상이 아님. 자체 구조를 따름.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Policy 파일 위치 | Extension 내부 / 프로젝트 루트 | Extension 내부 | Extension 번들링으로 일관성 유지 |
| Version Detection | 환경변수 / CLI 실행 / package.json | 환경변수 + CLI fallback | 가장 빠르고 안정적 |
| Alias 저장 방식 | tool-registry.js 내장 / 외부 JSON | tool-registry.js 내장 | 기존 Source of Truth 패턴 유지 |
| Model 업데이트 전략 | 일괄 변경 / 조건부 변경 | 일괄 변경 | 코드 일관성, v0.29.0에서도 Gemini 3 기본 |
| Temperature 전략 | Gemini 3 권장값 / 기존 유지 | Gemini 3 권장값 반영 | 공식 권장사항 준수 |

### 6.3 변경 대상 파일 Overview

```
변경 대상: 60+ files
──────────────────────────────────────────
Core Infrastructure (5 files):
  lib/adapters/gemini/tool-registry.js     # FR-02: Alias layer
  lib/adapters/gemini/index.js             # FR-05: Version detection
  lib/adapters/gemini/version-detector.js  # FR-05: NEW - 버전 감지
  lib/adapters/gemini/policy-migrator.js   # FR-01: NEW - Policy 변환
  lib/core/permission.js                   # FR-06: Policy fallback

Agents (16 files):
  agents/*.md                              # FR-03, FR-04: model + temperature

Config (4 files):
  gemini-extension.json                    # FR-07: excludeTools 제거
  bkit.config.json                         # FR-09: version + settings
  hooks/hooks.json                         # FR-08: version update
  .gemini/context/tool-reference.md        # FR-12: Alias 문서

Hooks (2 files):
  hooks/scripts/session-start.js           # FR-14: version display
  hooks/scripts/before-tool.js             # FR-06: Policy integration

MCP (1 file):
  mcp/spawn-agent-server.js               # FR-13: model reference

Docs (3 files):
  README.md                                # FR-10: compatibility
  CHANGELOG.md                             # FR-11: changelog
  docs/.pdca-status.json                   # PDCA tracking
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] GEMINI.md has coding conventions section
- [x] bkit.config.json conventions defined
- [x] Tool naming: snake_case for Gemini CLI tools
- [x] File naming: kebab-case for source files
- [x] Agent naming: kebab-case for agent files
- [x] Module pattern: CommonJS (require/module.exports)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Policy TOML 형식** | 없음 | TOML 작성 규칙 정의 | High |
| **Version string** | "1.5.3" | "1.5.4" 일괄 교체 위치 | High |
| **Model naming** | gemini-2.5-* | gemini-3-* 표기 규칙 | High |
| **Alias naming** | 없음 | FORWARD_ALIASES 키-값 규칙 | Medium |

---

## 8. Next Steps

1. [x] Write design document (`gemini-cli-v160-migration.design.md`)
2. [ ] Team review and approval
3. [ ] Start implementation (Phase: Do)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-21 | Initial draft with 14 FRs | CTO Team |

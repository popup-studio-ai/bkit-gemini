# bkit v1.5.7 Documentation Synchronization Plan

> **Summary**: bkit v1.5.7 릴리즈 완료 후 모든 문서의 버전 숫자 및 변경 내용 동기화
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.7
> **Author**: Claude Opus 4.6
> **Date**: 2026-03-04
> **Status**: Draft
> **Reference**: `docs/01-plan/features/gemini-cli-032-migration.plan.md` (구현 완료된 Plan)

---

## 1. Overview

### 1.1 Purpose

bkit v1.5.7 구현 및 테스트가 완료되었으나, 일부 문서에 v1.5.6 잔존 참조, 누락된 v1.5.7 기능 설명, 불완전한 PDCA 문서가 존재한다. 본 작업은 **모든 문서를 v1.5.7 기준으로 완전 동기화**하여 릴리즈 준비를 완료한다.

### 1.2 Background

- **구현 완료**: gemini-cli-032-migration PDCA 사이클 100% 완료 (Match Rate 100%)
- **테스트 완료**: bkit-v157-comprehensive-test (TC-01 ~ TC-24) 전체 통과
- **문제점**: 문서 간 버전 불일치, 누락된 Report 문서, 미완료 PDCA 상태 정리 필요

### 1.3 Related Documents

- 구현 Plan: `docs/01-plan/features/gemini-cli-032-migration.plan.md`
- 구현 Design: `docs/02-design/features/gemini-cli-032-migration.design.md`
- 구현 Report: `docs/04-report/features/gemini-cli-032-migration.report.md`
- 테스트 Plan: `docs/01-plan/features/bkit-v157-comprehensive-test.plan.md`
- 테스트 Design: `docs/02-design/features/bkit-v157-comprehensive-test.design.md`

---

## 2. Scope

### 2.1 In Scope

| ID | Work Item | Priority | Description |
|----|-----------|----------|-------------|
| DS-01 | PDCA 상태 정리 | **P0** | `.pdca-status.json` 정리: 완료된 피처 아카이브, 활성 피처 상태 업데이트 |
| DS-02 | 테스트 Report 생성 | **P0** | `docs/04-report/features/bkit-v157-comprehensive-test.report.md` 생성 (누락) |
| DS-03 | CHANGELOG.md 링크 추가 | P1 | `[1.5.7]` compare 링크 추가 (현재 누락) |
| DS-04 | README.md 세부 검증 | P1 | v1.5.7 Highlights, 컴포넌트 맵, 기능 수치 최종 검증 |
| DS-05 | GEMINI.md 검증 | P1 | v1.5.7 참조, @import 모듈 정합성 검증 |
| DS-06 | bkit.config.json 검증 | P1 | testedVersions, compatibility 섹션 최종 확인 |
| DS-07 | gemini-extension.json 검증 | P1 | version, excludeTools 제거 확인 |
| DS-08 | Hook Scripts 버전 주석 | P2 | 모든 hook script의 `@version` 주석 v1.5.7 확인 |
| DS-09 | Lib Modules 버전 주석 | P2 | 모든 lib module의 `@version` 주석 v1.5.7 확인 |
| DS-10 | tool-reference.md 검증 | P1 | 23개 도구 완전성, Breaking Changes 정확성 확인 |
| DS-11 | Agent frontmatter 검증 | P2 | 4개 에이전트 tracker 도구 추가 확인 |
| DS-12 | Skill frontmatter 검증 | P2 | 3개 스킬 tracker 도구 추가 확인 |
| DS-13 | 기존 PDCA 문서 아카이브 | P1 | 완료된 gemini-cli-032-migration 아카이브 처리 |
| DS-14 | doc-sync 자체 PDCA Report | P1 | 본 작업의 완료 보고서 생성 |

### 2.2 Out of Scope

- 코드 변경 (v1.5.7 구현은 이미 완료)
- 새로운 기능 추가
- 테스트 코드 수정
- v1.5.8 또는 v1.6.0 관련 사항

---

## 3. Current State Analysis

### 3.1 Version Number Audit

| File | Current Version | Expected | Status |
|------|----------------|----------|--------|
| `bkit.config.json` | 1.5.7 | 1.5.7 | OK |
| `gemini-extension.json` | 1.5.7 | 1.5.7 | OK |
| `CHANGELOG.md` | [1.5.7] - 2026-03-04 | OK | **링크 누락** |
| `README.md` | Version-1.5.7-green | 1.5.7 | OK |
| `GEMINI.md` | v1.5.7 | v1.5.7 | OK |
| `hooks/runtime-hooks.js` | @version 1.5.7 | 1.5.7 | OK |
| `lib/adapters/gemini/version-detector.js` | @version 1.5.7 | 1.5.7 | OK |
| `lib/adapters/gemini/hook-adapter.js` | @version 1.5.7 | 1.5.7 | OK |
| `lib/adapters/gemini/tracker-bridge.js` | @version 1.5.7 | 1.5.7 | OK |
| `lib/adapters/gemini/tool-registry.js` | @version 1.5.7 | 1.5.7 | OK |

### 3.2 PDCA Status Audit

| Feature | Phase | Match Rate | Issue |
|---------|-------|------------|-------|
| bkit-v157-comprehensive-test | design | null | **Report 누락, 상태 미갱신** |
| gemini-cli-032-migration | completed | 100% | 아카이브 필요 |
| bkit-gemini-comprehensive-test | completed | 100% | 이미 완료 |

### 3.3 Feature Matrix (v1.5.7 확정)

| Category | Count | Details |
|----------|-------|---------|
| Built-in Tools | 23 | 17 (v0.29.0+) + 6 tracker (v0.32.0+) |
| Agents | 16 | 4개 tracker 도구 추가 |
| Skills | 29 | 3개 tracker 도구 추가 |
| Hook Events | 10 | 6개 SDK dual-mode 전환 |
| Test Suites | TC-01 ~ TC-24 | 4개 신규 (TC-21~TC-24) |
| Policy Tiers | 4 | Default/Extension/Workspace/Admin |
| Feature Flags | ~37 | +11 for v0.32.0+ |
| Gemini CLI Support | v0.29.0 ~ v0.32.1 | 확장 |
| New Modules | 2 | runtime-hooks.js, tracker-bridge.js |
| New Policy Files | 2 | Extension + Starter 정책 |

---

## 4. Requirements

### 4.1 Documentation Sync Requirements

| ID | Requirement | Verification Method |
|----|-------------|---------------------|
| DSR-01 | 모든 파일의 버전 숫자가 v1.5.7로 통일 | grep 검증 |
| DSR-02 | CHANGELOG.md에 v1.5.7 compare 링크 존재 | 문서 확인 |
| DSR-03 | README.md 수치(23 tools, 37 flags 등)가 실제 코드와 일치 | 코드-문서 비교 |
| DSR-04 | 누락된 PDCA Report 문서 생성 완료 | 파일 존재 확인 |
| DSR-05 | .pdca-status.json이 실제 상태를 정확히 반영 | JSON 검증 |
| DSR-06 | tool-reference.md가 23개 도구 전체를 정확히 기술 | 테이블 행 수 확인 |
| DSR-07 | 완료된 PDCA 피처가 아카이브됨 | docs/archive/ 확인 |

### 4.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| 완전성 | 모든 문서 파일에서 v1.5.6 잔존 참조 0건 |
| 일관성 | 동일 수치(도구 수, 플래그 수 등)가 모든 문서에서 일치 |
| 정확성 | 문서 기술 내용이 실제 코드 구현과 일치 |

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] DS-01 ~ DS-14 모든 작업 항목 완료
- [ ] grep으로 "1.5.6" 잔존 참조 0건 확인 (archive 제외)
- [ ] 모든 PDCA 문서 완전 (Plan + Design + Report)
- [ ] .pdca-status.json이 최신 상태 반영
- [ ] CHANGELOG.md compare 링크 완전

### 5.2 Quality Criteria

- [ ] Gap Analysis Match Rate >= 95% (문서 동기화 특성상 높은 기준)
- [ ] 문서 간 수치 불일치 0건

---

## 6. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| v1.5.6 참조가 코드 주석에도 잔존 | Low | grep으로 전체 탐색, archive/ 제외 |
| PDCA 아카이브 시 파일 누락 | Medium | 아카이브 전 파일 목록 확인 |
| README.md 수치 오류 | Low | 코드에서 실제 값 추출 후 비교 |

---

## 7. Implementation Order

```
Phase 1: Audit (조사)
  ① grep으로 v1.5.6 잔존 참조 전체 탐색
  ② 문서 간 수치 불일치 식별

Phase 2: Fix (수정)
  ③ CHANGELOG.md compare 링크 추가 (DS-03)
  ④ 잔존 v1.5.6 참조 수정
  ⑤ 수치 불일치 수정

Phase 3: Create (생성)
  ⑥ bkit-v157-comprehensive-test Report 생성 (DS-02)
  ⑦ doc-sync Report 생성 (DS-14)

Phase 4: Organize (정리)
  ⑧ .pdca-status.json 업데이트 (DS-01)
  ⑨ 완료된 피처 아카이브 (DS-13)

Phase 5: Verify (검증)
  ⑩ 최종 grep 검증
  ⑪ 문서 간 수치 교차 확인
```

---

## 8. File Change Summary

| Category | Files | Action |
|----------|-------|--------|
| PDCA Status | 1 (.pdca-status.json) | Update |
| Report Docs | 2 (test report + sync report) | Create |
| CHANGELOG | 1 | Edit (링크 추가) |
| Version Refs | ~5 (잔존 참조) | Edit |
| Archive | ~8 (피처 문서 이동) | Move |
| **Total** | ~17 | |

---

## 9. Next Steps

1. [x] Plan 문서 작성
2. [ ] Design 문서 작성 (`/pdca design bkit-v157-doc-sync`)
3. [ ] 구현 (문서 수정/생성)
4. [ ] Gap Analysis (`/pdca analyze bkit-v157-doc-sync`)
5. [ ] Completion Report (`/pdca report bkit-v157-doc-sync`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-04 | Initial - v1.5.7 문서 동기화 계획 | Claude Opus 4.6 |

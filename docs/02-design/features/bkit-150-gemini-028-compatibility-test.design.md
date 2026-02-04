# bkit-150-gemini-028-compatibility-test Design Document

> **Summary**: bkit 1.5.0와 Gemini CLI 0.28.0의 호환성을 검증하기 위한 종합 테스트 설계서
>
> **Project**: bkit-gemini
> **Version**: 1.5.0
> **Author**: bkit PDCA System
> **Date**: 2026-02-04
> **Status**: Draft
> **Planning Doc**: [bkit-150-gemini-028-compatibility-test.plan.md](../01-plan/features/bkit-150-gemini-028-compatibility-test.plan.md)

---

## 1. Overview

### 1.1 Design Goals

* Gemini CLI 0.28.0 환경에서 bkit의 핵심 기능(Hooks, Skills, Agents)이 정상적으로 동작함을 보장
* 업그레이드에 따른 하위 호환성 이슈 및 신규 기능(Skills GA 등) 영향도 파악
* 187개 테스트 시나리오에 대한 실행 방법 및 검증 로직 수립

### 1.2 Design Principles

* **Isolation**: 테스트는 격리된 임시 프로젝트 디렉토리에서 수행
* **Reproducibility**: 동일한 단계로 실행 시 항상 같은 결과가 나오도록 설계
* **Evidence-based**: 각 테스트의 성공 여부는 로그 및 출력 결과를 통해 증명

---

## 2. Test Architecture

### 2.1 Test Execution Flow

```
Setup Environment → Link Extension → Execute Test Scenarios → Collect Evidence → Analyze Results
```

### 2.2 Test Components

| Component | Responsibility |
|-----------|----------------|
| **Test Runner** | AI Agent (Gemini) - 실행 및 결과 수집 |
| **Target** | bkit Extension (v1.5.0) |
| **Environment** | Gemini CLI (v0.28.0) |
| **Test Project** | `tests/bkit-test-project/` 또는 임시 디렉토리 |

---

## 3. Test Strategy by Category

### 3.1 Hook System (HOOK-*)
* **Method**: 실제 명령어를 실행하여 Hook이 트리거되는지 `bkit-debug.log` 또는 출력 메시지로 확인
* **Verification**: `lib/common.js` 내의 로깅 로직이 정상 동작하는지 체크

### 3.2 Skills (SKILL-*)
* **Method**: 각 스킬 명령어(`/pdca`, `/starter`, `/dynamic` 등)를 실행
* **Verification**: 스킬이 정상적으로 로드되고, 예상되는 안내 메시지나 파일 생성 결과 확인

### 3.3 Agents (AGENT-*)
* **Method**: 특정 키워드 입력 또는 `spawn_agent` 호출을 통해 에이전트 구동
* **Verification**: 에이전트가 문맥에 맞는 적절한 응답을 생성하는지 확인

### 3.4 MCP Server (MCP-*)
* **Method**: `mcp/spawn-agent-server.js` 구동 및 도구 호출
* **Verification**: 도구 응답 속도 및 데이터의 정확성 확인

---

## 4. Test Environment Setup

### 4.1 Prerequisites Execution

1. Gemini CLI 0.28.0 설치 확인 (불가피할 경우 0.27.0에서 0.28.0 시뮬레이션)
2. `gemini extensions link .` 명령으로 현재 개발 중인 확장 라이브러리 연결
3. `tests/bkit-test-project/`를 테스트 베드로 사용

### 4.2 Logging Configuration

* `DEBUG=bkit:*` 환경 변수를 설정하여 상세 로그 출력 유도
* 로그 파일 위치: `~/.gemini/bkit-debug.log` (또는 프로젝트 내 지정 위치)

---

## 5. Verification Logic

### 5.1 Match Rate Calculation (Check Phase)
* 성공한 시나리오 수 / 전체 시나리오 수 (187개)
* 90% 이상 시 합격 (Report 생성)
* 90% 미만 시 불합격 (Iterate 실행)

### 5.2 Success Criteria Table

| Priority | Success Threshold | Action on Failure |
|----------|-------------------|-------------------|
| P0 (Critical) | 100% | 즉시 수정 필요 |
| P1 (Core) | 100% | 수정 필요 |
| P2 (Coverage) | 95%+ | 차기 이터레이션에서 보완 |
| P3 (Edge) | 90%+ | 문서화 및 개선 권고 |

---

## 6. Error Handling during Testing

* **Infrastructure Failure**: 환경 설정 오류 시 테스트 중단 및 재설정
* **Extension Error**: bkit 코드 오류 시 스택 트레이스 수집 및 분석
* **CLI Change**: Gemini CLI 명세 변경 발견 시 `docs/guides/`에 기록

---

## 7. Implementation Order (Test Execution)

1. [ ] **Phase 1**: P0 Critical Tests (Hooks, Regression)
2. [ ] **Phase 2**: P1 Core Tests (PDCA, MCP)
3. [ ] **Phase 3**: P2 Coverage Tests (Skills, Agents)
4. [ ] **Phase 4**: P3 Edge Cases (Automation, Integration)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-04 | Initial design for test execution | bkit PDCA System |

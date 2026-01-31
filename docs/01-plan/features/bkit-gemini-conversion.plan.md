# bkit-gemini-conversion Plan Document

> Version: 1.0.0 | Created: 2026-02-01 | Status: Draft

## 1. Executive Summary

### 1.1 Project Overview
bkit-claude-code 플러그인(v1.5.0)을 Gemini CLI용 익스텐션으로 변환하는 프로젝트입니다. bkit은 PDCA 방법론 기반의 AI-native 개발 도구로, 21개 스킬, 11개 에이전트, 39개 스크립트, 132개 라이브러리 함수를 포함합니다.

### 1.2 Strategic Decision: Fork vs. Fresh Start

#### Analysis Summary

| 항목 | Fork (권장) | Fresh Start |
|------|-------------|-------------|
| **개발 속도** | 빠름 (구조 재활용) | 느림 (전체 재구축) |
| **아키텍처 재사용** | 80% 재사용 가능 | 0% |
| **호환성 유지** | bkit 생태계 유지 | 분리된 생태계 |
| **유지보수** | 상위 버전 동기화 가능 | 독립적 진화 |
| **기술 부채** | 일부 Claude 종속성 정리 필요 | 없음 |
| **학습 곡선** | 기존 코드 이해 필요 | 자유로운 설계 |

#### Recommendation: **Strategic Fork**

**이유:**
1. **아키텍처 호환성**: Gemini CLI의 확장 모델이 Claude Code와 유사함
   - 둘 다 SKILL.md 형식 지원
   - 둘 다 hooks 시스템 제공
   - 둘 다 MCP 서버 지원

2. **재사용 가능 자산**:
   - 21개 Skills → 90% 재사용 (frontmatter 수정만 필요)
   - 11개 Agents → 100% 재사용 (개념적으로 동일)
   - 39개 Scripts → 70% 재사용 (hook 이벤트 매핑 필요)
   - 132개 Library 함수 → 85% 재사용 (플랫폼 추상화 필요)
   - 10개 Templates → 100% 재사용

3. **플랫폼 차이 (변환 필요)**:
   - 설정 파일: `plugin.json` → `gemini-extension.json`
   - 컨텍스트 파일: `CLAUDE.md` → `GEMINI.md`
   - Hook 이벤트: 6개 → 11개 (더 세분화됨)
   - 변수: `${CLAUDE_PLUGIN_ROOT}` → `${extensionPath}`

---

## 2. Goals and Objectives

### 2.1 Primary Goals

| ID | Goal | Success Criteria | Priority |
|----|------|------------------|----------|
| G1 | Gemini CLI 익스텐션 구조 구현 | gemini-extension.json 동작 확인 | P0 |
| G2 | PDCA 스킬 완전 이식 | /pdca 8개 액션 모두 동작 | P0 |
| G3 | Hook 시스템 매핑 | 6→11개 이벤트 전환 완료 | P0 |
| G4 | 에이전트 시스템 이식 | 11개 에이전트 동작 확인 | P1 |
| G5 | 라이브러리 추상화 | 플랫폼 독립적 API 레이어 | P1 |
| G6 | GitHub 리포지토리 구성 | CI/CD 및 릴리스 파이프라인 | P2 |

### 2.2 Non-Goals (Out of Scope)

- Gemini CLI 자체 기능 수정
- 새로운 기능 추가 (포팅에만 집중)
- 기존 bkit-claude-code 코드 변경

---

## 3. Scope Definition

### 3.1 In Scope

#### Phase 1: Foundation (Week 1-2)
- [ ] 리포지토리 구조 설계 및 생성
- [ ] gemini-extension.json 매니페스트 작성
- [ ] GEMINI.md 컨텍스트 파일 생성
- [ ] 플랫폼 추상화 레이어 설계

#### Phase 2: Core Systems (Week 3-4)
- [ ] Hook 시스템 이식 (6 Claude → 11 Gemini 이벤트)
- [ ] 라이브러리 모듈 이식 (lib/core, lib/pdca, lib/intent, lib/task)
- [ ] 설정 관리 시스템 구현

#### Phase 3: Skills & Agents (Week 5-6)
- [ ] 21개 Skills 이식 및 테스트
- [ ] 11개 Agents 이식
- [ ] PDCA 워크플로우 통합 테스트

#### Phase 4: Polish & Release (Week 7-8)
- [ ] 문서화 (README, GETTING_STARTED, API Reference)
- [ ] CI/CD 파이프라인 구축
- [ ] Gemini CLI Extensions Gallery 등록 준비

### 3.2 Out of Scope
- Windows 네이티브 지원 (WSL 권장)
- Gemini CLI 이전 버전 지원 (v0.25+ 필수)
- bkit v1.4.x 하위 호환성

---

## 4. Technical Architecture

### 4.1 Directory Structure (Proposed)

```
bkit-gemini/
├── gemini-extension.json          # Extension manifest
├── GEMINI.md                      # Global context
├── bkit.config.json               # Central configuration
│
├── commands/                      # Slash commands (TOML)
│   ├── pdca/
│   │   ├── plan.toml
│   │   ├── design.toml
│   │   └── ...
│   ├── starter.toml
│   ├── dynamic.toml
│   └── enterprise.toml
│
├── skills/                        # Agent Skills
│   ├── pdca/
│   │   └── SKILL.md
│   ├── starter/
│   │   └── SKILL.md
│   └── ...
│
├── hooks/                         # Lifecycle hooks
│   ├── hooks.json
│   ├── session-start.js
│   ├── before-tool.js
│   ├── after-tool.js
│   └── ...
│
├── lib/                           # Core libraries (from bkit-claude-code)
│   ├── core/
│   ├── pdca/
│   ├── intent/
│   ├── task/
│   └── adapters/
│       └── gemini/               # Gemini-specific adapters
│
├── templates/                     # PDCA document templates
│   └── ...
│
├── scripts/                       # Hook execution scripts
│   └── ...
│
└── docs/                          # PDCA documents
    ├── 01-plan/
    ├── 02-design/
    ├── 03-analysis/
    └── 04-report/
```

### 4.2 Hook Event Mapping

| Claude Code Event | Gemini CLI Event | Notes |
|-------------------|------------------|-------|
| SessionStart | SessionStart | 직접 매핑 |
| UserPromptSubmit | BeforeAgent | 에이전트 루프 전 |
| PreToolUse | BeforeTool | 직접 매핑 |
| PostToolUse | AfterTool | 직접 매핑 |
| Stop | SessionEnd | 세션 종료 시 |
| PreCompact | PreCompress | 컨텍스트 압축 전 |
| (없음) | BeforeModel | 새로운 기회 |
| (없음) | AfterModel | 새로운 기회 |
| (없음) | BeforeToolSelection | 도구 필터링 |
| (없음) | AfterAgent | 에이전트 루프 후 |
| (없음) | Notification | 시스템 알림 |

### 4.3 Platform Abstraction Layer

```javascript
// lib/adapters/platform.js
const platform = {
  name: process.env.GEMINI_CLI ? 'gemini' : 'claude',

  // Variable mapping
  vars: {
    pluginRoot: process.env.GEMINI_CLI
      ? '${extensionPath}'
      : '${CLAUDE_PLUGIN_ROOT}',
    workspacePath: process.env.GEMINI_CLI
      ? '${workspacePath}'
      : process.cwd()
  },

  // Tool name mapping
  tools: {
    write: process.env.GEMINI_CLI ? 'write_file' : 'Write',
    edit: process.env.GEMINI_CLI ? 'replace' : 'Edit',
    read: process.env.GEMINI_CLI ? 'read_file' : 'Read',
    bash: process.env.GEMINI_CLI ? 'run_shell_command' : 'Bash'
  }
};
```

---

## 5. Risk Assessment

### 5.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Gemini CLI API 변경 | High | Medium | v0.25+ 고정, 릴리스 노트 모니터링 |
| Hook 이벤트 불일치 | Medium | Low | 상세 매핑 테스트 케이스 작성 |
| MCP 서버 호환성 | Medium | Low | 기존 MCP 재사용 |
| 성능 저하 | Low | Medium | 벤치마킹 및 최적화 |

### 5.2 Project Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| bkit-claude-code 버전 불일치 | Medium | High | Git submodule 또는 주기적 동기화 |
| 문서화 부족 | Low | Medium | 자동 문서 생성 도구 활용 |
| 테스트 커버리지 부족 | Medium | Medium | E2E 테스트 우선 구현 |

---

## 6. Decision Points (Discussion Required)

### 6.1 리포지토리 전략

**Option A: Fork & Diverge (권장)**
- bkit-claude-code를 fork
- 독립적으로 발전
- 장점: 빠른 시작, 전체 히스토리 보존
- 단점: 상위 버전 동기화 수동 필요

**Option B: Git Submodule**
- bkit-claude-code를 서브모듈로 참조
- 공통 코드 공유
- 장점: 자동 동기화 가능
- 단점: 복잡한 의존성 관리

**Option C: Monorepo**
- bkit-claude-code와 bkit-gemini를 하나의 리포에서 관리
- 패키지 분리 (packages/claude, packages/gemini, packages/shared)
- 장점: 코드 공유 극대화
- 단점: 기존 사용자 혼란

### 6.2 버전 관리 전략

- bkit-gemini의 버전을 bkit-claude-code와 동기화할 것인가?
- 예: bkit-claude-code v1.5.0 → bkit-gemini v1.5.0-gemini
- 또는 독립 버전 (v0.1.0부터 시작)?

### 6.3 기능 패리티 범위

- 모든 21개 스킬을 1.0에 포함할 것인가?
- 핵심 스킬만 먼저 (pdca, starter, dynamic, enterprise)?
- 점진적 확장 전략?

---

## 7. Success Criteria

### 7.1 MVP (Minimum Viable Product)

| Criterion | Metric | Target |
|-----------|--------|--------|
| 설치 가능성 | `gemini extensions install` 성공 | 100% |
| PDCA 스킬 | /pdca 8개 액션 동작 | 100% |
| 기본 스킬 | starter, dynamic, enterprise | 동작 확인 |
| Hook 동작 | SessionStart, BeforeTool, AfterTool | 정상 실행 |
| 문서화 | README, GETTING_STARTED | 완료 |

### 7.2 Full Release (v1.0.0)

| Criterion | Metric | Target |
|-----------|--------|--------|
| 스킬 이식률 | 21개 중 동작하는 스킬 수 | 100% (21/21) |
| 에이전트 이식률 | 11개 중 동작하는 에이전트 수 | 100% (11/11) |
| Hook 커버리지 | 11개 이벤트 중 활용 수 | 80% (9/11) |
| 테스트 커버리지 | E2E 테스트 통과율 | 90%+ |
| 문서화 | API Reference 완성도 | 80%+ |

---

## 8. Timeline and Milestones

```
Week 1-2: Foundation
├── [M1] 리포지토리 생성 및 구조 확정
├── [M2] gemini-extension.json 완성
└── [M3] 플랫폼 추상화 레이어 설계

Week 3-4: Core Systems
├── [M4] Hook 시스템 이식 완료
├── [M5] 라이브러리 모듈 이식 완료
└── [M6] 기본 PDCA 워크플로우 동작

Week 5-6: Skills & Agents
├── [M7] 21개 Skills 이식 완료
├── [M8] 11개 Agents 이식 완료
└── [M9] 통합 테스트 완료

Week 7-8: Polish & Release
├── [M10] 문서화 완료
├── [M11] CI/CD 파이프라인 구축
└── [M12] v1.0.0 릴리스
```

---

## 9. Resource Requirements

### 9.1 Development Environment

- Node.js 18+ (Gemini CLI 요구사항)
- Gemini CLI v0.25+
- Git
- macOS/Linux (권장)

### 9.2 External Dependencies

- Google AI API Key (Gemini 모델 접근)
- GitHub Repository (코드 호스팅)
- npm/GitHub Packages (배포 선택사항)

---

## 10. Appendix

### A. bkit-claude-code 핵심 통계

| 항목 | 수량 |
|------|------|
| Skills | 21개 |
| Agents | 11개 |
| Scripts | 39개 |
| Library Functions | 132개 |
| Library LOC | ~5,500줄 |
| Templates | 10개+ |
| Supported Languages | 8개 |

### B. Gemini CLI Extension 구조 참조

```json
{
  "name": "bkit",
  "version": "1.0.0",
  "description": "Vibecoding Kit - PDCA + AI-native development for Gemini CLI",
  "mcpServers": {},
  "contextFileName": "GEMINI.md",
  "excludeTools": []
}
```

### C. 관련 리소스

- Gemini CLI 공식 문서: https://geminicli.com/docs/
- Gemini CLI Extensions: https://geminicli.com/docs/extensions/
- Agent Skills 표준: https://agentskills.io/specification
- bkit-claude-code: /Users/popup-kay/Documents/GitHub/popup/bkit-claude-code

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-01 | Claude | Initial draft |

---

**Next Steps:**
1. Decision Points (Section 6) 논의 및 결정
2. 리포지토리 전략 확정 후 Git 설정
3. /pdca design 으로 상세 설계 진행

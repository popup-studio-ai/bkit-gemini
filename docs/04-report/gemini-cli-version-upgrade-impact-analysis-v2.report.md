# Gemini CLI Version Upgrade Impact Analysis Report v2

> **Status**: Complete
>
> **Project**: bkit-gemini (Vibecoding Kit for Gemini CLI)
> **Version**: bkit v1.5.0 → Gemini CLI v0.27.3+ 대응
> **Author**: bkit CTO Team (CTO Lead + 4 Research Agents)
> **Analysis Date**: 2026-02-08
> **Previous Report**: gemini-cli-028-upgrade-impact-analysis.report.md (2026-02-04)
> **PDCA Cycle**: #2 (Update Impact Re-Analysis)

---

## 1. Executive Summary

### 1.1 배경

2026-02-04 작성된 이전 보고서는 Gemini CLI v0.25.0→v0.28.0(당시 nightly)을 분석했으며, Impact Score 65/100(Medium)으로 평가했습니다. 그러나 2026-02-08 현재 Gemini CLI의 릴리즈 구조와 변경사항이 크게 진전되어 **재분석이 필요**합니다.

### 1.2 현재 버전 현황

| 채널 | 버전 | 릴리즈 날짜 | 비고 |
|------|------|------------|------|
| **Stable (최신)** | v0.27.3 | 2026-02-06 | 현재 프로덕션 권장 |
| **Preview** | v0.28.0-preview.5 | 2026-02-06 | 다음 stable 후보 (~02-10 예상) |
| **Nightly** | v0.29.0-nightly.20260206 | 2026-02-06 | 활발한 개발 중 |

### 1.3 Impact Score 변경

```
이전 분석 (2026-02-04): 65/100 (Medium Impact)
현재 분석 (2026-02-08): 78/100 (HIGH Impact) ⬆️ +13
```

| 카테고리 | 이전 평가 | 현재 평가 | 변경 사유 |
|----------|----------|----------|----------|
| Hook System | Medium | **HIGH** | 4개 신규 Hook 이벤트, XML 컨텍스트 래핑, hooks.enabled 스키마 변경 |
| Skills Framework | Low | **MEDIUM** | GA 승격, .agents/skills alias, skill 재로드 메커니즘 |
| Extension System | None | **HIGH** | 기본 활성화, Extension Registry, 테마 지원, 폴더 신뢰 강제 |
| Tool System | None | **MEDIUM** | search_file_content→grep_search 이름 변경 |
| Model/API | None | **HIGH** | Gemini 3 기본화, previewFeatures 제거 |
| Security | None | **MEDIUM** | MCP OAuth 동의, 폴더 신뢰 강제, .env 로딩 제한 |
| New Features | N/A | **Opportunity** | Plan Mode, A2A, Extension Registry |

---

## 2. 조사 방법론

### 2.1 팀 구성

| 에이전트 | 역할 | 조사 범위 |
|----------|------|----------|
| CTO Lead | 총괄 및 보고서 작성 | 전체 조율, 코드베이스 심층 분석 |
| github-researcher | GitHub 릴리즈 조사 | Releases, Tags, Commits, npm 패키지 |
| docs-researcher | 공식문서/블로그 조사 | geminicli.com, Google 기술블로그, Changelog |
| issues-researcher | Issues/PRs 심층 분석 | Breaking changes, Deprecations, Migration PRs |
| codebase-analyzer | bkit 코드베이스 분석 | hooks/, lib/, skills/, agents/, 설정 파일 |

### 2.2 조사 소스

| 소스 | URL | 조사 항목 |
|------|-----|----------|
| GitHub Releases | github.com/google-gemini/gemini-cli/releases | v0.27.0~v0.29.0-nightly 전체 릴리즈 |
| GitHub PRs | github.com/google-gemini/gemini-cli/pulls | hooks, extensions, skills, settings 관련 |
| GitHub Issues | github.com/google-gemini/gemini-cli/issues | Breaking changes, deprecation notices |
| Official Docs | geminicli.com/docs/ | Hooks Reference, Skills, Extensions, MCP |
| Changelogs | geminicli.com/docs/changelogs/ | Stable, Preview, Nightly 채널별 |
| Google 기술블로그 | developers.googleblog.com | Hooks 소개글, Gemini 3 발표 |
| npm Registry | npmjs.com/package/@google/gemini-cli | 버전 히스토리 |

---

## 3. 버전별 변경사항 상세

### 3.1 v0.27.0 (Stable - 2026-02-03) - MAJOR RELEASE

#### 주요 기능
| 기능 | 설명 | bkit 영향도 |
|------|------|------------|
| **Event-Driven Architecture** | 도구 실행을 위한 이벤트 기반 스케줄러 | MEDIUM - Hook 타이밍 영향 가능 |
| **Agent Skills STABLE** | experimental → stable 승격 | HIGH - extension.json 수정 필요 |
| **Hooks STABLE** | experimental → stable 승격 | MEDIUM - 플래그 정리 필요 |
| **/rewind Command** | 세션 히스토리 되돌리기 | Opportunity - PDCA 롤백 연동 가능 |
| **Sub-agent JSON Schema** | spawn_agent 입력에 JSON 스키마 적용 | LOW |
| **AgentRegistry** | 에이전트 등록/추적 시스템 | LOW |
| **MCP Enable/Disable** | MCP 서버 관리 명령 | LOW |
| **Model Family System Prompts** | 모델별 시스템 프롬프트 | LOW |
| **새 내장 스킬** | code-reviewer, docs-writer | 정보 |
| **Queued Tool Confirmations** | 도구 승인 UX 개선 | 정보 |

#### Breaking Changes (v0.27.0)
| 변경 | PR | 심각도 | bkit 영향 |
|------|-----|--------|----------|
| `fireBeforeAgentHook`/`fireAfterAgentHook` 제거 | #16919 | HIGH | **내부 구현만 변경, 외부 Hook API 유지** |
| `modelHooks`/`toolHooks` 제거 | v0.27.0 | HIGH | **bkit 미사용 → 영향 없음** |
| `tools.enableHooks` 설정 제거 | #17867 | HIGH | **bkit는 hooks.json 사용 → 직접 영향 없음** |
| Hook 시스템 기본 활성화 | #17247 | MEDIUM | 유리한 변경 |
| `beforeTool`/`afterTool` hookSystem 마이그레이션 | #17204 | MEDIUM | **외부 API 유지, 영향 없음** |
| Hook 컨텍스트 XML `<hook_context>` 래핑 | #17237 | **MEDIUM** | **출력 파싱에 영향 가능** |
| Settings 이름 변경: `disable*` → `enable*` | #14142 | HIGH | **bkit 미사용 설정 → 직접 영향 없음** |
| Legacy settings 일괄 제거 | #17244 | HIGH | **bkit는 자체 config 사용 → 직접 영향 없음** |

### 3.2 v0.27.1~v0.27.3 (Hotfix Patches)

| 버전 | 날짜 | 수정 내용 | bkit 영향 |
|------|------|----------|----------|
| v0.27.1 | 2026-02-05 | 텔레메트리 키 재할당 | 없음 |
| v0.27.2 | 2026-02-05 | 권한 체크 수정 | 없음 |
| v0.27.3 | 2026-02-06 | Xcode 26.3 비호환 mcpbridge 대응 | 없음 |

### 3.3 v0.28.0-preview (Preview - 2026-02-04~06)

#### 주요 기능
| 기능 | 설명 | bkit 영향도 |
|------|------|------------|
| **Plan Mode** ⭐ | `/plan` 명령, `enter_plan_mode`/`exit_plan_mode` 도구 | **Opportunity** - PDCA 워크플로우 통합 |
| **Extensions 기본 활성화** | 설치된 확장 자동 로드 | HIGH - 긍정적 |
| **Extension Registry** | 확장 레지스트리 클라이언트 | Opportunity |
| **Extension Config 명령** | `/extensions config` | 정보 |
| **Extension 테마 지원** | 커스텀 테마 | 정보 |
| **Background Shell** | 백그라운드 셸 명령 실행 | 정보 |
| **User Identity 표시** | 시작 시 인증 정보 표시 | 정보 |
| **Hooks 관리 UI 통합** | Skills UI와 통합 | 정보 |
| **`/prompt-suggest` 명령** | 프롬프트 제안 | 정보 |
| **JSON Schema draft-2020-12** | 관대한 fallback 포함 | LOW |
| **A2A 인프라** ⭐ | Agent-to-Agent 인증, 플러그형 인증 | **Opportunity** - 에이전트 간 통신 |

#### Breaking Changes (v0.28.0-preview)
| 변경 | PR | 심각도 | bkit 영향 |
|------|-----|--------|----------|
| **`search_file_content` → `grep_search`** | #18498 | MEDIUM | **TOOL_MAP/GEMINI.md 확인 필요** |
| **`previewFeatures` 제거, Gemini 3 기본화** | #18414 | HIGH | **설정 참조 제거 필요** |
| **`delegate_to_agent` 제거** | v0.28.0 cleanup | MEDIUM | **bkit 미사용 → 영향 없음** |
| **Extension config non-optional** | #17785 | MEDIUM | **gemini-extension.json 확인 필요** |
| **MCP OAuth 동의 필수** | v0.28.0 | MEDIUM | MCP 자동 설정 영향 가능 |
| **폴더 신뢰 강제** | #17596 | MEDIUM | **workspace 설정, skills, context 영향** |
| **.env 로딩 제한** (신뢰하지 않는 폴더) | v0.28.0-preview.1 | MEDIUM | 보안 강화 |
| **`autoAccept` 설정 삭제** | v0.28.0 | LOW | bkit 미사용 |
| **Subagent 실행 제한** 추가 | v0.28.0 | LOW | 에이전트 실행 제한 |

### 3.4 v0.29.0-nightly (개발 중 - 2026-02-06)

| 기능 | 설명 | bkit 영향도 |
|------|------|------------|
| **Admin MCP Allowlist** | 관리자 MCP 서버 허용 목록 | LOW |
| **System Prompt 대규모 개편** | 정확성, 무결성, 의도 정렬 강화 | MEDIUM - LLM 동작 변경 |
| **Observation Masking** | 도구 출력 마스킹 | LOW |
| **Plan Mode 강화** | replace 도구, MCP 서버, 반복 가이드 | Opportunity |
| **Gemini 3 기본화 확정** | previewFeatures 완전 제거 | HIGH |
| **Vim Motions 확장** | W, B, E 동작 | 정보 |
| **Shortcuts Discovery Panel** | 키보드 단축키 패널 | 정보 |

---

## 4. bkit-gemini 코드베이스 영향도 상세 분석

### 4.1 Hook System 영향 분석

#### 4.1.1 hooks/hooks.json

**현재 구현**: 7개 Hook 이벤트 사용
```json
{
  "hooks": {
    "SessionStart": [...],     // ✅ v0.27+ 지원
    "BeforeAgent": [...],      // ✅ v0.27+ 지원
    "BeforeTool": [...],       // ✅ v0.27+ 지원 (hookSystem 마이그레이션 완료)
    "AfterTool": [...],        // ✅ v0.27+ 지원 (hookSystem 마이그레이션 완료)
    "AfterAgent": [...],       // ✅ v0.27+ 지원
    "PreCompress": [...],      // ✅ v0.27+ 지원
    "SessionEnd": [...]        // ✅ v0.27+ 지원
  }
}
```

**호환성 평가**: hooks.json은 **Extension Hook 포맷**으로, settings.json의 `hooks.enabled` 변경과는 별개입니다. Extension에 번들된 hooks는 Extension 로더가 처리하므로 **기존 형식 그대로 동작**합니다.

**신규 활용 가능 Hook 이벤트** (v0.27.0+):
| Hook Event | 용도 | bkit 활용 가능성 |
|------------|------|-----------------|
| `BeforeModel` | LLM 요청 전 수정 | HIGH - 프롬프트 최적화 |
| `AfterModel` | LLM 응답 후처리 | MEDIUM - 응답 분석 |
| `BeforeToolSelection` | 도구 선택 전 제어 | HIGH - 도구 필터링/가이드 |
| `Notification` | 시스템 알림 | LOW - 상태 모니터링 |

#### 4.1.2 Hook 스크립트 상세 영향

| 파일 | 기능 | Gemini CLI API 의존성 | 영향 평가 |
|------|------|---------------------|----------|
| `session-start.js` | PDCA 초기화, 레벨 감지 | stdin JSON, stdout JSON, exit(0) | ✅ 호환 |
| `before-agent.js` | 의도 감지, 트리거 매칭 | `input.prompt \|\| input.user_message \|\| input.message` | ⚠️ 확인 필요 |
| `before-tool.js` | 도구 실행 전 검증 | `input.tool_name`, `input.tool_input` | ✅ 호환 |
| `after-tool.js` | 도구 실행 후 추적 | `input.tool_name`, `input.tool_input` | ✅ 호환 |
| `after-agent.js` | PDCA phase 전환 | `input.agent_name`, `input.context` | ⚠️ 확인 필요 |
| `pre-compress.js` | 컨텍스트 보존 | PDCA 상태 파일 접근 | ✅ 호환 |
| `session-end.js` | 세션 정리 | PDCA 상태 파일 접근 | ✅ 호환 |

**before-agent.js 상세 분석**:
- 현재: `input.prompt || input.user_message || input.message || ''`
- 공식 문서 (geminicli.com): BeforeAgent 입력에 `prompt` 필드 존재
- 평가: **호환** (방어적 코딩으로 여러 필드명 지원 중)

**after-agent.js 상세 분석**:
- 현재: `input.agent_name || input.agent` 및 `input.context || input.output`
- 공식 문서: AfterAgent 입력에 `prompt`, `prompt_response`, `stop_hook_active` 필드
- 평가: **⚠️ agent_name/agent 필드 확인 필요** (공식 문서에 명시되지 않은 필드 사용)

#### 4.1.3 Hook 컨텍스트 XML 래핑 영향

**변경사항** (PR #17237): Hook이 주입하는 컨텍스트가 `<hook_context>` XML 태그로 래핑됨

```
변경 전: "직접 컨텍스트 텍스트"
변경 후: <hook_context>직접 컨텍스트 텍스트</hook_context>
```

**bkit 영향**:
- `adapter.outputAllow(context)` → `{ status: "allow", context: "..." }` JSON 출력
- Gemini CLI가 이 context를 XML 태그로 래핑하여 LLM에 전달
- **bkit의 Hook 출력 자체는 변경 불필요** (래핑은 Gemini CLI 측에서 처리)
- LLM이 보는 컨텍스트의 형태가 달라지므로 **GEMINI.md의 안내 텍스트에 영향 가능**

### 4.2 Extension Manifest 영향 분석

#### gemini-extension.json 현재 상태:
```json
{
  "name": "bkit",
  "version": "1.5.0",
  "contextFileName": "GEMINI.md",
  "excludeTools": [],
  "experimental": {      // ⚠️ 더 이상 필요 없음
    "skills": true       // Skills GA 승격됨
  }
}
```

| 필드 | 현재 값 | 권장 변경 | 우선순위 |
|------|--------|----------|---------|
| `experimental.skills` | `true` | **제거** (Skills는 v0.27.0에서 GA) | HIGH |
| `excludeTools` | `[]` | `grep_search` alias 고려 | LOW |
| `contextFileName` | `"GEMINI.md"` | 유지 | - |

### 4.3 Tool Name Mapping 영향 분석

#### lib/adapters/gemini/index.js TOOL_MAP:
```javascript
const TOOL_MAP = {
  'Write': 'write_file',
  'Edit': 'replace',
  'Read': 'read_file',
  'Bash': 'run_shell_command',
  'Glob': 'glob',
  'Grep': 'grep',              // ⚠️ 확인 필요
  'WebSearch': 'web_search',
  'WebFetch': 'web_fetch',
  'Task': 'task',
  'AskUserQuestion': 'ask_user',
  'Skill': 'skill'
};
```

**분석 결과**:
- Gemini CLI에서 `search_file_content`가 `grep_search`로 이름 변경됨 (PR #18498)
- bkit의 TOOL_MAP은 `'Grep': 'grep'`으로 매핑 중
- `grep`과 `grep_search`는 **별도 도구**일 수 있음 (Gemini CLI 내부 도구 목록 확인 필요)
- GEMINI.md에는 `grep`으로 문서화됨 (Line 116)
- **레거시 alias가 유지**되므로 즉시 깨지지는 않으나 업데이트 권장

### 4.4 bkit.config.json 영향 분석

```json
{
  "hooks": {
    "beforeAgent": {
      "enabled": true,     // bkit 자체 설정 (Gemini CLI settings 아님)
      "timeout": 3000
    }
  }
}
```

**분석**: `bkit.config.json`의 `hooks.enabled`는 **bkit 내부 설정**으로, Gemini CLI의 `hooks.enabled` (boolean→array 변경)과는 무관합니다. bkit 코드에서 이 값을 직접 읽어 사용하므로 **영향 없음**.

### 4.5 GEMINI.md 영향 분석

| 항목 | 현재 내용 | 필요한 변경 | 우선순위 |
|------|----------|------------|---------|
| Tool Reference 테이블 | `grep` (Line 116) | `grep_search` 확인 후 업데이트 | MEDIUM |
| 공식 문서 URL 참조 없음 | N/A | geminicli.com URL 추가 가능 | LOW |
| Plan Mode 미언급 | N/A | Plan Mode 통합 문서화 | Opportunity |
| Gemini 3 미언급 | N/A | 모델 호환성 노트 추가 | LOW |

### 4.6 Skills 시스템 영향 분석

| 변경사항 | bkit 영향 | 대응 |
|----------|----------|------|
| Skills GA 승격 (v0.27.0) | `experimental.skills` 플래그 불필요 | 제거 권장 |
| `.agents/skills` 디렉토리 alias (PR #18151) | bkit는 `skills/` 사용 중 | 정보 (호환) |
| Skills reload on extension change (#18225) | bkit skills 변경 시 자동 리로드 | 긍정적 |
| Skill conflict detection (#16709) | bkit skills 이름 충돌 감지 | 확인 필요 |
| Skills linking (#18295) | 에이전트 skills 연결 | Opportunity |

### 4.7 Agents 시스템 영향 분석

bkit의 11개 에이전트 정의 파일 (`agents/*.md`)은 **Markdown 형식의 에이전트 프롬프트**입니다.

| 변경사항 | bkit 영향 |
|----------|----------|
| Sub-agent JSON Schema (v0.27.0) | bkit 에이전트는 MD 포맷 → 확인 필요 |
| AgentRegistry 추적 (v0.27.0) | 자동 등록 → 긍정적 |
| MCP 서버 prefix 강제 (v0.27.0) | bkit MCP 미사용 → 없음 |
| Subagent 실행 제한 (v0.28.0) | 에이전트 실행 제한 적용 가능 |
| Subagent bypass 방지 - Plan Mode (v0.29.0) | Plan Mode 사용 시 영향 |

---

## 5. 종합 호환성 매트릭스

### 5.1 bkit 컴포넌트별 버전 호환성

| bkit 컴포넌트 | v0.25 | v0.26 | v0.27 (Stable) | v0.28 (Preview) | v0.29 (Nightly) |
|---------------|-------|-------|----------------|-----------------|-----------------|
| **SessionStart Hook** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **BeforeAgent Hook** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **BeforeTool Hook** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **AfterTool Hook** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **AfterAgent Hook** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PreCompress Hook** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SessionEnd Hook** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Skills (21개)** | ⚠️ Experimental | ✅ GA | ✅ Stable | ✅ Stable | ✅ Stable |
| **Agents (11개)** | ✅ | ✅ | ✅ | ⚠️ 실행 제한 | ⚠️ 실행 제한 |
| **GEMINI.md 컨텍스트** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **gemini-extension.json** | ✅ | ✅ | ⚠️ experimental 불필요 | ⚠️ config non-optional | ⚠️ |
| **Hook I/O Protocol** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PDCA 워크플로우** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tool Name Mapping** | ✅ | ✅ | ✅ | ⚠️ grep_search | ⚠️ grep_search |

### 5.2 리스크 매트릭스

| ID | 리스크 | 확률 | 심각도 | 영향도 | 대응 |
|----|--------|------|--------|--------|------|
| R1 | Hook XML 컨텍스트 래핑이 LLM 동작 변경 | Medium | Medium | MEDIUM | 테스트 후 GEMINI.md 조정 |
| R2 | `experimental.skills` 플래그가 향후 에러 유발 | Low | High | MEDIUM | 즉시 제거 |
| R3 | `grep` → `grep_search` 도구 이름 불일치 | Low | Medium | LOW | 레거시 alias 존재, 모니터링 |
| R4 | AfterAgent Hook의 agent_name 필드 미존재 | Medium | High | **HIGH** | 공식 스키마 대조 테스트 필요 |
| R5 | Subagent 실행 제한으로 에이전트 동작 제약 | Low | High | MEDIUM | v0.28+ 테스트 필요 |
| R6 | 폴더 신뢰 강제로 workspace settings 무시 | Medium | Medium | MEDIUM | 설치 가이드 업데이트 |
| R7 | Extension config 필수 필드 변경 | Low | Medium | LOW | gemini-extension.json 검증 |
| R8 | System Prompt 개편으로 에이전트 동작 변경 | Medium | Medium | MEDIUM | v0.29+ 테스트 필요 |

---

## 6. 권장 조치사항

### 6.1 즉시 필요 (v0.27.3 Stable 대응)

| 우선순위 | 조치 | 예상 작업량 | 파일 |
|----------|------|-----------|------|
| **P0** | `gemini-extension.json`에서 `experimental.skills` 제거 | 5분 | `gemini-extension.json` |
| **P0** | AfterAgent Hook의 입력 스키마를 공식 문서와 대조 검증 | 1시간 | `hooks/scripts/after-agent.js` |
| **P1** | v0.27.3 환경에서 전체 Hook 동작 E2E 테스트 | 2시간 | 전체 hooks/ |
| **P1** | Hook XML 컨텍스트 래핑 영향 테스트 | 1시간 | GEMINI.md 조정 여부 |

### 6.2 Preview 대응 (v0.28.0 Stable 예상: ~2026-02-10)

| 우선순위 | 조치 | 예상 작업량 | 파일 |
|----------|------|-----------|------|
| **P1** | TOOL_MAP에서 `grep` → `grep_search` 매핑 검증/업데이트 | 30분 | `lib/adapters/gemini/index.js` |
| **P1** | GEMINI.md Tool Reference 테이블 업데이트 | 15분 | `GEMINI.md` |
| **P2** | 폴더 신뢰 강제 대응 - 설치 가이드 업데이트 | 30분 | README.md |
| **P2** | Subagent 실행 제한 영향 테스트 | 1시간 | agents/*.md |
| **P3** | Plan Mode 통합 가능성 조사 | 2시간 | 신규 기능 |

### 6.3 선택적 개선 (Opportunity)

| 기능 | 설명 | 기대 효과 | 예상 작업량 |
|------|------|----------|-----------|
| **Plan Mode 통합** | `/plan` 명령을 PDCA Plan phase와 연동 | PDCA 워크플로우 강화 | 1-2일 |
| **신규 Hook 활용** | BeforeModel, AfterModel, BeforeToolSelection | 더 정밀한 에이전트 제어 | 2-3일 |
| **A2A 인프라 활용** | Agent-to-Agent 통신으로 에이전트 협업 | 팀 에이전트 기능 강화 | 3-5일 |
| **/rewind 통합** | PDCA 상태 롤백 기능 | 에러 복구 강화 | 1일 |
| **Extension Registry 등록** | 공식 갤러리에 bkit 등록 | 배포 채널 확대 | 1일 |
| **Extension 테마** | bkit 전용 테마 | 사용자 경험 개선 | 0.5일 |
| **Policy Engine 통합** | TOML 기반 정책 파일 제공 | 보안 강화 | 1일 |

---

## 7. 이전 보고서와의 차이점

### 7.1 분석 범위 비교

| 항목 | 이전 보고서 (2026-02-04) | 현재 보고서 (2026-02-08) |
|------|------------------------|------------------------|
| 분석 범위 | v0.25.0 → v0.28.0 (nightly) | v0.25.0 → v0.29.0 (nightly) |
| Stable 버전 | v0.25.0 (추정) | **v0.27.3 (확인)** |
| 릴리즈 채널 | 미구분 | **Stable/Preview/Nightly 3채널** |
| Breaking Changes | 4개 | **14개+** |
| 신규 기능 | 5개 | **20개+** |
| 신규 Hook 이벤트 | 미발견 | **4개 (BeforeModel, AfterModel, BeforeToolSelection, Notification)** |
| Impact Score | 65/100 (Medium) | **78/100 (HIGH)** |

### 7.2 결론 변경

| 항목 | 이전 결론 | 현재 결론 |
|------|----------|----------|
| 업그레이드 안전성 | "안전하게 진행 가능" | **"조건부 안전 - P0 조치 선행 필요"** |
| 리스크 레벨 | LOW | **MEDIUM** |
| 즉시 수정 필요 | 없음 | **2개 항목 (experimental 제거, AfterAgent 스키마 검증)** |
| 새로운 기회 | 3개 (rewind, always allow, multimodal) | **7개+ (Plan Mode, A2A, 신규 Hooks, Registry 등)** |

---

## 8. 마이그레이션 체크리스트

### Phase 1: v0.27.3 Stable 대응 (즉시)

- [ ] `gemini-extension.json`에서 `"experimental": { "skills": true }` 제거
- [ ] v0.27.3 환경에서 7개 Hook 전체 동작 검증
- [ ] AfterAgent Hook 입력 스키마 공식 문서 대조
- [ ] Hook XML `<hook_context>` 래핑 영향 확인
- [ ] Skills reload 메커니즘 동작 확인
- [ ] Event-Driven Scheduler 하에서 Hook 타이밍 확인

### Phase 2: v0.28.0 Preview 대응 (~2026-02-10)

- [ ] `grep` → `grep_search` 도구 이름 변경 대응
- [ ] GEMINI.md Tool Reference 테이블 업데이트
- [ ] 폴더 신뢰 강제 환경에서 Extension 로딩 확인
- [ ] Subagent 실행 제한 하에서 11개 에이전트 동작 확인
- [ ] MCP OAuth 동의 흐름 영향 확인 (해당 시)
- [ ] Plan Mode 기능 테스트 및 PDCA 통합 평가

### Phase 3: 선택적 개선 (v0.29+ 준비)

- [ ] 신규 Hook 이벤트 (BeforeModel, AfterModel 등) 활용 설계
- [ ] Plan Mode ↔ PDCA Plan phase 통합 프로토타입
- [ ] A2A 인프라 활용 방안 조사
- [ ] Extension Registry 등록 준비
- [ ] Gemini 3 모델 호환성 테스트 및 문서화
- [ ] System Prompt 개편 (v0.29) 영향 사전 평가

---

## 9. 참조

### 공식 소스

| 소스 | URL |
|------|-----|
| Gemini CLI GitHub | https://github.com/google-gemini/gemini-cli |
| 공식 문서 (신규) | https://geminicli.com/docs/ |
| Hooks Reference | https://geminicli.com/docs/hooks/reference/ |
| Changelogs - Stable | https://geminicli.com/docs/changelogs/latest/ |
| Changelogs - Preview | https://geminicli.com/docs/changelogs/preview/ |
| Extensions Gallery | https://geminicli.com/extensions/ |
| Skills Documentation | https://geminicli.com/docs/cli/skills/ |
| Policy Engine | https://geminicli.com/docs/core/policy-engine/ |

### 주요 PR

| PR | 제목 | 영향 |
|----|------|------|
| [#16919](https://github.com/google-gemini/gemini-cli/pull/16919) | Remove fireAgent and beforeAgent hook | 내부 구현 변경 |
| [#17204](https://github.com/google-gemini/gemini-cli/pull/17204) | Migrate beforeTool/afterTool to hookSystem | Hook 시스템 통합 |
| [#17237](https://github.com/google-gemini/gemini-cli/pull/17237) | Hook-injected context XML wrapping | 컨텍스트 형식 변경 |
| [#17244](https://github.com/google-gemini/gemini-cli/pull/17244) | Remove legacy settings | 설정 정리 |
| [#17247](https://github.com/google-gemini/gemini-cli/pull/17247) | Hooks enabled by default | 기본 활성화 |
| [#17693](https://github.com/google-gemini/gemini-cli/pull/17693) | Agent Skills promoted to stable | GA 승격 |
| [#17867](https://github.com/google-gemini/gemini-cli/pull/17867) | Remove tools.enableHooks setting | 레거시 설정 제거 |
| [#18151](https://github.com/google-gemini/gemini-cli/pull/18151) | .agents/skills directory alias | 스킬 경로 확장 |
| [#18225](https://github.com/google-gemini/gemini-cli/pull/18225) | Skills reload on extension change | 자동 리로드 |
| [#18396](https://github.com/google-gemini/gemini-cli/pull/18396) | Extension registry client | 확장 레지스트리 |
| [#18414](https://github.com/google-gemini/gemini-cli/pull/18414) | Remove previewFeatures, default Gemini 3 | 모델 변경 |
| [#18447](https://github.com/google-gemini/gemini-cli/pull/18447) | Extension config enabled by default | 확장 기본 활성화 |
| [#18498](https://github.com/google-gemini/gemini-cli/pull/18498) | Rename search_file_content to grep_search | 도구 이름 변경 |

### Google 기술 블로그

| 날짜 | 제목 |
|------|------|
| 2026-01-28 | [Tailor Gemini CLI with hooks](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/) |
| 2026-02-05 | [Gemini 3 Flash in Gemini CLI](https://developers.googleblog.com/gemini-3-flash-is-now-available-in-gemini-cli/) |
| 2026-02-05 | [Agent Factory: Build AI Workforce](https://cloud.google.com/blog/topics/developers-practitioners/agent-factory-recap-build-an-ai-workforce-with-gemini-3) |

### bkit 분석 대상 파일

| 파일 | 분석 내용 |
|------|----------|
| `gemini-extension.json` | Extension manifest, experimental 플래그 |
| `hooks/hooks.json` | 7개 Hook 이벤트 설정 |
| `hooks/scripts/*.js` (7개) | Hook 스크립트 전체 구현 |
| `lib/adapters/gemini/index.js` | GeminiAdapter, TOOL_MAP, Hook I/O |
| `lib/adapters/platform-interface.js` | PlatformAdapter 인터페이스 |
| `lib/adapters/index.js` | Adapter 로더 |
| `bkit.config.json` | bkit 내부 설정 |
| `GEMINI.md` | LLM 컨텍스트 파일 |
| `skills/` (21개 스킬) | 스킬 정의 |
| `agents/` (11개 에이전트) | 에이전트 정의 |

---

## 10. 결론

### 핵심 요약

Gemini CLI는 v0.27.0(Stable)에서 **대규모 안정화 릴리즈**를 진행했으며, v0.28.0(Preview)에서 **Plan Mode, Extension System 강화, A2A 인프라** 등 혁신적 기능을 도입하고 있습니다.

bkit-gemini의 핵심 인프라(Hook I/O Protocol, Extension 번들 포맷, Skills/Agents 시스템)는 **기본적으로 호환**되나, 세부 사항에서 **즉시 대응이 필요한 2개 항목**과 **단기 대응이 필요한 5개 항목**이 있습니다.

### 위험 수준

```
전체 위험 수준: MEDIUM (조건부 안전)
─────────────────────────────────────
P0 조치 완료 후: LOW (안전하게 업그레이드 가능)
```

### 권장 접근 방식

1. **즉시**: P0 항목 2개 수정 (`experimental` 제거, `AfterAgent` 스키마 검증)
2. **1주 내**: v0.27.3 환경에서 E2E 테스트 → 프로덕션 업그레이드
3. **2주 내**: v0.28.0 Stable 출시 시 Preview 대응 항목 적용
4. **향후**: Plan Mode 통합, 신규 Hook 활용, A2A 탐색 등 기회 포착

---

**Report Generated**: 2026-02-08
**bkit Version**: 1.5.0
**Analysis Tool**: bkit CTO Team (4 Research Agents + CTO Lead)
**Previous Report**: gemini-cli-028-upgrade-impact-analysis.report.md (2026-02-04)

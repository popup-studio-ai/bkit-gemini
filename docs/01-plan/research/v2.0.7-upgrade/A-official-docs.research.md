# A축: Gemini CLI 공식 문서 심층 조사 (bkit v2.0.7-upgrade)

> 작성일: 2026-05-14
> 작성자: gemini-researcher agent
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 호환). 사용자 평가에 따라 직전 sprint(v0.42.0-stable-migration)의 "차단/회피" 방향을 폐기하고, **활용/고도화** 방향으로 재설계 중. 본 조사는 master plan 기반 자료.
> 범위: v0.39.1 ~ v0.42.0 stable / v0.43.0-preview.0 공식 문서 + GitHub release/source 직접 인용
> 본 축 출처 원칙: **공식 문서 사이트(geminicli.com/docs/)**, **github.com/google-gemini/gemini-cli** repository, **`gh release/api`** 직접 호출. 외부 블로그/미디어는 본 축 범위 아님 (B축).

---

## 0. 메타데이터

### 0.1 5축 중 본 축의 위치

| 축 | 범위 | 비중 |
|---|---|---|
| **A (본 축)** | **공식 문서 + GitHub release/source 직접 인용** | **약 30%** |
| B | Google 블로그 / DeepMind / 공식 발표 | ~15% |
| C | GitHub Issues/PRs/Discussions 커뮤니티 시그널 | ~25% |
| D | Context Engineering 학술/업계 일반 | ~15% |
| E | bkit 코드베이스 자체 진단 | ~15% |

### 0.2 본 축이 보장하는 것

1. **모든 인용에 URL + 파일/페이지 경로 명시**
2. **추측 0건** — 문서에 명시되지 않은 사항은 "⚠️ 확인 필요" 표기
3. **bkit 매핑 명시** — 각 항목마다 "bkit 현재 상태", "활용 기회 또는 갭", "우선순위(P0/P1/P2/P3)" 제공
4. **버전 추적** — v0.39.1 ~ v0.43.0-preview.0 변경분 매핑

### 0.3 사용 소스 인벤토리

#### 공식 문서 사이트 (geminicli.com/docs/) 확인 페이지

- `/docs/cli/gemini-md/` (GEMINI.md 3-tier hierarchy)
- `/docs/cli/auto-memory/` (Auto Memory inbox flow)
- `/docs/cli/tutorials/memory-management/` (/memory 슬래시 커맨드)
- `/docs/cli/skills/` (Skills 개요)
- `/docs/cli/creating-skills/` (SKILL.md frontmatter)
- `/docs/cli/skills-best-practices/` (skills 설계)
- `/docs/cli/tutorials/skills-getting-started/` (활성화 흐름)
- `/docs/core/subagents/` (Subagents 핵심 spec)
- `/docs/core/remote-agents/` (Remote subagents)
- `/docs/hooks/` (Hooks 개요)
- `/docs/hooks/reference/` (전체 lifecycle 이벤트 + I/O schema)
- `/docs/hooks/writing-hooks/` (실전 가이드)
- `/docs/hooks/best-practices/` (성능/보안)
- `/docs/extensions/` (Extensions 개요)
- `/docs/extensions/writing-extensions/` (튜토리얼)
- `/docs/extensions/reference/` (gemini-extension.json 정식 스펙)
- `/docs/cli/custom-commands/` (TOML 커맨드)
- `/docs/cli/plan-mode/` (Plan Mode)
- `/docs/cli/tutorials/plan-mode-steering/` (Plan + Model Steering)
- `/docs/cli/model-steering/` (model steering)
- `/docs/cli/model-routing/` (model fallback chain)
- `/docs/cli/headless/` (headless mode)
- `/docs/cli/system-prompt/` (GEMINI_SYSTEM_MD)
- `/docs/cli/settings/` (전체 settings 키)
- `/docs/cli/session-management/` (resume/checkpoints)
- `/docs/cli/cli-reference/` (cheatsheet)
- `/docs/reference/configuration/` (configuration 키)
- `/docs/reference/commands/` (slash command 인벤토리)
- `/docs/reference/policy-engine/` (4-tier policy)
- `/docs/reference/memport/` (@file.md 임포트 프로세서)
- `/docs/changelogs/latest/` (= v0.42.0)
- `/docs/changelogs/preview/` (= v0.43.0-preview.0)
- `/docs/tools/mcp-server/`

#### GitHub 직접 접근 (gh CLI / gh api)

- `gh release list --repo google-gemini/gemini-cli --limit 40` — v0.37 ~ v0.43.0-preview.0 메타
- `gh release view v0.39.1 / v0.40.0 / v0.40.1 / v0.41.0 / v0.41.1 / v0.41.2 / v0.42.0 / v0.42.0-preview.0 / v0.43.0-preview.0` — 각 릴리스 본문 직접 인용
- `gh api repos/.../contents/docs/...` — docs/cli/auto-memory.md, docs/cli/skills.md, docs/cli/system-prompt.md, docs/cli/headless.md, docs/cli/cli-reference.md, docs/cli/session-management.md, docs/hooks/writing-hooks.md, docs/hooks/best-practices.md, docs/extensions/reference.md, docs/extensions/writing-extensions.md, docs/changelogs/latest.md, docs/changelogs/preview.md, docs/cli/tutorials/plan-mode-steering.md, docs/cli/model-routing.md 원본 raw 읽기

#### bkit 코드베이스 매핑 참조 (현재 v2.0.6)

- `gemini-extension.json` (version 2.0.7, name "bkit", mcpServers.bkit, contextFileName ["GEMINI.md"])
- `hooks/hooks.json` (SessionStart, BeforeAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool, AfterTool, AfterAgent, PreCompress, SessionEnd 등록됨)
- `hooks/scripts/*.js` (10개 lifecycle 스크립트)
- `agents/*.md` (21 agents: gap-detector, design-validator, cto-lead, pdca-iterator, pm-discovery, pm-lead, qa-monitor, ...)
- `skills/` (35+ skills: pdca, phase-1-schema ~ phase-9-deployment, bkit-rules, ...)
- `mcp/bkit-server.js` (6 tools + spawn_agent registry)
- `policies/bkit-extension-policy.toml` (Tier 2 deny/ask_user 규칙)
- `commands/` (TOML slash commands)

### 0.4 직전 sprint 평가

사용자가 직전 sprint(v0.42.0-stable-migration)를 **"차단/회피 방향"**으로 판단함. 본 조사는 **활용/고도화** 방향으로 재설계 — Auto Memory를 `false`로 잠그는 결정, Subagent Protocol 미사용, `--prompt` 활용 부족 등을 "갭(gap)"으로 식별하고 **차단 해제/적극 활용**의 길을 우선 탐색한다.

---

## 1. Context Engineering 가이드

### 1.1 공식 정의

> 출처: `/docs/cli/gemini-md/` — *"Context files (defaulting to `GEMINI.md`) serve as 'a powerful feature for providing instructional context to the Gemini model.'"*

Gemini CLI는 **"Context Engineering"이라는 정식 용어를 별도 단일 페이지로 정의하지는 않는다**. 대신 3축의 메커니즘으로 "context"를 다룬다:

| 메커니즘 | 페이지 | 정체 |
|---|---|---|
| (1) 명시적 context — GEMINI.md | `/docs/cli/gemini-md/` | "instructional context" 정적 텍스트 |
| (2) 동적 활성화 — Skills (progressive disclosure) | `/docs/cli/skills/` | metadata만 항상 로드, body는 activation 시 |
| (3) 추출/패치 — Auto Memory inbox | `/docs/cli/auto-memory/` | 과거 세션 → 후보 → 사용자 승인 → memory file 패치 |

이는 D축 (Context Engineering 학술 일반)에서 다루는 "Phase-aware loading / minimal token footprint / explicit context anchors" 개념을 **공식 문서 차원에서 부분 매핑**한다 (직접 매핑 표는 D축에 위임).

### 1.2 3-Tier Hierarchical System (공식 인용)

> 출처: `/docs/cli/gemini-md/`

| Tier | 경로 | 발견 시점 | 용도 |
|---|---|---|---|
| 1. Global | `~/.gemini/GEMINI.md` | 세션 시작 | "default instructions for all your projects" |
| 2. Workspace | configured workspace dirs + parent dirs | 세션 시작 | "scope relevant to current work" |
| 3. Just-in-Time (JIT) | 도구가 접근하는 디렉토리 + ancestors up to trusted root | 도구 실행 시 동적 | "model discovery of specific instructions when needed" |

> 핵심 인용: *"When tools access files/directories, the CLI automatically scans for `GEMINI.md` files in that directory and its ancestors up to a trusted root, enabling model discovery of specific instructions when needed."*

### 1.3 Memory Import (memport) — @file.md 구문

> 출처: `/docs/reference/memport/`

```
@./components/instructions.md       # relative
@../shared/style-guide.md           # parent
@/absolute/path/to/file.md          # absolute
```

- **최대 깊이**: default 5 levels — *"To prevent infinite recursion, there's a configurable maximum import depth (default: 5 levels)"*
- **순환 참조 자동 차단**: *"The processor automatically detects and prevents circular imports"*
- **임포트 트리 반환**: 디버깅용 트리 구조 출력

### 1.4 GEMINI_SYSTEM_MD — 시스템 프롬프트 완전 대체

> 출처: `/docs/cli/system-prompt/` (raw md 직접 인용)

- *"The `GEMINI_SYSTEM_MD` variable instructs the CLI to use an external Markdown file for its system prompt, **completely overriding the built-in default**."*
- *"This is a full replacement, not a merge."*
- 활성화: `GEMINI_SYSTEM_MD=true` → `./.gemini/system.md` 읽음 / `GEMINI_SYSTEM_MD=/path/to/file.md` → 절대경로 / `false`/`0` → built-in
- UI 표시: `|⌐■_■|` indicator
- 변수 치환 지원:
  - `${AgentSkills}` — 모든 skills 섹션 자동 주입
  - `${SubAgents}` — 모든 sub-agents 섹션 자동 주입
  - `${AvailableTools}` — 활성 tool name bulleted list
  - `${<toolName>_ToolName}` — 동적 tool 이름 (e.g., `${write_file_ToolName}`)
- 기본 프롬프트 **export 기능**: `GEMINI_WRITE_SYSTEM_MD=1 gemini` → `.gemini/system.md`에 built-in 프롬프트 저장
- **권장 분리**:
  > *"system.md (firmware): Non-negotiable operational rules — safety, tool-use protocols, approvals, and mechanics that keep the CLI reliable. **Stable across tasks and projects** (or per project when needed)."*
  > *"GEMINI.md (strategy): Persona, goals, methodologies, and project/domain context. **Evolves per task**; relies on system.md for safe execution."*

### 1.5 컨텍스트 파일명 커스터마이즈

> 출처: `/docs/cli/gemini-md/` + `/docs/reference/configuration/`

```json
{
  "context": {
    "fileName": ["AGENTS.md", "CONTEXT.md", "GEMINI.md"]
  }
}
```

- 배열로 다중 이름 지원
- bkit은 현재 `contextFileName: ["GEMINI.md"]`만 사용 (gemini-extension.json L11)

### 1.6 settings.json - context.* 키 전체 (공식)

> 출처: `/docs/cli/settings/` (gh api `docs/cli/settings.md` raw)

| 키 | 기본값 | 설명 (공식 인용) |
|---|---|---|
| `context.discoveryMaxDirs` | `200` | "Maximum number of directories to search for memory." |
| `context.loadMemoryFromIncludeDirectories` | `false` | "When true, include directories are scanned; when false, only the current directory is used." |
| `context.fileFiltering.respectGitIgnore` | `true` | |
| `context.fileFiltering.respectGeminiIgnore` | `true` | |
| `context.fileFiltering.enableRecursiveFileSearch` | `true` | "@ references in the prompt" |
| `context.fileFiltering.enableFuzzySearch` | `true` | |
| `context.fileFiltering.customIgnoreFilePaths` | `[]` | "Additional ignore file paths to respect. These files take precedence..." |

### 1.7 bkit 현재 상태 매핑

| 사항 | bkit 현재 | 공식 권장 | 갭 |
|---|---|---|---|
| GEMINI.md hierarchy 사용 | ✅ (Global + Workspace) | 3-tier 권장 | JIT 활용 미확인 — verify 필요 |
| `@import` 사용 | ⚠️ 확인 필요 (lib/core/paths.js 보고서 인용 가능성) | depth 5 default | bkit 측 깊이 명시? |
| GEMINI_SYSTEM_MD 활용 | ❌ 미사용 (built-in 사용 추정) | 권장: system.md firmware + GEMINI.md strategy | **P0 활용 후보** — bkit이 시스템 prompt firmware를 명시 관리 가능 |
| `${AgentSkills}` / `${SubAgents}` 변수 치환 | ❌ | 시스템 prompt에서 활용 가능 | **P1 활용 후보** |
| `context.fileName` 배열 | `["GEMINI.md"]`만 사용 | `["AGENTS.md", ...]` 다중 지원 | P3 (Agent Skills 표준 호환) |

---

## 2. Memory System (Auto Memory + memoryManager)

### 2.1 Auto Memory — 공식 정의 (전체)

> 출처: `/docs/cli/auto-memory/` (gh api raw, ~6.5KB 전문 확보)

> *"Auto Memory is an experimental feature that mines your past Gemini CLI sessions in the background and proposes durable memory updates and reusable Agent Skills. You review each candidate before it becomes available to future sessions: apply memory updates, promote skills, or discard anything you do not want."*

### 2.2 동작 모델 (정확 6단계)

| # | 단계 | 핵심 인용 |
|---|---|---|
| 1 | Eligibility scan | "sessions are eligible only if they have been idle for at least three hours and contain at least 10 user messages" |
| 2 | Lock acquisition | "A lock file in the project's memory directory coordinates across multiple CLI instances so extraction runs at most once at a time" |
| 3 | Candidate extraction | "background extraction agent... defaults to creating no artifacts unless the evidence is strong" |
| 4 | Safety boundaries | "It cannot directly edit active memory files, settings, credentials, or project `GEMINI.md` files." |
| 5 | Patch validation | "Skill update patches are parsed and dry-run before they are surfaced. Memory patches are parsed, target-allowlisted, and applied atomically only when you approve them from the inbox." |
| 6 | Notification | "Gemini CLI surfaces an inline message telling you how many items are waiting" |

### 2.3 활성화 / 비활성화 (공식)

```json
{
  "experimental": {
    "autoMemory": true
  }
}
```

- 위치 1: `~/.gemini/settings.json` (전역)
- 위치 2: `.gemini/settings.json` (프로젝트)
- 재시작 필수: *"The flag requires a restart because the extraction service starts during session boot."*
- 비활성화: `false` 설정 후 재시작 — *"Disabling the flag stops the background service immediately on the next session start. Existing inbox items remain on disk."*

### 2.4 Patch Contract (정식 공식 인용)

> v0.42.0 changelog: *"add Auto Memory inbox flow with **canonical-patch contract**"* (PR #26338)
> auto-memory.md raw: *"It can draft memory updates as unified diff `.patch` files and draft reusable procedures as `SKILL.md` files. All candidates are held in a project-local inbox until you approve or discard them."*
> settings.md `experimental.autoMemory` 설명 인용: *"Every change is written as a unified diff `.patch` file under `<projectMemoryDir>/.inbox/<kind>/` and held for review in /memory inbox; nothing is applied until you approve it."*

핵심 사실:
- **형식**: unified diff `.patch` 파일
- **위치**: `<projectMemoryDir>/.inbox/<kind>/`
- **kind 종류**: skill / skill-update / memory (private/global) — 4가지 카테고리
- **타깃 패치 종류**:
  - **Skill 새로 생성**: `SKILL.md` 드래프트 파일
  - **Skill 업데이트**: 기존 skill에 대한 `.patch`
  - **Memory 패치 (private)**: project memory dir 안의 파일 패치
  - **Memory 패치 (global)**: `~/.gemini/GEMINI.md` 패치
- **금지**: project `GEMINI.md` 직접 수정 — *"Project or workspace shared instructions in project `GEMINI.md` files are not auto-extractable."*
- **승인 인터페이스**: `/memory inbox` 슬래시 커맨드

### 2.5 `experimental.memoryManager` 키 상태

> 출처: `/docs/cli/settings/` raw grep, v0.40.0 release PR #25601

- **상태**: v0.40.0에서 PR #25601 (*"feat(config): split memoryManager flag into autoMemory by @SandyTao520"*)로 **분리됨**
- **현재**: `experimental.memoryManager` 단일 키는 더 이상 settings 문서에 등장하지 않음. `experimental.autoMemory`로 일원화
- ⚠️ 확인 필요: 코드 베이스에 `memoryManager`가 별도 internal flag로 잔존할 가능성. 본 A축에서는 공식 문서상 "deprecated/replaced" 결론

### 2.6 Skills/Memory 처리 한계 (공식 인용)

| 한계 | 인용 |
|---|---|
| 현재 세션 분석 안 함 | "Auto Memory does not extract memory or skills from the current session. It only considers sessions that have been idle for three hours or more." |
| project GEMINI.md 미터치 | "Project or workspace shared instructions in project `GEMINI.md` files are not auto-extractable. Auto Memory can propose private project memory, global personal memory, and skills." |
| Cross-workspace 자동 promotion 없음 | "Skills extracted in one workspace are not visible from another until you promote them to the user-scope skills directory." |
| 추출 모델 한계 | "The extraction agent runs on a preview Gemini Flash model. Extraction quality depends on the model's ability to recognize durable patterns versus one-off incidents." |
| 시크릿 노출 위험 | "transcript excerpts may be sent to the configured model as part of those calls. The extraction agent is instructed to redact secrets, tokens, and credentials it encounters" |

### 2.7 bkit 현재 상태 매핑 (사용자 평가가 "차단/회피"로 평한 부분 핵심)

| 사항 | bkit 현재 | 공식 권장 | 갭 / 활용 기회 |
|---|---|---|---|
| `experimental.autoMemory` | (`gemini-extension.json` settings 노출 없음, 사실상 비잠금) | default `false`, 옵트인 | bkit이 직접 `false`로 잠근 흔적 없음 — settings 사용자 결정에 위임됨. **단, bkit 워크플로(PDCA + GEMINI.md)와의 충돌 가능성** 평가 필요 |
| Auto Memory inbox 활용 | ❌ 무경험 | 권장 옵트인 | **P1 활용 기회** — bkit 사용자가 활성화한 경우, `/memory inbox` 흐름과 bkit 워크플로 통합 가이드 작성 |
| `~/.gemini/GEMINI.md` global 패치 가능 | bkit이 직접 안 건드림 | Auto Memory가 global 패치 가능 | bkit이 global GEMINI.md 사용 안내 (충돌 회피) |
| Skill 자동 추출 → bkit/skills/ 승격 | ❌ | 가능 | **P1 활용 기회** — bkit 사용자가 자기 워크플로 Skill 자동 추출 가능 |
| `<projectMemoryDir>/.inbox/` 인지 | ❌ | 표준 위치 | **P0** — bkit hooks가 `.inbox/` 무시 / `.geminiignore` 추가 검토 |
| Memory dir 충돌 | bkit `.gemini/` 사용 | Auto Memory는 `~/.gemini/tmp/<project>/` 사용 | 충돌 없음 ✅ |

### 2.8 `/memory` 슬래시 커맨드 인벤토리 (공식)

> 출처: `/docs/reference/commands/`, `/docs/cli/tutorials/memory-management/`

| 명령 | 동작 |
|---|---|
| `/memory show` | "displays full concatenated context content" — 모델이 받는 그대로 출력 |
| `/memory reload` (= `/memory refresh`) | GEMINI.md 재스캔 |
| `/memory list` | (v0.42.0+) 메모리 파일 목록 |
| `/memory inbox` | (v0.42.0+) Auto Memory 후보 검토 dialog |
| `/memory add` | (v0.43.0-preview.0 changelog PR #26605: *"hide /memory add subcommand when memoryV2 is enabled"*) — v2가 점진 노출 |

⚠️ 확인 필요: "memoryV2"의 정식 명칭/스펙은 공식 문서에 별도 페이지 없음. v0.43.0-preview에서 등장한 내부 flag로 보임.

---

## 3. Sub-agents 시스템

### 3.1 공식 정의

> 출처: `/docs/core/subagents/`

> *"Subagents are 'specialists' that the main Gemini agent can hire for a specific job."*

핵심 특성:
- "Focused context" — 자체 system prompt + persona
- "Specialized tools" — 제한된/특화된 tool set
- "Independent context window" — 별도 context loop, 메인 대화에서 토큰 절약
- **메인 agent에 tool로 노출**: *"Subagents are exposed to the main agent as a tool of the same name."*

### 3.2 정식 YAML Frontmatter Schema (공식 인용)

> 출처: `/docs/core/subagents/`

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `name` | string | ✅ | — | "Unique identifier slug (lowercase, hyphens, underscores only)" |
| `description` | string | ✅ | — | "Short description of capabilities" |
| `kind` | string | ❌ | `local` | `local` or `remote` |
| `tools` | array | ❌ | (inherit) | "Tool names; supports wildcards (`*`, `mcp_*`, `mcp_<server-name>_*`)" |
| `mcpServers` | object | ❌ | — | Inline MCP server configs |
| `model` | string | ❌ | `inherit` | 모델 override |
| `temperature` | number | ❌ | `1` | 0.0–2.0 |
| `max_turns` | number | ❌ | `30` | |
| `timeout_mins` | number | ❌ | `10` | |

원본 예제:
```yaml
---
name: security-auditor
description: Specialized in finding security vulnerabilities in code.
kind: local
tools:
  - read_file
  - grep_search
model: gemini-3-flash-preview
temperature: 0.2
max_turns: 10
---
You are a ruthless Security Auditor...
```

### 3.3 등록 위치

> 출처: `/docs/core/subagents/`

- 프로젝트: `.gemini/agents/*.md` (팀 공유)
- 사용자: `~/.gemini/agents/*.md` (개인)
- **Extension 번들 (bkit의 경우)**: extension `agents/` 디렉토리에 `.md` 추가 — *"Add agent definition files (`.md`) to an `agents/` directory in your extension root."* (출처: `/docs/extensions/reference/` §Sub-agents)

  ⚠️ 주의: v2 reference에 *"Sub-agents are a preview feature currently under active development."* 명시

### 3.4 Built-in Subagents 4종

> 출처: `/docs/core/subagents/`

| name | purpose | 상태 |
|---|---|---|
| `codebase_investigator` | "Analyze the codebase, reverse engineer, and understand complex dependencies" | default enabled |
| `cli_help` | "Get expert knowledge about Gemini CLI itself, its commands, configuration, and documentation" | default enabled |
| `generalist` | "general, all-purpose subagent that uses the inherited tool access... ideal for executing broad, resource-heavy subtasks" | default enabled |
| `browser_agent` | "Automate web browser tasks" | **default disabled** (Chrome v144+ required) |

### 3.5 호출 방식

```text
"How does the auth system work?"
   → 자동 위임 (description 매칭) → codebase_investigator
```

명시적 위임 (@ syntax):
```text
@codebase_investigator Map out the relationship between X and Y.
```

설정 override:
```json
{
  "agents": {
    "overrides": {
      "codebase_investigator": {
        "modelConfig": { "model": "gemini-3-flash-preview" },
        "runConfig": { "maxTurns": 50 }
      }
    }
  }
}
```

### 3.6 격리 / 안전 규칙 (공식 인용)

- *"Subagents cannot call other subagents. If a subagent is granted the `*` tool wildcard, it will still be unable to see or invoke other agents."*
- Policy Engine TOML에서 `subagent` 필드로 제어 가능
- 글로벌 비활성: `"experimental.enableAgents": false` (default `true` per `/docs/reference/configuration/`)

### 3.7 LocalSubagentProtocol / RemoteSubagentProtocol (v0.43.0-preview.0)

> 출처: `/docs/changelogs/preview/` (gh api raw)

- **PR #25302**: *"feat(core): add LocalSubagentProtocol behind AgentProtocol"*
- **PR #25303**: *"feat(core): add RemoteSubagentProtocol behind AgentProtocol"*
- **PR #26934**: *"refactor(core): introduce SubagentState enum for progress"*
- **PR #26661**: *"refactor(core): agent session protocol changes"*
- **PR #26934 / #26717**: *"Incremental refactor repo agent towards skills-based composition"*

⚠️ **공식 문서에는 `LocalSubagentInvocation` / `LocalSubagentProtocol` 페이지 없음** — 내부 구현. 영향 평가는 C축에 위임.

### 3.8 Remote Subagents — kind=remote

> 출처: `/docs/core/remote-agents/` (WebFetch)

- 필수 필드: `kind: remote`, unique `name`, `agent_card_url` 또는 `agent_card_json`
- 선택: 인증 config
- "Mixed local and remote agents in a single file are not supported"
- A2A 카드 endpoint를 첫 시도 인증 없이, 401/403 시 auth header로 재시도
- HTTP/HTTPS 프록시는 `general.proxy` 사용

### 3.9 bkit 21 agents 매핑

bkit 현재 `.gemini/extensions/bkit/agents/*.md` 21개:
gap-detector, design-validator, cto-lead, pdca-iterator, pm-discovery, pm-lead, pm-prd, pm-research, pm-strategy, product-manager, qa-monitor, qa-strategist, report-generator, security-architect, starter-guide, bkend-expert, code-analyzer, enterprise-expert, frontend-architect, infra-architect, pipeline-guide

**확인 필요 사항**:
1. bkit agent `.md` 파일들의 YAML frontmatter가 위 §3.2 schema에 맞는지 (E축 코드 진단으로 검증)
2. 현재 bkit은 `spawn_agent` MCP tool로 agent를 *직접* 호출 — Gemini native subagent dispatch와 **이중 경로** 존재 가능성
3. bkit `mcp/bkit-server.js`의 AGENTS registry에 `file`, `recommendedModel`, `safetyTier` 필드가 있음 — Gemini native frontmatter (`tools`, `temperature`, `max_turns`, `timeout_mins`)와 매핑/이행 가능성

**활용 기회 (P0)**: bkit 21 agents를 Gemini native `agents/` 디렉토리에 정식 등록 → **`@agent-name` 직접 호출 지원** + **자동 description-based 위임**. bkit은 이미 `agents/*.md` 파일들을 보유하고 있으므로 frontmatter 정합성만 검증하면 됨.

---

## 4. Hooks 시스템

### 4.1 공식 정의

> 출처: `/docs/hooks/`

> *"Hooks are scripts or programs that Gemini CLI executes at specific points in the agentic loop, allowing you to intercept and customize behavior without modifying the CLI's source code. They operate synchronously—the CLI pauses until all matching hooks complete."*

### 4.2 11개 Lifecycle Events 완전 목록 (공식 인용)

> 출처: `/docs/hooks/reference/`

| # | Event | 시점 | 임팩트 |
|---|---|---|---|
| 1 | `SessionStart` | "Session begins (startup, resume, clear)" | **Inject Context** |
| 2 | `BeforeAgent` | "After prompt submission, before planning" | Block Turn / Context |
| 3 | `BeforeModel` | "Before LLM request" | Block Turn / Mock |
| 4 | `AfterModel` | "After LLM response received" — **fires per chunk** | Block Turn / Redact |
| 5 | `BeforeToolSelection` | "Before LLM selects tools" | Filter Tools |
| 6 | `BeforeTool` | "Before tool execution" | Block Tool / Rewrite |
| 7 | `AfterTool` | "After tool execution" | Block Result / Context |
| 8 | `PreCompress` | "Before context compression" | **Advisory only** (async) |
| 9 | `AfterAgent` | "When agent loop ends" | Retry / Halt |
| 10 | `SessionEnd` | "Session ends (exit, clear)" | **Advisory only** (CLI does not wait) |
| 11 | `Notification` | "System notification occurs" — `ToolPermission` | **Advisory only** |

### 4.3 통신 프로토콜 (Golden Rule)

> 출처: `/docs/hooks/best-practices/` + `/docs/hooks/writing-hooks/`

- **stdin** = Input JSON
- **stdout** = Output JSON (오직 마지막에 단 한 번)
- **stderr** = 로그/디버그/사용자 피드백
- *"Your script must not print any plain text to stdout other than the final JSON object."*
- *"If stdout contains non-JSON text, parsing will fail."*

### 4.4 Exit Code

| code | 의미 | 동작 |
|---|---|---|
| 0 | Success | stdout JSON 파싱 (모든 결정 로직 권장) |
| 2 | System Block | "Critical abort; use stderr for rejection reason". CLI에 에러로 전달. Turn 계속 |
| other | Warning | "Non-fatal; proceed with original parameters" |

### 4.5 Base Input Schema (모든 hook 공통)

```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "hook_event_name": "string",
  "timestamp": "string (ISO 8601)"
}
```

### 4.6 환경 변수 (모든 hook)

> 출처: `/docs/hooks/`

- `GEMINI_PROJECT_DIR` — 프로젝트 루트 절대경로
- `GEMINI_PLANS_DIR` — 플랜 디렉토리 절대경로
- `GEMINI_SESSION_ID` — 현재 세션 unique ID
- `GEMINI_CWD` — 현재 작업 디렉토리
- `CLAUDE_PROJECT_DIR` — **Compatibility alias** (Claude Code 호환)

### 4.7 Event별 I/O Schema (핵심 5종)

#### SessionStart

```json
// Input: extends base + 
{ "source": "startup | resume | clear" }
// Output: hookSpecificOutput.additionalContext (string)
// — "injected as first turn (interactive) or prepended (non-interactive)"
// — "Advisory only; never blocked"
```

#### BeforeAgent

```json
// Input: extends base + { "prompt": "string" }
// Output: hookSpecificOutput.additionalContext (appended to prompt)
// — decision: "deny" erases prompt from history. Exit 2 same effect
```

#### BeforeModel

```json
// Input: extends base +
{
  "llm_request": {
    "model": "string",
    "messages": [{ "role": "user|model|system", "content": "string" }],
    "config": { "temperature": "number" },
    "toolConfig": { "mode": "string", "allowedFunctionNames": "string[]" }
  }
}
// Output:
{
  "llm_request": "object (overrides)",
  "llm_response": "object (synthetic, skips LLM)"
}
```

#### BeforeToolSelection

```json
// Input: same llm_request structure
// Output:
{
  "toolConfig": {
    "mode": "AUTO | ANY | NONE",
    "allowedFunctionNames": "string[] (unioned)"
  }
}
// — No decision, no continue, no systemMessage
```

#### AfterTool

```json
// Input: extends base +
{
  "tool_name": "string",
  "tool_input": "object",
  "tool_response": { "llmContent": "...", "returnDisplay": "...", "error": "..." },
  "mcp_context": "object",
  "original_request_name": "string (optional)"
}
// Output:
{
  "additionalContext": "string (appended)",
  "tailToolCallRequest": { "name": "string", "args": "object" },
  "decision": "deny hides result"
}
```

### 4.8 Timeout Default

> 출처: `/docs/hooks/reference/`

`60000` ms (60s) — bkit `hooks.json`은 5000/3000ms로 더 짧게 명시함 (defensive).

### 4.9 Matcher syntax

> 출처: `/docs/hooks/`

```json
{
  "matcher": "write_file|replace",   // regex 지원
  "hooks": [...]
}
```

- *"Matchers support regular expressions (for example, `matcher: 'read_.*'`)"*
- 내장 도구, MCP 도구 (`mcp_<server>_<tool>`), 정규식 패턴 모두 지원

### 4.10 Extension에서 Hooks 정의 위치

> 출처: `/docs/extensions/reference/` §Hooks

> *"Intercept and customize CLI behavior using hooks. Define hooks in a `hooks/hooks.json` file within your extension directory. **Note that hooks are not defined in the `gemini-extension.json` manifest.**"*

bkit은 이미 `hooks/hooks.json`을 사용 (✅).

### 4.11 RuntimeHook SDK / Function Export 스타일

⚠️ **공식 문서는 오직 "command" type만 명시**:

> 출처: `/docs/hooks/` §"Hook Configuration Fields"

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | "Execution engine (**currently `\"command\"` only**)" |
| `command` | string | Yes* | "Shell command to execute" |
| `name` | string | No | |
| `timeout` | number | No | (ms, default 60000) |
| `description` | string | No | |

따라서 본 A축 결론: **공식 문서에는 "function export" SDK가 documented 되어 있지 않음**. *bkit 도큐먼트에서 "RuntimeHook SDK"라는 용어를 사용하는 경우, 이는 비공식 내부 식별일 가능성*. E축 코드베이스 진단 + C축 PR/소스에서 검증 필요.

(추가: `lib/gemini/hooks.js`가 bkit 측에서 가지고 있는 점은 알려져 있으나, 공식 spec과 매핑은 본 축 범위 외)

### 4.12 bkit 현재 hook 매핑

bkit `hooks/hooks.json` (확보된 데이터):

| event | bkit script | timeout (ms) | 등록됨 |
|---|---|---|---|
| SessionStart | session-start.js | 5000 | ✅ |
| BeforeAgent | before-agent.js | 3000 | ✅ |
| BeforeModel | before-model.js | 3000 | ✅ |
| AfterModel | after-model.js | 3000 | ✅ |
| BeforeToolSelection | before-tool-selection.js | 3000 | ✅ |
| BeforeTool | before-tool.js | (확인 필요) | ✅ (scripts/ 존재) |
| AfterTool | after-tool.js | (확인 필요) | ✅ |
| AfterAgent | after-agent.js | (확인 필요) | ✅ |
| PreCompress | pre-compress.js | (확인 필요) | ✅ |
| SessionEnd | session-end.js | (확인 필요) | ✅ |

**누락**: `Notification` 이벤트 — bkit 미사용.

**활용 기회 (P2)**: `Notification` hook을 추가하면 tool permission 요청을 bkit-server에 로깅 가능. observability 강화 후보.

---

## 5. Tools 시스템

### 5.1 ToolDisplay 객체 (v0.40.0+ refactor 시작, v0.43.0-preview.0 진행)

> 출처: `/docs/changelogs/preview/` (PR #25186 = *"refactor(cli): migrate core tools to native ToolDisplay property and fix UI rendering"*)

⚠️ 공식 문서에는 ToolDisplay의 spec 별도 페이지 없음. 인용 가능 사실:
- PR #25186 *v0.43.0-preview.0*에 포함 (v0.42.0에는 부분만)
- "legacy `returnDisplay` adapter deprecated"
- bkit MCP tools가 `llmContent` + `returnDisplay`를 사용하면, `returnDisplay`가 점진 deprecate 예정

**확인 필요**: bkit `mcp/bkit-server.js` 6 tools가 어떤 display 객체를 emit 하는지 (E축 위임).

### 5.2 `tools.core` Allowlist (v0.41.0 신규)

> 출처: v0.41.0 release notes — PR #25720 *"feat(core): enhance shell command validation and add core tools allowlist"*
> 출처: `/docs/reference/configuration/` — *"`tools.core` — array — Restrict built-in tools with an allowlist by name"*

활용:
```json
{
  "tools": {
    "core": ["read_file", "list_directory", "grep_search", "write_file"]
  }
}
```

⚠️ 정확한 동작 매뉴얼은 settings/reference에 명시되어 있으나 별도 페이지 없음. v0.41.0+ 추가.

### 5.3 Tool 격리 / Parallel scheduler

> 출처: `/docs/tools/mcp-server/` + v0.43.0-preview.0 PR #26646 *"fix(core): resolve parallel tool call streaming ID collision"*

- 환경 변수 자동 redaction: `*TOKEN*`, `*SECRET*`, `*PASSWORD*`, `*KEY*`, `*AUTH*`, `*CREDENTIAL*`
- `includeTools` / `excludeTools` 필터 (per MCP server)
- `trust: true` → 확인 prompt 생략
- **MCP server name 제약**: 언더스코어 금지 (hyphen 권장) — *"because the policy parser splits on the first underscore after the `mcp_` prefix"*

⚠️ **bkit MCP server name = "bkit"** (✅ 안전, underscore 없음)

### 5.4 MCP tool FQN convention

> 출처: `/docs/tools/mcp-server/`

> *"All MCP tools are unconditionally assigned a fully qualified name"* — `mcp_<serverName>_<toolName>`

bkit MCP tools (6개):
- `mcp_bkit_spawn_agent`
- `mcp_bkit_list_agents`
- `mcp_bkit_get_agent_info`
- `mcp_bkit_team_create`, `mcp_bkit_team_assign`, `mcp_bkit_team_status`
- `mcp_bkit_bkit_pm_run`, `bkit_qa_run`, `bkit_iterate`, `bkit_team_run`, `bkit_audit_query`, `bkit_checkpoint`

⚠️ bkit-server.js에 표기상 6 tools라 했으나 실제 11+ — bkit-server.js 파일 §AGENTS registry 따로 + bkit_* tools 분리 (확인은 E축).

### 5.5 Resource tools (v0.40.0+ MCP resources)

> 출처: `/docs/tools/mcp-server/` + v0.40.0 PR #25395 *"feat(core): add tools to list and read MCP resources"*

- `@<server>://resource/path` 구문으로 컨텍스트 주입
- `resources/list`, `resources/read` 호출
- `/mcp` 명령에 리소스 표시

**활용 기회 (P3)**: bkit이 PDCA 산출물(plans, audit logs, checkpoints)을 MCP resource로 노출하면 모델이 직접 `@bkit://plan/v2.0.7-upgrade` 같은 구문으로 접근 가능. 현재 bkit은 tool 기반만 사용.

---

## 6. Extensions 시스템

### 6.1 공식 정의

> 출처: `/docs/extensions/`

> *"Gemini CLI extensions package prompts, MCP servers, custom commands, themes, hooks, sub-agents, and agent skills into a familiar and user-friendly format."*

### 6.2 7개 컴포넌트 타입 (공식 분류)

> 출처: `/docs/extensions/writing-extensions/` §Extension features (raw 테이블)

| Feature | What | Invoked by |
|---|---|---|
| **MCP server** | "new tools and data sources" | Model |
| **Custom commands** | "shortcut (like `/my-cmd`)" | User |
| **Context file (GEMINI.md)** | "loaded into the model's context" | CLI provides to model |
| **Agent skills** | "specialized instructions activated only when needed" | Model |
| **Hooks** | "intercept lifecycle events" | CLI |
| **Custom themes** | "color definitions" | User (via /theme) |
| **Sub-agents** (preview) | `agents/*.md` | Model |

추가: **Policy Engine TOML** (별도 컴포넌트로 분류되진 않으나 reference에서 명시)

### 6.3 gemini-extension.json 전체 스키마 (공식)

> 출처: `/docs/extensions/reference/` raw md

| 필드 | 타입 | 필수 | 설명 (공식 인용) |
|---|---|---|---|
| `name` | string | ✅ | "lowercase or numbers and use dashes instead of underscores or spaces" + "we expect this name to match the extension directory name" |
| `version` | string | ✅ | extension version |
| `description` | string | ❌ (display) | "displayed on geminicli.com/extensions" |
| `mcpServers` | object | ❌ | settings.json takes precedence on name conflict |
| `contextFileName` | string\|string[] | ❌ | defaults to GEMINI.md |
| `excludeTools` | array | ❌ | **여전히 active, deprecated 표시 없음**. e.g., `"excludeTools": ["run_shell_command(rm -rf)"]` |
| `migratedTo` | string (URL) | ❌ | "automatic migration detection" |
| `plan.directory` | string | ❌ | "fallback planning artifact directory" |
| `settings` | array | ❌ | user-provided config at install |
| `themes` | array | ❌ | custom UI themes |

### 6.4 `excludeTools` 상태 — 정정

> 출처: `/docs/extensions/reference/` (raw) + `/docs/reference/policy-engine/`

- **A축 확인 결론**: `excludeTools`는 **공식 문서에 아직 deprecated 표시 없음**. 단, Policy Engine에서 *"more secure than legacy `tools.exclude` setting"*이라는 표현이 있고, settings 측 `tools.exclude`만 "legacy"로 표기됨
- Extensions 측 `excludeTools`는 reference에서 그대로 권장 사용 — *"This differs from the MCP server `excludeTools` functionality"*
- **그러나** bkit이 이미 Tier 2 TOML policy로 이행한 결정은 **여전히 권장 방향**. Policy Engine이 strictly 우월:
  - 명시적 우선순위 (`priority`)
  - mode-specific (`modes`)
  - `interactive` 제약
  - `commandPrefix` / `commandRegex` shorthand
  - `argsPattern` 정규식
  - extension tier(2)에서 `allow`/`yolo` 금지로 **안전 강화**

### 6.5 변수 치환

| 변수 | 설명 |
|---|---|
| `${extensionPath}` | "absolute path to extension's directory" |
| `${workspacePath}` | "absolute path to current workspace" |
| `${/}` | "platform-specific path separator" |

(`gemini-extension.json` + `hooks/hooks.json` 모두에서 동작)

### 6.6 Conflict resolution

> 출처: `/docs/extensions/reference/` §Conflict resolution

- 명령 이름 충돌: extension command가 user/project 보다 낮은 우선순위
- 충돌 시 자동 prefix: `/gcp.deploy` (dot separator, **콜론 `:`이 아님** — namespacing은 colon, conflict prefix는 dot)
- Theme 이름 충돌: `<theme-name> (<extension-name>)` 표기

### 6.7 Extension 측 디렉토리 컨벤션 (공식)

- `commands/` (TOML)
- `hooks/hooks.json`
- `skills/<name>/SKILL.md`
- `agents/<name>.md` (preview)
- `policies/*.toml`
- `GEMINI.md` (default if exists)
- `package.json` (Node.js extensions)
- `settings` array 항목 → install 시 사용자 입력 → `.env` 저장 (`sensitive: true`면 시스템 keychain)

### 6.8 bkit 매핑

| 컴포넌트 | bkit 현재 | 공식 권장 | 상태 |
|---|---|---|---|
| MCP server | `mcp/bkit-server.js` (✅) | command + args 분리 | ✅ 준수 (gemini-extension.json L17-19) |
| Custom commands | `commands/*.toml` (✅) | colon namespacing | ✅ 준수 |
| GEMINI.md | `GEMINI.md` 루트 (✅) | extension root | ✅ |
| Skills | `skills/*/SKILL.md` (✅) | progressive disclosure | ✅ 35+ skills |
| Hooks | `hooks/hooks.json` (✅) | manifest 외 | ✅ |
| Themes | ❌ | optional | 미사용 (계획 없음) |
| Sub-agents (preview) | `agents/*.md` (✅) | extension root agents/ | ✅ (등록 메커니즘 검증 필요 — §3.9) |
| Policy TOML | `policies/bkit-extension-policy.toml` (✅) | Tier 2 | ✅ |
| Settings array | (✅) Output Style + Project Level | `.env` + keychain | ✅ |
| `migratedTo` 필드 | ❌ | optional | bkit이 repo 이전 가능성 대비 명시? P3 |

---

## 7. Policy Engine

### 7.1 4-Tier 구조 (공식 정정)

> 출처: `/docs/reference/policy-engine/`

| Tier | base 우선순위 | 위치 | 상태 |
|---|---|---|---|
| Default | 1 | Built-in | 항상 active |
| **Extension** | **2** | extension `policies/` | 항상 active |
| Workspace | 3 | `.gemini/policies/*.toml` | **현재 비활성화 — "Currently disabled"** |
| User | 4 | `~/.gemini/policies/*.toml` | 항상 active |
| Admin | 5 | 시스템 위치 + `--admin-policy` | 보안 체크 필요 |

> *"final_priority = tier_base + (toml_priority / 1000)"*

예: User tier `priority: 100` → 4.100, Admin tier `priority: 50` → 5.050 — 단순 비교 가능

### 7.2 Rule 필드 전체 (공식)

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `toolName` | string\|array | ✅ | 와일드카드: `*`, `mcp_server_*`, `mcp_*` |
| `decision` | string | ✅ | `allow` / `deny` / `ask_user` |
| `priority` | int | ✅ | 0–999 |
| `subagent` | string | ❌ | 특정 subagent에서만 적용 |
| `mcpName` | string | ❌ | MCP 서버 지정 (FQN 와일드카드보다 권장) |
| `toolAnnotations` | object | ❌ | tool metadata hint 매칭 |
| `argsPattern` | regex | ❌ | "tested against JSON-serialized arguments" |
| `commandPrefix` | string | ❌ | run_shell_command shorthand |
| `commandRegex` | regex | ❌ | run_shell_command shorthand. **commandPrefix와 함께 사용 금지** |
| `denyMessage` | string | ❌ | 사용자/모델에 반환되는 거부 메시지 |
| `modes` | array | ❌ | `default` / `autoEdit` / `plan` / `yolo` |
| `interactive` | bool | ❌ | true/false 환경 제한 |
| `allowRedirection` | bool | ❌ | shell redirect 허용 |

### 7.3 Extension Tier (Tier 2) 제약

> 출처: `/docs/extensions/reference/` §Policy Engine

> *"For security, Gemini CLI ignores any `allow` decisions or `yolo` mode configurations in extension policies. This ensures that an extension cannot automatically approve tool calls or bypass security measures without your confirmation."*

bkit은 이미 이 제약 준수 — `policies/bkit-extension-policy.toml` 확인:
- `decision = "deny"` 또는 `decision = "ask_user"`만 사용 ✅
- `priority` 50 / 100 사용

### 7.4 Admin Policy 시스템 위치

| OS | 경로 |
|---|---|
| Linux | `/etc/gemini-cli/policies` |
| macOS | `/Library/Application Support/GeminiCli/policies` |
| Windows | `C:\ProgramData\gemini-cli\policies` |

보충: `--admin-policy` CLI flag, `adminPolicyPaths` setting

⚠️ **시스템 디렉토리 소유권 체크 강제**: Linux/macOS는 root 소유 + group/others write 없음. **체크 실패 시 정책 무시**.

### 7.5 Safety Checker (Extension Tier 2 추가 기능)

> 출처: `/docs/extensions/reference/` §Policy Engine

```toml
[[safety_checker]]
mcpName = "my_server"
toolName = "write_data"
priority = 200
[safety_checker.checker]
type = "in-process"
name = "allowed-path"
required_context = ["environment"]
```

⚠️ **bkit 현재 미사용**. `[[safety_checker]]` TOML 블록은 정식 사양. **활용 기회 (P2)** — bkit이 MCP tool에 대해 추가 안전 체크 등록 가능.

### 7.6 bkit 현재 policies 매핑

bkit `policies/bkit-extension-policy.toml` 확보된 규칙 4건:

| toolName | commandPrefix | decision | priority |
|---|---|---|---|
| run_shell_command | rm -rf | deny | 100 |
| run_shell_command | git push --force | deny | 100 |
| run_shell_command | git reset --hard | ask_user | 50 |
| run_shell_command | rm -r | ask_user | 50 |

**갭 식별**:
- `subagent` 필드 미사용 — bkit 21 agents 안전 등급별 차별화 가능 (`bkit-server.js` SAFETY_TIERS와 매핑)
- `mcpName` 사용 안 함 — bkit MCP tools에 대한 추가 규칙 미존재
- `modes` 미사용 — Plan Mode에서 더 엄격한 규칙 필요할 수 있음
- `argsPattern` 미사용

---

## 8. Commands & Skills 시스템

### 8.1 TOML Custom Commands (공식)

> 출처: `/docs/cli/custom-commands/`

```toml
description = "Generates a Git commit message based on staged changes."
prompt = """Please generate...
```diff
!{git diff --staged}
```
"""
```

#### 필드

| 필드 | 타입 | 필수 |
|---|---|---|
| `prompt` | string | ✅ |
| `description` | string | ❌ (in `/help` menu) |

#### 위치 / Namespacing

- `~/.gemini/commands/` (글로벌)
- `<project-root>/.gemini/commands/` (프로젝트 — git 추적)
- Extension `commands/` (bkit이 사용)
- `test.toml` → `/test`
- `git/commit.toml` → `/git:commit` (colon namespacing)

#### Argument 처리 (4가지 메커니즘)

| 메커니즘 | 구문 | 동작 |
|---|---|---|
| Raw inject | `{{args}}` in prompt body | 원본 그대로 |
| Shell-escaped | `!{...}` block 안의 `{{args}}` | 자동 escape (injection 방지) |
| Shell exec | `!{command}` | 동적 shell 실행, **사용자 confirm 필수** |
| File inject | `@{path}` | 멀티모달 (이미지/PDF/audio/video) 지원 |

### 8.2 Skills 시스템 (공식 정의)

> 출처: `/docs/cli/skills/` raw

> *"Based on the [Agent Skills](https://agentskills.io) open standard, a 'skill' is a self-contained directory that packages instructions and assets into a discoverable capability."*

#### 5-Stage Lifecycle

1. **Discovery** — session start, name+description 시스템 prompt 주입
2. **Activation** — model이 description 매칭 시 `activate_skill` tool 호출
3. **Consent** — UI confirmation prompt (skill name, purpose, directory path)
4. **Injection** — `SKILL.md` body + 디렉토리 구조 conversation history에 추가, 디렉토리가 agent allowed paths에 추가
5. **Execution** — "instructed to prioritize the skill's procedural guidance within reason"

#### 4-Tier Discovery (precedence, 낮음 → 높음)

1. Built-in skills
2. Extension skills (bkit)
3. User: `~/.gemini/skills/` or `~/.agents/skills/`
4. Workspace: `.gemini/skills/` or `.agents/skills/` (`.agents/skills/`가 같은 tier에서 우선)

`.agents/skills/` alias는 **agentskills.io 표준 호환성**용.

#### SKILL.md 구조

```yaml
---
name: code-reviewer
description: Expertise in reviewing code changes for correctness, security, and style.
---
# Code Reviewer Instructions
You act as a senior software engineer...
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `name` | ✅ | "match the directory name" |
| `description` | ✅ | "CRITICAL... triggering keywords" |

⚠️ **공식 frontmatter는 오직 2필드** — `name`, `description`. subagent와 달리 `tools`, `model`, `temperature` 등은 frontmatter에 없음.

#### Progressive Disclosure (3-level)

> 출처: `/docs/cli/skills-best-practices/`

1. **Metadata** (~100 words, 항상 로드) — name + description
2. **SKILL.md body** (<5k words, trigger 후 로드)
3. **Bundled resources** (필요 시에만)

#### 디렉토리 구조

```
my-skill/
├── SKILL.md          (Required)
├── scripts/          (Optional, executable)
├── references/       (Optional, static docs)
└── assets/           (Optional, templates)
```

### 8.3 새 슬래시 명령 (v0.42.0+)

> 출처: `/docs/changelogs/latest/` (= v0.42.0)

| 명령 | PR | 동작 |
|---|---|---|
| `/commands list` | #22324 (Cx7) | "List available custom slash commands" |
| `/commands reload` | (existing) | reload custom commands |
| `/exit --delete` | #19332 (Cx6) | exit + 세션 삭제 |
| `/bug-memory` | #25639 (Cx4) | heap snapshot 자동 캡처 + bug report |
| `/agents refresh` | #26442 (Cx11) | improved logging |
| `/extensions delete` | #25660 (Cx8) | alias of `uninstall` |

추가 (v0.43.0-preview.0):
| 명령 | PR | 동작 |
|---|---|---|
| `/export-session <path>` | #26514 | session 파일로 export |
| (와 함께) `--session-file <path>` flag | #26514 | session 파일에서 import |

### 8.4 bkit Skills/Commands 호환성

bkit 현재 `skills/` 구성 (35+):
- `pdca/`, `phase-1-schema`, `phase-2-convention`, ..., `phase-9-deployment`
- `bkit-rules`, `bkit-templates`, `audit`, `batch`, `bkend-*`, `loop`, `desktop-app`, `mobile-app`, `pm-discovery`, `qa-phase`, `rollback`, `skill-create`, `skill-status`, ...

**확인 필요 (E축)**:
1. bkit skills `SKILL.md`의 frontmatter가 공식 schema (`name`, `description`)에 맞는지
2. `name` 필드가 디렉토리 이름과 정확히 일치하는지
3. `description`이 keyword-rich한지 (discovery 효과)
4. body가 5k word 이내인지 (progressive disclosure)

**갭**:
- bkit은 35개 phase + utility skills를 보유 — 이미 자산 가치 높음
- 단, frontmatter가 native schema에 맞지 않으면 discovery가 작동 안 함 가능성

bkit `commands/` 구성:
- 본 A축에서 직접 확인 안 됨 (디렉토리 비어있을 가능성 또는 TOML 구조 검증 필요 — E축)

---

## 9. v0.42.0 신규 주요 기능 (정밀 인용)

> 출처: `/docs/changelogs/latest/` (= v0.42.0 stable, 2026-05-12)

### 9.1 Highlights (공식 5개)

| # | Feature | 공식 인용 |
|---|---|---|
| H1 | Auto Memory Inbox | "new inbox flow for Auto Memory using a canonical-patch contract, enabling more robust and manageable skill extraction" |
| H2 | Gemma 4 Default | "Gemma 4 models are now enabled by default via the Gemini API" |
| H3 | Voice Mode Polish | "wave animations for visual feedback and privacy/compliance UX warnings specifically for the Gemini Live backend" |
| H4 | Session Management | "`--delete` flag to the `/exit` command for instant session deletion and introduced `/bug-memory` for easier heap diagnostics" |
| H5 | Improved Reliability | "Reduced default API timeouts to 60s and implemented retries for undici and premature stream closure errors" |

### 9.2 Breaking Changes / 행동 변화 (5건, v0.41.2 → v0.42.0 누적)

> 출처: 본 A축의 기존 v0.42.0-research.md §1.1 인용 + 본 cycle 재확인

| # | 변화 | PR | 영향 |
|---|---|---|---|
| Bx0 | `continueOnFailedApiCall` config 제거 + `"System: Please continue."` post-stream injection 제거 | #26340 | bkit 0건 사용 |
| Bx1 | core tools가 native `ToolDisplay` emit. legacy `returnDisplay` adapter deprecated | #25186 (부분 v0.42.0, v0.43.0-preview.0에서 추가 진행) | **bkit MCP tools 검증 필요** |
| Bx2 | `exit_plan_mode`를 `run_shell_command`로 호출 금지 | #26230 | Plan Mode 안전성 |
| Bx3 | `Config.setSessionId()` 호출 시 15+ session-scoped 상태 일괄 reset | #26342 | session resumption stale state |
| Bx4 | `experimental.gemma` default `false` → **`true`** | #26307 | Gemma 4 자동 활성 (모델 명시 시 무관) |

### 9.3 신규 기능 14건 (v0.41.2 → v0.42.0 누적, 정밀 PR)

> 출처: v0.42.0 release body raw 인용

| # | 기능 | PR | 본 sprint 활용 후보 |
|---|---|---|---|
| Cx1 | `--ignore-env` flag + `advanced.ignoreLocalEnv` setting | #26445 | **🟢 P1** — bkit headless CI 안정 |
| Cx2 | Auto Memory inbox flow (canonical-patch contract) | #26338 | **🟢 P0 활용 후보** — bkit 가이드 추가 |
| Cx3 | private patch allowlist tighten | #26535 | (v0.43.0-preview.0 only) |
| Cx4 | `/bug-memory` heap snapshot | #25639 | 🟢 P2 — bkit 디버그 |
| Cx5 | V8 heap snapshot utility | #26440 | 🟢 P3 |
| Cx6 | `/exit --delete` | #19332 | 🟢 P2 — bkit 세션 정리 |
| Cx7 | `/commands list` | #22324 | 🟢 P2 — bkit commands discoverability |
| Cx8 | `/extensions delete` alias | #25660 | 🟢 P3 |
| Cx10 | Voice mode privacy warning | #26454 | (bkit 무관) |
| Cx11 | `/agents refresh` 개선 | #26442 | 🟢 P2 — bkit agents 21 |
| Cx12 | Inquiry 제약 강화 | #26310 | 🟢 P2 |
| Cx13 | Gemma 4 default-on (Bx4 짝) | #26307 | (모델 명시 시 무관) |
| Cx14 | `--prompt` (-p) flag **undeprecated** | #26329 | **🟢 P0** — bkit 자동화 적극 활용 |

### 9.4 `gemini gemma` 서브커맨드

> 출처: `/docs/cli/model-routing/` + v0.42.0 PR #26233 *"docs(core): add automated gemma setup guide"*

> *"The easiest way to set this up is using the automated `gemini gemma setup` command."*

용도: Local Gemma model router 자동 설정 (LiteRT-LM shim). bkit 무관 (CI/headless 사용).

### 9.5 `--session-id` flag (Bx3 짝)

> 출처: v0.41.0 PR #26060 *"feat(cli): provide manual session UUID via command line arg"*

→ **사실은 v0.41.0에 도입됨** (v0.42.0 아님). v0.42.0의 Bx3 (#26342)는 setSessionId의 *내부 state reset 강화*.

bkit 활용: `--session-id <uuid>` flag로 deterministic session 운용 가능. **P1 활용 후보**.

---

## 10. v0.43.0-preview.0 시그널 (다음 cycle 방향성)

> 출처: `/docs/changelogs/preview/` (= v0.43.0-preview.0, 2026-05-12 22:25 UTC)

### 10.1 Highlights (공식 5개)

> *"Surgical Code Edits ... Session Portability ... Enhanced Security ... Context Management ... UX Improvements"*

### 10.2 핵심 신기능 정밀 인용

| # | PR | 인용 | bkit 활용 후보 |
|---|---|---|---|
| Dx1 | #26480 | "steer model to use edit tool for surgical edits" | 🟢 P2 — 자동 적용 |
| Dx2 | #26514 | "export session to file and import via flag" | **🟢 P0** — bkit 자동화 결정적 활용 가능 |
| Dx3 | #25637 | "Add Machine Hostname to CLI interface" | 🟢 P3 |
| Dx4 | #25302 | "add LocalSubagentProtocol behind AgentProtocol" | **🟡 P1** — bkit 21 agents 호환성 검증 |
| Dx5 | #25303 | "add RemoteSubagentProtocol behind AgentProtocol" | 🟡 P2 — bkit remote agents 미사용 |
| Dx6 | #26676 | "prefix tool call IDs with tool names" (ACP) | 🟢 P3 — ACP 미사용 |
| Dx7 | #26655 | "Improvements to the snapshotter" (context) | 🟢 P2 |
| Dx8 | #26888 | "Introduce adaptive token calculator to more accurately calculate content sizes" | **🟢 P1** — bkit baseline runner 토큰 정확성 |
| Dx9 | #26528 | "add shell command safety evals" | 🟢 P3 — 테스트만 |
| Dx10 | #26661 | "agent session protocol changes" (refactor) | 🟡 P1 — bkit agent 호환성 |
| Dx11 | #26934 | "introduce SubagentState enum for progress" (refactor) | 🟡 P2 |
| Dx12 | #26717 | "Incremental refactor repo agent towards skills-based composition" | **🟢 P0** — bkit skills 전략과 정합 |
| Dx13 | #26879 | "Exclude extension context from skill extraction agent" | 🟡 P1 — bkit이 추출 영향받지 않도록 보호 |
| Dx14 | #26929 | "Enable NumericalRouter when using dynamic model configs" | 🟢 P2 |

### 10.3 v0.42.0 미포함 → v0.43.0-preview.0 포함 핵심 fix

| PR | fix | bkit 영향 |
|---|---|---|
| #25827 | SessionStart duplicate systemMessage fix | bkit 워크어라운드 자연 해소 — v0.43.0 stable 대기 |
| #26534 | chat corruption in context manager | bkit context 안정성 |
| #26452 | hysteresis in async context management | bkit baseline runner 안정성 |
| #26571 | OAuth headless Linux silent hang | bkit CI/headless OAuth |
| #25186 | ToolDisplay migration 추가 진행 | bkit MCP tools 검증 |

### 10.4 방향성 시사 (5축)

| 라인 | PRs | bkit 의미 |
|---|---|---|
| Subagent Protocol abstraction | #25302/#25303/#26661/#26934 | bkit 21 agents → native subagent로 점진 통합 |
| Skills-based composition | #26717/#26879 | bkit 35 skills → repo agent skills로 노출 가능성 |
| Context management | #26655/#26888/#26534/#26452 | bkit baseline runner 안정성/정확성 향상 |
| Session persistence | #26514 | bkit 자동화 / replay capability |
| Surgical edits | #26480 | bkit code-analyzer agent 협조 |

---

## 11. bkit v2.0.7-upgrade 채택 가능한 신기능 우선순위 리스트

본 sprint 안에 실제 채택 가능한 신기능을 **활용/고도화 방향**으로 prioritize (사용자 명시 방향).

### 11.1 P0 — 본 sprint 핵심 채택 후보 (5건)

| # | 항목 | 공식 근거 | bkit 활용 시나리오 | 작업 추정 |
|---|---|---|---|---|
| **P0-1** | **`--prompt` undeprecated 적극 활용** | v0.42.0 PR #26329 (Cx14) | bkit 자동화 시나리오 (PDCA Do 단계, QA Run, baseline runner)에서 `gemini -p` 명령 1급 시민화. headless CI 안정. | S |
| **P0-2** | **GEMINI_SYSTEM_MD firmware 도입** | `/docs/cli/system-prompt/` | bkit이 시스템 prompt를 명시 관리 (`system.md`) + GEMINI.md는 strategy로 분리. `${AgentSkills}` `${SubAgents}` 변수 치환 활용. | M |
| **P0-3** | **bkit 21 agents → native `agents/*.md` 등록 검증** | `/docs/core/subagents/` + `/docs/extensions/reference/` §Sub-agents | bkit `agents/*.md` 21개 frontmatter를 공식 schema (`name`, `description`, `kind`, `tools`, `model`, `temperature`, `max_turns`, `timeout_mins`)에 정합. `@agent-name` 직접 호출 + description-based 자동 위임. | M |
| **P0-4** | **`/export-session` + `--session-file` 통합** | v0.43.0-preview.0 PR #26514 (Dx2) | bkit baseline runner / 자동화에서 deterministic replay capability. PDCA cycle 산출물에 session.json 첨부. | S (v0.43.0 stable 출시 대기 후 곧바로) |
| **P0-5** | **Auto Memory inbox 가이드 작성** | `/docs/cli/auto-memory/` + v0.42.0 PR #26338 (Cx2) | bkit 사용자가 `experimental.autoMemory: true` 활성화한 경우, `/memory inbox` 흐름과 bkit PDCA 워크플로 통합 가이드. `.geminiignore`에 `<projectMemoryDir>/.inbox/` 추가. project GEMINI.md 자동 패치 안 됨을 명시. | S |

### 11.2 P1 — 본 sprint 또는 다음 cycle 채택 후보 (5건)

| # | 항목 | 공식 근거 | bkit 활용 시나리오 | 작업 추정 |
|---|---|---|---|---|
| **P1-1** | **`--ignore-env` + `advanced.ignoreLocalEnv` CI 안정화** | v0.42.0 PR #26445 (Cx1) | bkit baseline runner / CI에서 `.env` 누설 방지. headless mode와 결합. | XS |
| **P1-2** | **`--session-id <uuid>` deterministic session** | v0.41.0 PR #26060 | bkit PDCA cycle 별 session UUID 사전 할당, 추적/audit/replay. | S |
| **P1-3** | **Policy Engine 고도화** (subagent, mcpName, modes, argsPattern) | `/docs/reference/policy-engine/` | bkit-extension-policy.toml에 (1) subagent별 차별화, (2) bkit MCP tools 명시 보호, (3) Plan Mode strict, (4) commit message regex 등 확장. `[[safety_checker]]` 블록 도입. | M |
| **P1-4** | **adaptive token calculator 인지** | v0.43.0-preview.0 PR #26888 (Dx8) | bkit baseline runner의 context 한계 계산을 native calculator로 위임. v0.43.0 stable 출시 대기. | S |
| **P1-5** | **Subagent Protocol 호환성 사전 검증** | v0.43.0-preview.0 PR #25302/#25303 (Dx4/Dx5) | bkit 21 agents가 LocalSubagentProtocol에 호환되는지 사전 테스트. 회귀 위험 사전 차단. | M |

### 11.3 P2 — 차차차 (5건)

| # | 항목 | 공식 근거 | 활용 시나리오 |
|---|---|---|---|
| **P2-1** | `/commands list` + `/agents refresh` + `/exit --delete` 사용자 가이드 | v0.42.0 PR #22324/#26442/#19332 | bkit 사용자에게 discoverability + housekeeping 안내 |
| **P2-2** | `Notification` hook 도입 | `/docs/hooks/reference/` §Notification | bkit-server에 tool permission 요청 로깅 → observability 강화 |
| **P2-3** | `/bug-memory` heap snapshot | v0.42.0 PR #25639 | bkit 큰 세션에서 OOM 디버그 |
| **P2-4** | Extension `safety_checker` TOML 블록 | `/docs/extensions/reference/` §Policy Engine | bkit MCP tools에 추가 안전 체크 등록 |
| **P2-5** | `experimental.modelSteering` 인지 + bkit 통합 검토 | `/docs/cli/model-steering/` | bkit Plan Mode workflow에서 model steering 활용 가능성 |

### 11.4 P3 — 인지만, 채택 보류 (4건)

| # | 항목 | 보류 이유 |
|---|---|---|
| **P3-1** | MCP resources tools (`@server://resource/path`) | bkit 현재 tool-only 접근으로 충분. 마이그레이션 비용 > 수익 |
| **P3-2** | `migratedTo` 필드 | bkit repo 이전 계획 없음 |
| **P3-3** | `gemini gemma setup` | bkit이 local Gemma router 사용 안 함 |
| **P3-4** | Themes | bkit 미사용 |

### 11.5 N0 — 차단/회피 결정 폐기 (직전 sprint의 "차단/회피" 방향 재평가)

> 사용자 평가 반영: 직전 sprint에서 일부 기능을 *차단하거나 회피*한 결정은 본 sprint에서 재평가 후 *활용*으로 전환.

| 직전 결정 | 본 sprint 권고 |
|---|---|
| `experimental.autoMemory: false` 잠금 | **재평가**: bkit이 강제로 false 잠그는 정책 폐기. 사용자 결정에 위임 + 통합 가이드 작성 (P0-5) |
| ToolDisplay 미사용 | **재평가**: v0.43.0 stable 출시 후 bkit MCP tools를 native ToolDisplay emit으로 마이그레이션 (P1 후보, sprint 외) |
| Subagent native 미등록 | **즉시 활용**: bkit 21 agents를 native `agents/*.md`로 등록 검증 (P0-3) |
| `--prompt` 사용 자제 | **즉시 활용**: undeprecated 후 1급 시민화 (P0-1) |
| 강제 GEMINI_SYSTEM_MD 미사용 | **신규 활용**: firmware 패턴 도입 (P0-2) |

---

## 12. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|---|---|---|
| Context Engineering 가이드 (3-tier, memport, GEMINI_SYSTEM_MD) | ⬛⬛⬛⬛⬛ | 공식 .md raw 직접 인용 |
| Auto Memory + memory inbox + canonical patch | ⬛⬛⬛⬛⬛ | auto-memory.md 전문 + settings.md `autoMemory` 설명 + v0.42.0 changelog 3중 |
| Subagents native spec | ⬛⬛⬛⬛⬛ | subagents.md frontmatter table 직접 |
| Hooks 11 lifecycle + I/O | ⬛⬛⬛⬛⬛ | hooks/reference.md + writing-hooks.md + best-practices.md 3중 |
| Tools + ToolDisplay | ⬛⬛⬛⬜⬜ | ToolDisplay 별도 공식 페이지 없음, PR 인용만 |
| Extensions 7 컴포넌트 + gemini-extension.json | ⬛⬛⬛⬛⬛ | extensions/reference.md raw 전문 |
| Policy Engine 4-tier | ⬛⬛⬛⬛⬛ | reference/policy-engine raw |
| Commands & Skills | ⬛⬛⬛⬛⬜ | SKILL.md frontmatter 추가 필드 (optional) 미확인 — 향후 docs/release에서 등장 가능 |
| v0.42.0 신규 14건 | ⬛⬛⬛⬛⬛ | changelogs/latest.md raw 전문 인용 |
| v0.43.0-preview.0 시그널 | ⬛⬛⬛⬛⬜ | changelogs/preview.md raw 전문 — PR 본문은 미접근 |
| bkit 현재 상태 매핑 | ⬛⬛⬛⬜⬜ | 5개 핵심 파일 직접 확보 (`gemini-extension.json`, `hooks/hooks.json`, `policies/bkit-extension-policy.toml`, `mcp/bkit-server.js` 일부, 디렉토리 ls). 세밀한 frontmatter 검증은 E축 위임 |
| 활용 우선순위 P0/P1/P2/P3 | ⬛⬛⬛⬛⬜ | 본 A축 발견 + bkit 현재 상태 정합. 최종 결정은 master plan에서 5축 통합 후 |

---

## 13. 본 A축 한계 / 미해결

1. **함수 export 스타일 RuntimeHook SDK는 공식 문서에 documented 안 됨** — bkit `lib/gemini/hooks.js`의 내부 wrapping 메커니즘은 비공식 가능성. C축(소스) / E축(코드)에서 확인 필요
2. **`LocalSubagentInvocation` / `LocalSubagentProtocol` 정식 페이지 없음** — v0.43.0-preview.0 PR #25302/#25303의 implementation detail. C축 PR 본문 직접 인용 필요
3. **memoryV2 정식 명칭/스펙 미정의** — v0.43.0-preview.0 PR #26605에서 등장한 내부 flag. 향후 공식 페이지 신설 가능성
4. **bkit `commands/` 디렉토리 내용 직접 확인 안 됨** — E축 또는 후속 grep 위임
5. **bkit `agents/*.md` 21개 frontmatter 정합성 검증** — E축 위임. **P0-3 우선순위 작업의 필수 선결 사항**
6. **bkit `skills/*/SKILL.md` 35개 frontmatter 검증** — E축 위임
7. **`mcp/bkit-server.js` 실제 노출 tool 수 (6 또는 11+)** — E축 코드 grep 필요
8. **bkit Policy Engine vs settings `tools.exclude` legacy 마이그레이션 검증** — bkit은 이미 Tier 2 TOML 사용. legacy `excludeTools` 잔존 없음 확인 필요 (E축)
9. **v0.41.x 누적 변경의 추가 메이저 사항** — 본 A축은 v0.42.0/v0.43.0 highlights 중심. v0.41.0 PR #25720 (`tools.core` allowlist), PR #25604 (Gemma 4 experimental introduction), PR #24174 (Voice Mode initial introduction) 같은 v0.41.0 항목들이 별도 분석 필요

---

## 14. 원문 참조 링크 (절대 URL)

### 14.1 공식 문서 사이트 (geminicli.com/docs/)

- 메인: https://geminicli.com/docs/
- Context: https://geminicli.com/docs/cli/gemini-md/
- Auto Memory: https://geminicli.com/docs/cli/auto-memory/
- Memory tutorial: https://geminicli.com/docs/cli/tutorials/memory-management/
- Skills: https://geminicli.com/docs/cli/skills/
- Creating Skills: https://geminicli.com/docs/cli/creating-skills/
- Skills Best Practices: https://geminicli.com/docs/cli/skills-best-practices/
- Skills Getting Started: https://geminicli.com/docs/cli/tutorials/skills-getting-started/
- Subagents: https://geminicli.com/docs/core/subagents/
- Remote Subagents: https://geminicli.com/docs/core/remote-agents/
- Hooks: https://geminicli.com/docs/hooks/
- Hooks Reference: https://geminicli.com/docs/hooks/reference/
- Writing Hooks: https://geminicli.com/docs/hooks/writing-hooks/
- Hooks Best Practices: https://geminicli.com/docs/hooks/best-practices/
- Extensions: https://geminicli.com/docs/extensions/
- Writing Extensions: https://geminicli.com/docs/extensions/writing-extensions/
- Extensions Reference: https://geminicli.com/docs/extensions/reference/
- Custom Commands: https://geminicli.com/docs/cli/custom-commands/
- Plan Mode: https://geminicli.com/docs/cli/plan-mode/
- Plan Mode Steering Tutorial: https://geminicli.com/docs/cli/tutorials/plan-mode-steering/
- Model Steering: https://geminicli.com/docs/cli/model-steering/
- Model Routing: https://geminicli.com/docs/cli/model-routing/
- Headless: https://geminicli.com/docs/cli/headless/
- System Prompt Override: https://geminicli.com/docs/cli/system-prompt/
- Settings: https://geminicli.com/docs/cli/settings/
- Session Management: https://geminicli.com/docs/cli/session-management/
- CLI Reference: https://geminicli.com/docs/cli/cli-reference/
- Configuration Reference: https://geminicli.com/docs/reference/configuration/
- Commands Reference: https://geminicli.com/docs/reference/commands/
- Policy Engine Reference: https://geminicli.com/docs/reference/policy-engine/
- Memport: https://geminicli.com/docs/reference/memport/
- MCP Server: https://geminicli.com/docs/tools/mcp-server/

### 14.2 GitHub Releases (모두 직접 인용)

- v0.39.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.1
- v0.40.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.0
- v0.40.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.40.1
- v0.41.0: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.0
- v0.41.1: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.1
- v0.41.2: https://github.com/google-gemini/gemini-cli/releases/tag/v0.41.2
- **v0.42.0** (stable target): https://github.com/google-gemini/gemini-cli/releases/tag/v0.42.0
- **v0.43.0-preview.0** (next signal): https://github.com/google-gemini/gemini-cli/releases/tag/v0.43.0-preview.0

### 14.3 GitHub Repo

- Repo: https://github.com/google-gemini/gemini-cli
- ROADMAP.md (no concrete items, GitHub Projects link only): https://github.com/google-gemini/gemini-cli/blob/main/ROADMAP.md
- docs/changelogs/latest.md (raw v0.42.0): https://github.com/google-gemini/gemini-cli/blob/main/docs/changelogs/latest.md
- docs/changelogs/preview.md (raw v0.43.0-preview.0): https://github.com/google-gemini/gemini-cli/blob/main/docs/changelogs/preview.md
- docs/cli/auto-memory.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/auto-memory.md
- docs/cli/system-prompt.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/system-prompt.md
- docs/cli/skills.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/skills.md
- docs/cli/cli-reference.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/cli-reference.md
- docs/cli/session-management.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/session-management.md
- docs/cli/headless.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/headless.md
- docs/cli/model-routing.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/model-routing.md
- docs/hooks/writing-hooks.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/writing-hooks.md
- docs/hooks/best-practices.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md
- docs/extensions/reference.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/extensions/reference.md
- docs/extensions/writing-extensions.md (raw): https://github.com/google-gemini/gemini-cli/blob/main/docs/extensions/writing-extensions.md

### 14.4 핵심 PR 직접 링크 (본 A축에서 인용)

| PR | 제목 |
|---|---|
| #25147 | require recurrence evidence before extracting skills (v0.40.0) |
| #25186 | refactor: migrate core tools to native ToolDisplay (v0.43.0-preview.0) |
| #25302 | feat(core): add LocalSubagentProtocol behind AgentProtocol (v0.43.0-preview.0) |
| #25303 | feat(core): add RemoteSubagentProtocol behind AgentProtocol (v0.43.0-preview.0) |
| #25395 | feat(core): add tools to list and read MCP resources (v0.40.0) |
| #25420 | chore(release): bump version (v0.40.0) |
| #25601 | feat(config): split memoryManager flag into autoMemory (v0.40.0) |
| #25604 | feat(core,cli): add support for Gemma 4 models experimental (v0.41.0) |
| #25637 | Feat: Add Machine Hostname to CLI interface (v0.43.0-preview.0) |
| #25720 | feat(core): enhance shell command validation and add core tools allowlist (v0.41.0) |
| #25814 | feat(cli): secure .env loading and enforce workspace trust in headless mode (v0.41.0) |
| #25827 | fix(cli): prevent duplicate SessionStart systemMessage render (v0.43.0-preview.0) |
| #25888 | feat(repo): add gemini-cli-bot metrics and workflows (v0.41.0) |
| #26060 | feat(cli): provide manual session UUID via command line arg (v0.41.0, `--session-id`) |
| #26092 | fix(cli): handle DECKPAM keypad Enter sequences (v0.42.0) |
| #26132 | fix(cli): prevent automatic updates from switching to less stable channels (v0.42.0) |
| #26136 | fix(core): disconnect extension-backed MCP clients in stopExtension (v0.42.0) |
| #26141 | fix(core): add missing oauth fields support in subagent parsing (v0.42.0) |
| #26143 | refactor(acp): modularize monolithic acpClient (v0.42.0) |
| #26191 | fix(core): reduce default API timeout to 60s and enable retries for undici timeouts (v0.42.0) |
| #26198 | fix(core): add explicit empty log guard in A2A pushMessage (v0.42.0) |
| #26218 | fix(cli): handle InvalidStream event gracefully (v0.42.0) |
| #26230 | fix(agent): prevent exit_plan_mode from being called via shell (v0.42.0) |
| #26233 | docs(core): add automated gemma setup guide (v0.42.0) |
| #26261 | Skip binary CLI relaunch (v0.42.0) |
| #26264 | fix(cli): prevent informational logs from polluting json output (v0.42.0) |
| #26285 | fix(cli): use resolved sandbox state for auto-update check (v0.42.0) |
| #26307 | feat(config): enable Gemma 4 models by default via Gemini API (v0.42.0) |
| #26329 | fix(cli): undeprecate --prompt and correct positional query docs (v0.42.0) |
| #26330 | (branch indicator git worktree fix) (v0.42.0) |
| #26338 | Auto Memory inbox flow with canonical-patch contract (v0.42.0) |
| #26340 | fix(core): remove "System: Please continue." injection on InvalidStream events (v0.42.0) |
| #26342 | fix(core): reset session-scoped state on resumption (v0.42.0) |
| #26440 | V8 heap snapshot utility (v0.42.0) |
| #26442 | /agents refresh improved logging (v0.42.0) |
| #26443 | perf: skip redundant GEMINI.md loading in partialConfig (v0.42.0) |
| #26445 | --ignore-env flag + advanced.ignoreLocalEnv (v0.42.0) |
| #26452 | fix(core): Fix hysteresis in async context management pipelines (v0.43.0-preview.0) |
| #26454 | Voice mode privacy/compliance UX warning (v0.42.0) |
| #26480 | feat(core): steer model to use edit tool for surgical edits (v0.43.0-preview.0) |
| #26506 | queuing messages during compression (v0.43.0-preview.0 or later) |
| #26514 | feat: export session to file and import via flag (v0.43.0-preview.0) |
| #26528 | feat(evals): add shell command safety evals (v0.43.0-preview.0) |
| #26534 | fix(core): chat corruption bug in context manager (v0.43.0-preview.0) |
| #26535 | Tighten private Auto Memory patch allowlist (v0.43.0-preview.0) |
| #26568 | fix(a2a-server): race condition in tool completion waiting (v0.41.2) |
| #26571 | fix(core): prevent silent hang during OAuth auth on headless Linux (v0.43.0-preview.0) |
| #26595 | docs(extensions): refactor releasing guide and add update mechanisms (v0.43.0-preview.0) |
| #26655 | feat(context): Improvements to the snapshotter (v0.43.0-preview.0) |
| #26661 | refactor(core): agent session protocol changes (v0.43.0-preview.0) |
| #26676 | feat(acp/core): prefix tool call IDs with tool names (v0.43.0-preview.0) |
| #26717 | Incremental refactor repo agent towards skills-based composition (v0.43.0-preview.0) |
| #26879 | Exclude extension context from skill extraction agent (v0.43.0-preview.0) |
| #26888 | feat(context): Introduce adaptive token calculator (v0.43.0-preview.0) |
| #26929 | Enable NumericalRouter when using dynamic model configs (v0.43.0-preview.0) |
| #26934 | refactor(core): introduce SubagentState enum for progress (v0.43.0-preview.0) |

### 14.5 본 cycle baseline 산출물 (재인용)

- v0.42.0 stable research: `docs/01-plan/research/gemini-cli-v0.42.0-research.md` (~417 lines)
- v0.42.0 preview research: `docs/01-plan/research/gemini-cli-v0.42.0-preview-research.md` (~390 lines)
- v0.41.2 research: `docs/01-plan/research/gemini-cli-v0.41.2-research.md` (387 lines)
- v0.41.1 research: `docs/01-plan/research/gemini-cli-v0.41.1-research.md`
- v0.40.0 research: `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (~28KB)
- v0.39.1 research: `docs/01-plan/research/gemini-cli-v0.39.1-research.md`

---

**조사 완료**: 2026-05-14. master plan으로 전달.

**한 줄 요약**: Gemini CLI는 GEMINI.md 3-tier + Skills progressive disclosure + Auto Memory inbox(canonical patch) + 11 hooks + Subagents (LocalSubagentProtocol v0.43.0-preview)의 **5축 컨텍스트 시스템**으로 진화 중. bkit이 *차단/회피* 결정한 항목들 (autoMemory false 잠금, --prompt 자제, ToolDisplay 미사용, native subagent 미등록, GEMINI_SYSTEM_MD 미사용) 5건을 **활용/고도화 방향으로 전환** 권고. P0 채택 후보 5건 (`--prompt` 활용, `GEMINI_SYSTEM_MD` firmware, agents native 등록 검증, `/export-session` 통합, Auto Memory inbox 가이드).

# Gemini CLI Interactive Test Guide: bkit-gemini v1.5.4

> **Feature**: bkit-v154-gemini-test
> **Version**: 1.5.4
> **Total Test Cases**: 204
> **Objective**: 100% Verification of Extension Features

---

## TC-01: Session Startup & Hook System (18 Cases)

| TC-ID | Prompt / Action | Expected Result |
|-------|-----------------|-----------------|
| 01-01 | Start new session | "bkit Vibecoding Kit v1.5.4 - Session Startup" displayed |
| 01-02 | Check start output | Previous Work, CTO-Led Teams, Output Styles sections visible |
| 01-03 | Any message | BeforeAgent (Intent Detection) hook executed |
| 01-04 | Any message | BeforeModel hook executed |
| 01-05 | Any message | AfterModel hook executed |
| 01-06 | Tool required message | BeforeToolSelection hook executed |
| 01-07 | "test.txt 만들어줘" | BeforeTool (write_file) hook executed |
| 01-08 | "test.txt 수정해줘" | BeforeTool (replace) hook executed |
| 01-09 | "git status 실행해줘"| BeforeTool (run_shell_command) hook executed |
| 01-10 | Post-write_file | AfterTool (write_file) hook executed |
| 01-11 | Post-run_shell_command | AfterTool (run_shell_command) hook executed |
| 01-12 | "/pdca status" | AfterTool (activate_skill) hook executed |
| 01-13 | Post-agent work | AfterAgent (cleanup) hook executed |
| 01-14 | Long conversation | PreCompress (context-save) hook executed |
| 01-15 | exit/quit | SessionEnd (cleanup) hook executed |
| 01-16 | "/pdca plan test" | pdca-plan-post.js hook executed |
| 01-17 | "/pdca design test"| pdca-design-post.js hook executed |
| 01-18 | `read_file hooks/hooks.json` | 10 events registered correctly |

## TC-02: Skill System (29 Cases)

| TC-ID | Prompt / Command | Expected Result |
|-------|------------------|-----------------|
| 02-01 | /pdca status | PDCA Status with primaryFeature shown |
| 02-02 | /pdca plan test-feat | Plan doc created in docs/01-plan/ |
| 02-03 | /pdca design test-feat | Design doc created in docs/02-design/ |
| 02-04 | /pdca do test-feat | Implementation guide displayed |
| 02-05 | /pdca analyze test-feat | Gap detector agent called |
| 02-06 | /pdca iterate test-feat | PDCA iterator agent called |
| 02-07 | /pdca report test-feat | Completion report generated |
| 02-08 | /pdca next | Next phase recommendation |
| 02-09 | /starter | Starter level guide shown |
| 02-10 | /dynamic | Dynamic level guide (bkend.ai) shown |
| 02-11 | /enterprise | Enterprise level guide shown |
| 02-12 | "스키마 정의해줘" | Phase 1 Schema skill activated |
| 02-13 | "코딩 컨벤션 설정" | Phase 2 Convention skill activated |
| 02-14 | "목업 만들어줘" | Phase 3 Mockup skill activated |
| 02-15 | "API 설계해줘" | Phase 4 API skill activated |
| 02-16 | "디자인 시스템" | Phase 5 Design System skill activated |
| 02-17 | "UI 구현해줘" | Phase 6 UI Integration skill activated |
| 02-18 | "SEO 최적화" | Phase 7 SEO/Security skill activated |
| 02-19 | "코드 리뷰해줘" | Phase 8 Review skill activated |
| 02-20 | "배포해줘" | Phase 9 Deployment skill activated |
| 02-21 | /code-review | Code review skill activated |
| 02-22 | /zero-script-qa | Zero Script QA methodology guide |
| 02-23 | /development-pipeline | 9-phase pipeline guide |
| 02-24 | /bkit | Full bkit feature list |
| 02-25 | "모바일 앱" | Mobile app skill (React Native/Flutter) |
| 02-26 | "데스크톱 앱" | Desktop app skill (Electron/Tauri) |
| 02-27 | /learn | Gemini CLI learning guide |
| 02-28 | /bkit-templates | PDCA templates loading |
| 02-29 | /bkit-rules | bkit core rules display |

## TC-03: Agent System (32 Cases)

| TC-ID | Prompt / Trigger | Expected Agent |
|-------|------------------|----------------|
| 03-01 | "팀 구성 프로젝트" | cto-lead |
| 03-02 | "코드 품질 분석" | code-analyzer |
| 03-03 | "설계 문서 검증" | design-validator |
| 03-04 | "마이크로서비스 설계"| enterprise-expert |
| 03-05 | "프론트엔드 설계" | frontend-architect |
| 03-06 | "갭 분석해줘" | gap-detector |
| 03-07 | "AWS 인프라 설계" | infra-architect |
| 03-08 | "테스트 전략 수립" | qa-strategist |
| 03-09 | "보안 취약점 분석" | security-architect |
| 03-10 | "bkend 로그인 구현" | bkend-expert |
| 03-11 | "자동으로 개선해줘" | pdca-iterator |
| 03-12 | "뭐부터 시작해?" | pipeline-guide |
| 03-13 | "요구사항 정의해줘" | product-manager |
| 03-14 | "docker logs 분석" | qa-monitor |
| 03-15 | "완료 보고서 생성" | report-generator |
| 03-16 | "초보자인데 도와줘" | starter-guide |
| 03-17~32 | frontmatter check | All 16 agents metadata verification |

## TC-04: Lib Modules (22 Cases)

| TC-ID | Library / Feature | Verification Point |
|-------|-------------------|--------------------|
| 04-01 | tool-registry.js | 17 BUILTIN_TOOLS correctly defined |
| 04-02 | tool-registry.js | 5 FORWARD_ALIASES present |
| 04-03 | tool-registry.js | 14 CLAUDE_TO_GEMINI_MAP entries |
| 04-04 | version-detector.js | 7 exported functions present |
| 04-05 | version-detector.js | 3-Strategy detection logic |
| 04-06 | version-detector.js | 7 Feature Flags thresholds |
| 04-07 | policy-migrator.js | ask->ask_user, allow->allow mapping |
| 04-08 | policy-migrator.js | Priority mapping (deny=100) |
| 04-09 | permission.js | Policy Engine bypass logic |
| 04-10 | permission.js | 11 exported functions present |
| 04-11 | common.js | Shared utility functions |
| 04-12 | config.js | Configuration loading and validation |
| 04-13~22 | Integration | Inter-module communication verification |

## TC-05: MCP Server (8 Cases)

| TC-ID | MCP Tool / Feature | Verification Point |
|-------|-------------------|--------------------|
| 05-01 | spawn-agent-server | Server version 1.1.0 |
| 05-02 | spawn-agent-server | 16 agents registered in AGENTS map |
| 05-03 | spawn-agent-server | handleInitialize capability registration |
| 05-04 | spawn_agent tool | input schema validation (agent_name, task) |
| 05-05 | spawn_agent tool | output markdown generation logic |
| 05-06 | spawn_agent tool | recommendedModel selection logic |
| 05-07 | Error handling | Missing agent error response |
| 05-08 | Performance | MCP response under 2000ms |

## TC-06: TOML Commands (18 Cases)

- [ ] All 18 TOML files in `commands/` directory parsed correctly.
- [ ] description fields present and accurate.
- [ ] @skills paths resolve to existing SKILL.md files.

## TC-07: Configuration (12 Cases)

- [ ] Version 1.5.4 consistency across all 12 locations.
- [ ] bkit.config.json structure validation.
- [ ] gemini-extension.json structure validation.
- [ ] compatibility settings check.

## TC-08: Context Engineering (8 Cases)

- [ ] 6 context files in `.gemini/context/` loaded correctly.
- [ ] @import chains in GEMINI.md verified.
- [ ] All rules and triggers from context files reflected in agent behavior.

## TC-09: v1.5.4 New Features (12 Cases)

- [ ] Version Detection System (Strategy 1-3).
- [ ] Policy Engine Migration (Ask to Ask_User).
- [ ] Forward Alias Defense Layer (edit_file -> replace).
- [ ] Compatibility Configuration.

## TC-10: PDCA End-to-End (10 Cases)

- [ ] Full Cycle: Plan -> Design -> Do -> Check -> Act -> Report -> Archive.

---
*bkit v1.5.4 Interactive Test Suite*

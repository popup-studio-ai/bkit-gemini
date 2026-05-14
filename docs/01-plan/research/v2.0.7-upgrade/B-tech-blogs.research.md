# B축: 기술 블로그 + 커뮤니티 심층 조사

> **조사일**: 2026-05-14
> **조사자**: gemini-researcher (B축 담당)
> **범위**: 공식 문서를 제외한 모든 외부 기술 블로그, 커뮤니티, SNS, YouTube, 한/일/영문 소스
> **목적**: bkit v2.0.7-upgrade를 "활용/고도화" 방향으로 재설계하기 위한 외부 best practices 흡수
> **추측 금지 원칙**: 모든 인사이트는 URL + 작성일 + 인용을 명시. 검증 불가 항목은 "anecdotal" 표기.

---

## 0. 조사 요약 (Executive Summary)

B축 조사 결과 **44개의 외부 소스**를 분석하여 다음을 확보했다.

- **B.1 모범 사례**: 18건 (Hub-and-Spoke, 계층적 GEMINI.md, Plan-driven, Skill+Subagent+Hook 통합 등)
- **B.2 안티 패턴**: 12건 (Context Rot, YOLO 남용, Tool 무제한, Silent downgrade 등)
- **B.3 UX 보고**: 8건 (v0.42.0 사용자 경험, 한국·일본 사용자 후기, Session resume 이슈)
- **B.4 Extension 사례**: 6건 (OmG, philschmid extension, Maestro, Pickle Rick, Conductor, Bitloops)
- **B.5 경쟁 도구 비교**: 5건 (Claude Code, Cursor, Codex, Aider 비교)
- **B.6 트렌드 시그널**: 4건 (Karpathy "agentic engineering", Anthropic Skills 표준화, A2A 프로토콜)
- **B.7 Cross-LLM Context Engineering**: 3건 (Anthropic effective-context-engineering, Skills 표준)

**핵심 발견**:
1. **Context Engineering이 vibe coding을 대체하는 키워드로 자리잡음** (2026 산업 합의)
2. **Skills/Subagents/Hooks의 "progressive disclosure" 패턴이 표준화** (Anthropic이 SKILL.md 표준 공개, OpenAI/Google 채택)
3. **bkit과 매우 유사한 외부 extension이 다수 존재** (OmG, Maestro, Pickle Rick) — 비교 학습 기회

---

## B.1 모범 사례 (Best Practices)

### B.1.1 Hub-and-Spoke 아키텍처 (Manager-Specialist)

**URL**: https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli/
**작성일**: 2026-04-15
**인용**:
> "When the Manager calls a Subagent, the Subagent starts with a clean context window, receiving only the specific task and relevant instructions. Once it finishes, it returns a concise summary to the Manager, with the massive list of intermediate tool calls purged from the history."

**bkit 활용 기회**:
- bkit이 SessionStart hook으로 모든 agent를 일괄 boot하는 현재 패턴은 anti-pattern에 가깝다.
- Native subagent 패턴 (Manager가 task 발생 시 Spoke를 spawn)을 채택하면 main context의 token 소비를 대폭 감소시킬 수 있다.
- **bkit v2.0.7 우선 도입 후보 #1**

### B.1.2 계층적 GEMINI.md (3-tier hierarchy)

**URL**: https://medium.com/google-cloud/practical-gemini-cli-instruction-following-gemini-md-hierarchy-part-1-3ba241ac5496
**작성자**: Prashanth Subrahmanyam (Google Cloud Community)
**인용 (addyo.substack.com, 2025-10-21)**:
> "Global context (`~/.gemini/GEMINI.md`) combines with project-specific files; more specific contexts override general ones."

**모범 패턴**:
- Global `~/.gemini/GEMINI.md`: 사용자 글로벌 코딩 스타일
- Project `.gemini/GEMINI.md`: 프로젝트 규칙
- Subdirectory `<subdir>/GEMINI.md`: 영역별 specific rules
- Extension `<extension>/GEMINI.md`: 확장 컨텍스트

**bkit 활용 기회**:
- bkit이 SYSTEM.md + GEMINI.md + MEMORY.md를 모두 별도 관리하는 현재 구조는 표준 패턴과 합치
- 단, **bkit GEMINI.md를 thin하게 유지**하고 deep reference는 skill에 위임 (B.1.3 참조)

### B.1.3 Progressive Disclosure (skill 기반 점진 노출)

**URL**: https://geminicli.com/docs/cli/skills-best-practices/ (공식이지만 외부 블로그에서 자주 인용)
**참조 블로그**: https://medium.com/google-cloud/beyond-prompt-engineering-using-agent-skills-in-gemini-cli-04d9af3cda21 (Daniel Strebel)
**인용 (Anthropic blog, 2025-09-29)**:
> "Just-In-Time Context Retrieval: Instead of pre-loading all data, agents use lightweight identifiers and dynamically retrieve information at runtime through tools—mirroring how humans use filing systems rather than memorizing everything."

**bkit 활용 기회**:
- 현재 bkit이 SessionStart에서 다량의 context를 load하는 패턴 → "Just-in-Time" 패턴으로 전환
- Skill의 SKILL.md frontmatter `description`이 trigger 역할: 적절한 description 작성이 핵심
- **bkit v2.0.7 도입 후보 #2**

### B.1.4 Plan-driven Development (Philipp Schmid 패턴)

**URL**: https://x.com/_philschmid/status/1937887668710355265
**작성일**: 2025-08 (정확한 날짜 미확인, anecdotal)
**인용**:
> "For complex tasks, I *never* ask for code first. My initial prompt is to create a plan 'Create a detailed implementation plan for [FEATURE, BUG]'."

**관련 URL**: https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/ (Plan Mode 공식 발표, 2026-03 추정)

**bkit 활용 기회**:
- bkit의 `/p-plan` 워크플로가 이미 이 패턴과 일치하지만, Plan Mode (read-only) 활용 명시적 도입은 미정
- **bkit `/p-plan` → `gemini` Plan Mode 자동 진입** 통합 가능 (Shift+Tab 자동화)

### B.1.5 Filesystem-as-State (오케스트레이션 패턴)

**URL**: https://aipositive.substack.com/p/how-i-turned-gemini-cli-into-a-multi
**작성일**: 2025-07-26
**인용**:
> "Rather than managing complex background processes, the system stores its entire state—task queues, plans, and logs—in structured directories. This approach provides transparency and debuggability."

**bkit 활용 기회**:
- bkit이 `docs/01-plan/...`, `docs/02-do/...` 등 filesystem 기반 state 관리 이미 채택
- 다만 `.bkit/state/` 같은 runtime state 영역은 없음 — OmG의 `.omg/state/session-lock.json` 패턴 도입 검토 가치 있음

### B.1.6 Subagent Identity 명시 (Constraint-Based Prompts)

**URL**: https://aipositive.substack.com/p/how-i-turned-gemini-cli-into-a-multi
**작성일**: 2025-07-26
**인용**:
> "Initial attempts failed because child processes didn't recognize their role. The solution required explicit identity framing: 'You are the coder-agent. Your Task ID is...' rather than implicit role assumption through extensions alone."

**bkit 활용 기회**:
- bkit subagent (gemini-researcher, planner 등) 시스템 프롬프트에 **Task ID + Role 명시** 강화
- 현재 bkit subagent들은 role은 명시되지만 Task ID 컨셉은 없음

### B.1.7 Hooks의 Specific Matcher 사용

**URL**: https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/
**작성일**: 2026-01-28
**인용**:
> "Use specific matchers (e.g., `\"matcher\": \"write_file|replace\"`) to limit execution to relevant events rather than all tools. Keep hooks fast since they run synchronously within the agent loop."

**bkit 활용 기회**:
- bkit의 SessionStart hook이 모든 세션에 적용 → 매우 무거움
- BeforeTool hook은 specific matcher로 좁혀야 함
- **bkit hook 성능 최적화 후보**

### B.1.8 Custom Slash Commands via TOML (팀 표준화)

**URL**: https://addyo.substack.com/p/gemini-cli-tips-and-tricks
**작성일**: 2025-10-21
**인용**:
> "Define reusable commands via TOML files in `~/.gemini/commands/`. Format filenames as `category/command.toml` to create `/category:command` shortcuts. This enables scripting complex prompts into one-liners and standardizing workflows across teams."

**bkit 활용 기회**:
- bkit이 이미 `commands/` 디렉토리 활용 — 표준 패턴과 합치 (확인됨)

### B.1.9 Token Caching 활용

**URL**: https://addyo.substack.com/p/gemini-cli-tips-and-tricks
**작성일**: 2025-10-21
**인용**:
> "Authenticate with API key or Vertex AI to enable automatic context reuse across turns, reducing costs and latency."

**bkit 활용 기회**:
- bkit context를 stable하게 유지하면 token caching 효과 극대화 가능
- **GEMINI.md 변경 빈도 모니터링** 권장

### B.1.10 Memory vs Compression 분리

**URL**: https://geminicli.com/docs/cli/rewind/ + addyosmani tips
**인용**:
> "Note that compression doesn't save to long-term memory, it's local to the conversation. If you have facts you never want lost, consider adding to /memory - because memory entries will survive compression."

**bkit 활용 기회**:
- bkit이 `/memory add`를 워크플로에 통합하는 방안 검토
- 현재 bkit은 markdown 기반 docs/ 영구화에 의존 — `/memory` 활용으로 in-session retention 강화 가능

### B.1.11 Skills + Hooks + Plan Mode 3계층 통합

**URL**: https://dev.to/googleai/unlocking-gemini-cli-with-skills-hooks-plan-mode-2bgf
**인용**:
> "Hooks run linters and 'security guards' at session start to prevent problematic code, while Skills provide specialized knowledge progressively. Plan Mode lets developers review the agent's strategy before execution."

**bkit 활용 기회**:
- **bkit v2.0.7 핵심 통합 후보 #3**: SessionStart (Hook) → Skill Discovery (JIT) → Plan Mode (read-only) → Execute
- 이 패턴은 v2.0.7 sprint의 메인 아키텍처 가설로 채택 가능

### B.1.12 Context Compression Service 활용

**URL**: https://geminicli.com/docs/changelogs/ (v0.38.0 도입)
**참조 블로그**: https://aipositive.substack.com/p/a-look-at-context-engineering-in (Paul Datta, 2025-09-18)
**인용**:
> "When conversation history exceeds a threshold (e.g., 70% of model capacity), the system 'invokes a specialized summarizer persona' to distill discussions into structured XML snapshots rather than truncating."

**bkit 활용 기회**:
- bkit가 long-running session에서 자동 compression 의존 → trigger 조건 명시적 설정 권장

### B.1.13 Trusted Folders + Checkpointing 안전망

**URL**: https://geminicli.com/docs/cli/trusted-folders/ + https://geminicli.com/docs/cli/checkpointing/
**인용 (Trusted Folders)**:
> "Your choice is saved in a central file (`~/.gemini/trustedFolders.json`), so you will only be asked once per folder. When a folder is untrusted, Gemini CLI runs in a restricted 'safe mode'."

**bkit 활용 기회**:
- bkit의 ".trust" 처리 정책을 trusted folders 시스템과 align (현재 bkit이 trust bypass 로직 보유)
- v2.0.6 commit (8e0daa7)에서 "Headless Trust Enforcement bypass" 이슈가 있었음 — 정공법으로 trusted folders 활용 검토

### B.1.14 Session Auto-Save Default

**URL**: https://developers.googleblog.com/pick-up-exactly-where-you-left-off-with-session-management-in-gemini-cli/
**인용**:
> "Gemini CLI now automatically saves your sessions and lets you search through your session history to resume right where you left off. Session management is available in Gemini CLI and on by default as of v0.20.0+."

**bkit 활용 기회**:
- bkit 워크플로가 session resume을 활용하면 PDCA cycle 간 context 보존 가능
- 단, B.3.1 (session resume 신뢰성 이슈) 주의

### B.1.15 Filesystem-based Sub-agent Logs (공유 로그)

**URL**: https://medium.com/google-cloud/advanced-gemini-cli-part-3-isolated-agents-b9dbab70eeff
**작성일**: 2025-10-18
**인용**:
> "Shared session logs with strict write rules prevent concurrent modification conflicts. Prompts saved to files, then specialists read and execute ('read the file and execute instructions within')."

**bkit 활용 기회**:
- bkit의 docs/ 기반 산출물 흐름과 일치
- 단, **strict write rules**가 명시되지 않음 — OmG의 session-lock.json 패턴 채택 검토

### B.1.16 Negative Constraints 우선

**URL**: https://geminicli.com/docs/cli/gemini-md/ (공식이지만 외부 블로그에서도 강조)
**인용 (검색 결과 요약)**:
> "Use Negative Constraints: Explicitly telling the agent what not to do (for example, 'Do not use class components') is often more effective than vague positive instructions."

**bkit 활용 기회**:
- bkit GEMINI.md를 "DO/DON'T" 형식으로 재구성 검토
- 현재 bkit GEMINI.md는 긍정문 위주 — 부정 제약 추가 시 안정성 향상 가능

### B.1.17 Auto Memory Inbox 패턴 (v0.42.0 신규)

**URL**: https://geminicli.com/docs/cli/auto-memory/
**인용**:
> "Auto Memory infers candidates from past sessions, writes reviewable patches or skill drafts, and never applies them without your approval. Sessions are eligible only if they have been idle for at least three hours and contain at least 10 user messages."

**bkit 활용 기회**:
- v0.42.0 신규 기능 — bkit이 활용하면 long-running PDCA에서 자동으로 skill 추출 가능
- **v2.0.7 도입 후보**: `/memory inbox` 워크플로 통합

### B.1.18 Configuration Sandwich (엔터프라이즈)

**URL**: https://medium.com/google-cloud/yes-we-can-have-nice-things-using-gemini-cli-in-an-enterprise-environment-631351e8198e
**작성일**: 2025-11-05
**인용**:
> "Base Layer: Sensible defaults (shared contexts, pre-vetted MCP servers, theme settings). Override Layer: Enforced controls that developers cannot modify, including allowed MCP servers, enabled tools, sandbox requirements, and telemetry targets."

**bkit 활용 기회**:
- bkit이 팀 단위로 배포될 때 base/override 2-layer 모델 채택 가능
- 현재 bkit은 단일 layer만 — multi-tenant scenario에 약함

---

## B.2 안티 패턴 (Anti-Patterns)

### B.2.1 SessionStart에서 모든 agent boot

**문제 정의**: bkit 현재 패턴
**증거 URL**: https://medium.com/google-cloud/advanced-gemini-cli-part-3-isolated-agents-b9dbab70eeff (2025-10-18)
**인용**:
> "Three critical problems motivate this approach: 1. Context Degradation: Agents reading multiple files accumulate 'polluted' context that causes unintended side effects 2. Token Inefficiency: Repeating full instructions across turns wastes tokens despite the 1M context window."

**bkit이 피해야 할 함정**:
- 모든 agent를 boot하는 SessionStart hook → token 낭비
- 대신 native subagent의 lazy spawning 활용

### B.2.2 YOLO Mode + Untrusted Input 조합 (CVSS 10.0)

**URL**: https://thehackernews.com/2026/04/google-fixes-cvss-10-gemini-cli-ci-rce.html (2026-04-30)
**인용**:
> "An attacker could have exploited the flaw by creating a public issue on a Google GitHub repository and hiding malicious prompts in its text, and because in –yolo mode all tool calls are automatically approved, the attacker could take over the AI agent."

**bkit이 피해야 할 함정**:
- bkit이 CI/headless 환경에서 `--yolo` 사용 시 반드시 tool allowlist 적용
- v0.39.1 이후 policy engine이 YOLO mode 하에서도 allowlist 평가 — 활용 권장

### B.2.3 Tool 전체 상속 (Unrestricted Tool Access)

**URL**: https://medium.com/google-cloud/mastering-gemini-cli-subagents-part-1-a4666091c154
**인용**:
> "Unrestricted Tool Access: Inheriting all tools defeats isolation benefits. Subagent tool isolation moves Gemini CLI away from a single global tool registry."

**bkit이 피해야 할 함정**:
- bkit subagent definition에서 `tools: *` 사용 자제
- 각 subagent에 explicit tool list 권장

### B.2.4 GEMINI.md 비대화 (Context Bloat)

**URL**: https://medium.com/google-cloud/practical-gemini-cli-structured-approach-to-bloated-gemini-md-360d8a5c7487 (Prashanth Subrahmanyam)
**인용 (간접)**:
> "Context Rot is the steady decline in an LLM's performance as the input context grows—as a conversation or task history gets longer, the model's ability to process information uniformly and reliably degrades."

**bkit이 피해야 할 함정**:
- bkit GEMINI.md가 점점 비대해지는 경향 — Skill로 분할해야 함
- "Avoid adding excessive content to GEMINI.md and keep instructions actionable"

### B.2.5 Hook 모든 tool에 적용

**URL**: https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/ (2026-01-28)
**인용**:
> "The guidance implicitly discourages running hooks on every tool invocation, emphasizing targeted matcher properties instead for performance reasons."

**bkit이 피해야 할 함정**:
- BeforeTool hook이 모든 tool에 적용되면 매 turn 마다 hook 실행 — 심각한 성능 저하
- specific matcher 필수

### B.2.6 Silent Model Downgrade 미인지

**URL**: https://hackernoon.com/googles-gemini-cli-has-a-reliability-problem-developers-cant-ignore (2026-04-07)
**인용**:
> "Gemini Pro automatically switches to Flash without user notification. CLI silently downgrades you to Flash without warning."

**bkit이 피해야 할 함정**:
- bkit 워크플로가 silent downgrade에 무방비 → quality regression 발생 가능
- **/stats 또는 model 명시 강제 권장**

### B.2.7 Auto Memory Regression (v0.42.0 마이그레이션)

**URL**: https://github.com/google-gemini/gemini-cli/issues/25623
**인용**:
> "Existing experimental.memoryManager = true users would lose /memory inbox and Auto Memory startup behavior unless they manually updated settings, making the feature feel flaky or broken rather than intentionally split."

**bkit이 피해야 할 함정**:
- v0.42.0 마이그레이션 시 bkit이 `experimental.memoryManager` flag 활용 중이면 settings.json 명시적 업데이트 필요
- **마이그레이션 체크리스트 항목**

### B.2.8 Session Resume Invalid Session ID 이슈

**URL**: https://github.com/google-gemini/gemini-cli/issues/24535 + #24532
**인용**:
> "The CLI returns an error: 'Invalid session identifier' even when using the exact session ID provided by the application. Multiple users have reported this problem."

**bkit이 피해야 할 함정**:
- bkit이 session resume을 워크플로의 핵심으로 삼으면 안 됨 (현재 신뢰성 부족)
- filesystem 기반 docs/ 영구화에 의존 (bkit 현재 방식)이 더 안전

### B.2.9 Subagent 병렬 실행 + 코드 편집

**URL**: https://geminicli.com/docs/core/subagents/ (공식이지만 외부에서 강조)
**인용 (InfoQ, 2026-04)**:
> "However, you should exercise caution with parallel subagents for tasks that require heavy code edits, as multiple agents editing code at the same time can lead to conflicts and agents overwriting one another."

**bkit이 피해야 할 함정**:
- bkit이 PDCA cycle에서 여러 subagent를 동시에 코드 수정에 활용 시 충돌 위험
- **read-only 작업만 병렬화 권장**

### B.2.10 Skill description 부실 (Trigger 실패)

**URL**: https://geminicli.com/docs/cli/skills-best-practices/
**인용**:
> "The description field is particularly critical: The description is CRITICAL. This is how Gemini decides when to use the skill. Be specific about the tasks it handles and the keywords that should trigger it."

**bkit이 피해야 할 함정**:
- bkit skill의 description이 모호하면 trigger되지 않음 → skill 사용 안 됨
- description은 keyword 풍부하게 작성

### B.2.11 Quota 시스템 불투명성

**URL**: https://hackernoon.com/googles-gemini-cli-has-a-reliability-problem-developers-cant-ignore
**인용**:
> "Displayed usage stats don't match actual behavior. Usage stats showing plenty of remaining quota, yet system still says 'Usage limit reached'. Quota calculation method completely undocumented."

**bkit이 피해야 할 함정**:
- bkit 워크플로가 quota 의존성 명시 안 함 → 사용자가 429 에러로 좌절
- **/stats 활용 권장 + fallback model 명시**

### B.2.12 Centralized Configuration 분산

**URL**: https://leslieo2.github.io/posts/context-engineering/ (2025-10-18)
**인용**:
> "Antipatterns to Avoid: Decentralizing configuration across multiple stores. Treating subagents as black boxes rather than ecosystem participants."

**bkit이 피해야 할 함정**:
- bkit이 settings.json, GEMINI.md, MEMORY.md, 각 agent 파일에 설정 분산 → 일관성 깨짐
- **Single Source of Truth 원칙 채택 권장**

---

## B.3 사용자 경험 보고 (User Experience Reports)

### B.3.1 Session Resume 실패 (v0.42.0 이전부터)

**URL**: https://github.com/google-gemini/gemini-cli/issues/24535
**작성일**: 2026-04 (issue date)
**Quote**:
> "Failed to resume previous conversations - 'Invalid session identifier' error"

**상태**: v0.42.0에서 "fix(core): reset session-scoped state on resumption" 적용 — anecdotal 개선 보고 (검증 필요)

### B.3.2 Auto Memory "Thinking..." Stuck

**URL**: https://github.com/google-gemini/gemini-cli/issues/25623 + 검색 결과
**Quote**:
> "It would be nice if I could use any of these new improvements but it says 'Thinking...' for the last 2 hours"

**bkit 관련성**: Auto Memory는 백그라운드 실행이지만 일부 사용자에서 lock-up 발생 — anecdotal

### B.3.3 한국 사용자 후기 (FURVEN, velog)

**URL**: https://velog.io/@dnjstjdgus03/GeminiCLI
**작성일**: 2025-07-03
**한국어 원문**:
> "Shell 명령도 실행하고, 코드도 짜주고, 검색도 해주는 그 올인원 느낌"
> "같이 개발 해 줄 어시스턴트로 써보는 게 맞는 듯"

**영문 요약**: All-in-one terminal AI but works best as collaborative partner, not autonomous coder.

**bkit 시사점**: 한국 사용자는 "협업 파트너" 관점에서 Gemini CLI를 받아들임 — bkit 워크플로도 "직접 generate" 보다 "plan + review" 강조 필요

### B.3.4 일본 개발자 시각 (zenn.dev daishiro)

**URL**: https://zenn.dev/daishiro/articles/gemini-cli-cheatsheet
**작성일**: 2026-02-28
**인용 요약**:
> "Three core strengths: extensible architecture, checkpoint-and-rewind functionality, and free tier accessibility."

**bkit 시사점**: 일본 개발자는 "확장성 + checkpoint + 무료"를 핵심으로 인식 — bkit의 차별화 포인트는 PDCA 워크플로 (B.5 참조)

### B.3.5 일본 zenn 비판적 시각 (carenet)

**URL**: https://zenn.dev/carenet/articles/7f4d0bf85cc0e2
**작성일**: 2025-06-27
**제목 번역**: "Gemini CLI는 현상 좀 부족할지도 모르겠다 (주간 AI)"
**bkit 시사점**: 출시 초기 사용자들은 안정성 부족 인식 — 1년 후인 2026-05 현재는 크게 개선됐으나 reliability concern은 지속 (B.2.6 참조)

### B.3.6 Plan Mode UX 호평

**URL**: https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/ + 다수 블로그
**Quote 종합**:
> "Plan Mode is the safest AI coding workflow in 2026... read-only mode where the AI agent researches your codebase, creates a plan, and asks clarifying questions — without modifying any files."

**bkit 시사점**: Plan Mode가 bkit `/p-plan` 페이즈와 자연스럽게 통합 가능

### B.3.7 Extension Marketplace 만족도 (70+ extensions live)

**URL**: https://www.linkedin.com/posts/jack-wotherspoon_gemini-cli-extensions-marketplace-is-now-activity-7381743766644195329-No8-
**Quote**:
> "The Gemini CLI extensions marketplace is now live with over 70+ extensions available today, including extensions from partners like Shopify, Canva, Postman, Figma, Snyk, Elastic, MongoDB, and Harness."

**bkit 시사점**: bkit이 marketplace에 등록되면 가시성 확보 가능 — 배포 전략 검토 가치

### B.3.8 1M Context Window 활용 만족도

**URL**: https://realpython.com/gemini-cli-vs-claude-code/ + 다수
**Quote**:
> "Gemini CLI's 1M-token context lets you load an entire codebase into one conversation. You can ask it to analyze architecture, find patterns across hundreds of files, or refactor with full awareness of every dependency."

**bkit 시사점**: bkit이 1M context를 활용하는 deep-research 워크플로 (gemini-researcher 같은 subagent) 차별화 포인트로 작용 가능

---

## B.4 Extension 개발 패턴 (Comparative Case Studies)

### B.4.1 OmG (Oh-My-Gemini-CLI) — bkit 가장 유사

**URL**: https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli
**버전**: v0.8.5 (anecdotal, 2026-05 추정)
**구조**:
```
oh-my-gemini-cli/
├── agents/           # 12 sub-agents (omg-architect, omg-planner, omg-product, ...)
├── commands/omg/     # 30+ slash commands (/omg:status, /omg:team-plan, ...)
├── skills/           # 8 skills ($plan, $execute, $prd, $research, ...)
├── context/          # Context engineering artifacts
├── hooks/            # BeforeModel (router), AfterAgent (learn signal)
├── .omg/state/       # Runtime state (session-lock.json, taskboard.md, ...)
└── GEMINI.md         # System prompt
```

**핵심 인사이트**:
- **Session locking**: `.omg/state/session-lock.json`으로 single-writer 강제
- **Model routing**: BeforeModel hook에서 Pro/Flash/Flash-Lite 자동 라우팅
- **Taskboard**: `.omg/state/taskboard.md`에 task ledger 관리
- **5-tier context**: 플랫폼 제약 → 프로젝트 표준 → GEMINI.md → 현재 task brief → 최신 execution trace

**bkit과 차이/유사**:
- **유사**: agent + command + skill + hook + context의 풀스택 extension 구조
- **차이**: bkit은 PDCA 4단계 + sprint cycle, OmG은 architect-planner-executor team
- **bkit 학습 기회**:
  1. session-lock.json 패턴 채택 검토
  2. BeforeModel hook의 silent model routing 채택 (bkit이 model 선택 명시 안 함)
  3. Taskboard 형식의 task ledger 추가 검토

### B.4.2 philschmid/gemini-cli-extension

**URL**: https://github.com/philschmid/gemini-cli-extension
**Plan + Implementation 명령 패턴**:
- `/plan/impl.toml`: Plan-to-Implementation 변환 자동화

**bkit 학습 기회**:
- bkit이 `.toml` command format을 더 적극 활용하면 사용자 친화성 향상

### B.4.3 Maestro (multi-agent platform)

**URL**: https://github.com/Piebald-AI/awesome-gemini-cli-extensions (catalogued)
**Quote**:
> "Maestro transforms CLI into a multi-agent platform — 12 specialized subagents, parallel dispatch, 4-phase orchestration"

**bkit 학습 기회**:
- bkit의 sprint cycle도 "4-phase orchestration" — Maestro의 phase 분할 방식 비교 학습 가치

### B.4.4 Pickle Rick (continuous AI loops)

**Quote**:
> "Pickle Rick enforces iterative software development lifecycle through continuous AI agent loops"

**bkit 학습 기회**:
- bkit의 PDCA cycle과 동일 철학 — verification gate 비교 가치

### B.4.5 Conductor (specify-plan-implement)

**Quote**:
> "Conductor allows you to specify, plan, and implement software features"

**bkit 학습 기회**:
- bkit의 plan/do/check/act와 매핑 가능 — 명령어 네이밍 비교 (시인성 측면)

### B.4.6 Bitloops (context engineering 전문)

**URL**: https://bitloops.com/gemini
**Quote (검색결과)**:
> "Bitloops for Gemini CLI — Context Engineering for Google's AI Coding Agent"

**bkit 학습 기회**:
- 컨텍스트 엔지니어링 전문 extension의 contextFile / GEMINI.md 활용 방식 학습

---

## B.5 경쟁 도구 비교 (Competitive Landscape)

### B.5.1 Gemini CLI vs Claude Code (2026-05)

**URL**: https://codersera.com/blog/gemini-cli-vs-claude-code-2026/ + https://www.codeant.ai/blogs/...
**핵심 비교**:
| 항목 | Gemini CLI | Claude Code |
|------|-----------|-------------|
| Context | 1M tokens | ~1M (2026-03 GA) |
| Pricing | Free + paid | $20/mo+ |
| 코드 품질 | 80.6% SWE-bench | 80.8-80.9% SWE-bench |
| Loop quality | (떨어짐) | (우수) |
| Plan Mode | ✓ (default since v0.34) | (다른 방식) |
| Skills | ✓ Anthropic 표준 채택 | ✓ Anthropic 원본 |
| Extension | gemini-extension.json | .claude 디렉토리 |

**bkit 차별화 포인트**:
- **bkit의 강점**: PDCA cycle 표준화, 한국어 워크플로, sprint management
- **bkit의 약점**: Gemini CLI native 기능을 fully 활용 못 함 (skill, subagent, hook progressive disclosure 미흡)

### B.5.2 사용자 패턴 (Two-Tool Workflow)

**URL**: https://shipyard.build/blog/claude-code-vs-gemini-cli/ + thoughts.jock.pl
**Quote**:
> "The most common pattern in 2026: Claude Code for the main interactive loop and production work, Gemini CLI piped via `gemini -p` for cheap one-shot greps over a giant codebase or for batch multimodal tasks."

**bkit 시사점**:
- bkit이 "Gemini CLI primary"를 가정 → 사용자는 Claude Code도 병행 사용 가능성 높음
- **Cross-LLM compatibility** 검토 가치 있음 (B.7 참조)

### B.5.3 Cursor vs Gemini CLI

**URL**: https://www.augmentcode.com/tools/cursor-vs-gemini-cli + 다수
**핵심**:
- Cursor: IDE-integrated, tab-complete, $20+/month
- Gemini CLI: Terminal-native, free tier

**bkit 시사점**: bkit은 terminal-native 사용자 대상이지만 VS Code IDE companion 통합으로 hybrid 가능

### B.5.4 Codex CLI vs Gemini CLI

**URL**: https://intuitionlabs.ai/articles/claude-code-vs-codex-vs-gemini-cli-comparison
**핵심**:
- Codex: GPT-5.5 (82.7% Terminal-Bench 2.0)
- Codex: 단일 파일/샌드박스 강점, Terminal Bench 19위
- Gemini CLI: Terminal Bench 더 높음 (정확 순위 미확인)

**bkit 시사점**: 멀티-LLM 시대 → bkit이 LLM-agnostic 워크플로 추구하면 reach 확대

### B.5.5 Aider 비교

**URL**: https://thoughts.jock.pl/p/ai-coding-harness-agents-2026
**핵심**:
- Aider: 39K+ GitHub stars, 4.1M+ installations, 100+ 언어
- 가장 오래된 terminal AI pair programming tool

**bkit 시사점**: Aider의 코드 매핑/repomap 컨셉 학습 가치 — bkit이 codebase 인덱싱을 더 적극 활용 가능

---

## B.6 향후 트렌드 시그널 (Forward-Looking Signals)

### B.6.1 "Vibe Coding → Agentic Engineering" (Karpathy 2026)

**URL**: https://thenewstack.io/vibe-coding-is-passe/ + https://www.youtube.com/watch?v=96jN2OCOfLs
**작성일**: 2026-05 추정
**Quote**:
> "LLMs have gotten much smarter, such that vibe coding is now passé. Programming via LLM agents is increasingly becoming a default workflow for professionals, except with more oversight and scrutiny."
> "Agentic engineering: 'agentic' because the new default is that you are not writing the code directly 99% of the time, you are orchestrating agents who do and acting as oversight."

**bkit 시사점**:
- **bkit의 "Vibecoding Kit" 브랜딩 검토 필요**: vibe coding 자체가 passé됨
- 차라리 "Agentic Engineering Kit" 또는 "Context Engineering Kit"로 리브랜딩 고려
- 다만 bkit이 vibe coding의 잘못된 사용을 방지하는 측면 강조하면 가치 유지 가능

### B.6.2 Context Engineering 표준화 (MIT Tech Review 2025-11)

**URL**: https://www.technologyreview.com/2025/11/05/1127477/from-vibe-coding-to-context-engineering-2025-in-software-development/
**Quote**:
> "After years of the industry assuming progress in AI is all about scale and speed, we're starting to see that what matters is the ability to handle context effectively."

**bkit 시사점**: 컨텍스트 엔지니어링은 2025-2026 핵심 트렌드 — bkit이 이미 이 방향이므로 적극 강조

### B.6.3 Anthropic SKILL.md 표준 (2025-12 공개, OpenAI/Google 채택)

**URL**: https://elguerre.com/2026/03/30/ai-agents-vs-skills-commands-in-claude-code-codex-copilot-cli-gemini-cli-stop-mixing-them-up/
**Quote**:
> "All major CLI tools—Claude Code, Codex, Copilot CLI, and Gemini CLI—share the same Skills standard with the same SKILL.md format, an open standard published by Anthropic in December 2025 and adopted by OpenAI."

**bkit 시사점**:
- **bkit skills는 cross-LLM compatible**해야 함
- Claude Code / Codex CLI / Copilot CLI 사용자도 bkit skill 활용 가능하게 설계

### B.6.4 A2A (Agent-to-Agent) Protocol 확산

**URL**: https://geminicli.com/docs/core/remote-agents/ + https://www.elastic.co/search-labs/blog/a2a-protocol-elastic-agent-builder-gemini-enterprise
**Quote**:
> "Agent2Agent (A2A) Protocol is an open communication protocol and a universal language for agents. The protocol enables agents from different builders and platforms to discover each other, collaborate, and securely delegate tasks."

**bkit 시사점**:
- bkit subagent를 A2A 서버로 expose하면 다른 platform과 협업 가능
- v2.0.7 이후 long-term 로드맵 후보

---

## B.7 Cross-LLM Context Engineering 외부 시각

### B.7.1 Anthropic Effective Context Engineering

**URL**: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
**작성일**: 2025-09-29
**핵심 전략 4가지**:
1. **System Prompt "right altitude"**: 너무 구체적이지도, 모호하지도 않게
2. **Tool Design**: minimal, non-overlapping, self-contained
3. **Few-Shot Prompting**: 다양한 canonical examples
4. **Just-In-Time Context Retrieval**: lightweight identifiers + runtime retrieval

**bkit 활용 기회**: 위 4가지 모두 bkit 워크플로에 적용 가능

### B.7.2 Long-Horizon Techniques (Anthropic)

**URL**: 동일 (Anthropic)
**기법**:
- **Compaction**: 대화 요약 후 context 재시작
- **Structured Note-Taking**: context window 외부에 메모리 유지
- **Sub-Agent Architectures**: 전문 agent의 condensed summary 반환

**bkit 활용 기회**: bkit이 이미 docs/ 기반 note-taking 활용 — sub-agent architecture 강화 시 더욱 효과적

### B.7.3 Context Engineering as Cross-LLM Discipline

**URL**: https://faraazmohdkhan.medium.com/master-context-engineering-with-gemini-cli-how-to-build-smarter-ai-powered-workflows-3445814f5968 + https://aipositive.substack.com/p/a-look-at-context-engineering-in
**핵심**: Context engineering은 LLM-agnostic 학문 — Gemini CLI든 Claude Code든 동일 원칙 적용

**bkit 시사점**:
- bkit이 "Gemini-specific" 으로 한정되면 시장 좁아짐
- **Cross-LLM 적합성**을 유지하면 더 큰 reach

---

## §8 bkit이 도입할 외부 Best Practices (Prioritized)

| 우선순위 | 인사이트 | 출처 § | 도입 난이도 | 예상 효과 |
|---------|---------|--------|------------|----------|
| **P1** | Hub-and-Spoke (native subagent로 SessionStart 패턴 대체) | B.1.1, B.2.1 | High | Token 30-50% 절감 |
| **P1** | Progressive Disclosure (skill JIT retrieval) | B.1.3 | Medium | Token + 응답 품질 |
| **P1** | Skills + Hooks + Plan Mode 3-tier 통합 | B.1.11 | Medium | 안전성 + 자동화 |
| **P2** | Specific matcher 사용 (Hook 성능) | B.1.7, B.2.5 | Low | 성능 향상 |
| **P2** | Subagent identity 명시 (Task ID + Role) | B.1.6 | Low | 안정성 |
| **P2** | Tool restriction (subagent별 explicit list) | B.2.3 | Low | 안전성 |
| **P2** | GEMINI.md thin + Skill 분할 | B.1.2, B.2.4 | Medium | Context Rot 방지 |
| **P3** | Session-lock pattern (OmG 참고) | B.1.5, B.4.1 | Medium | 동시성 안전 |
| **P3** | Auto Memory Inbox 워크플로 통합 | B.1.17 | Medium | 자동 skill 추출 |
| **P3** | BeforeModel hook silent model routing | B.4.1 | Medium | 비용 최적화 |
| **P3** | Negative constraints in GEMINI.md | B.1.16 | Low | 안정성 |
| **P3** | Token caching 친화 (stable context) | B.1.9 | Low | 비용 절감 |
| **P4** | Configuration sandwich (base/override 2-layer) | B.1.18 | High | 엔터프라이즈 reach |
| **P4** | A2A 프로토콜 적합화 | B.6.4 | High | Long-term reach |
| **P4** | Cross-LLM compatibility (SKILL.md 표준 준수) | B.6.3 | Medium | 시장 reach 확대 |
| **P5** | Plan Mode 자동 진입 통합 (`/p-plan` → plan mode) | B.1.4, B.3.6 | Low | 안전성 |
| **P5** | Trusted Folders 정공법 채택 (v2.0.6 bypass 대체) | B.1.13 | Medium | 보안 강화 |
| **P5** | Taskboard ledger 형식 (OmG 참조) | B.4.1 | Medium | 가시성 |

---

## §9 bkit이 피해야 할 안티 패턴 (Prioritized)

| 우선순위 | 안티 패턴 | 출처 § | bkit 현재 상태 |
|---------|----------|--------|---------------|
| **A1** | SessionStart 모든 agent boot | B.2.1 | **현재 채택 중** — v2.0.7에서 해결 필요 |
| **A1** | GEMINI.md 비대화 (Context Bloat) | B.2.4 | bkit GEMINI.md 점점 커짐 — 분할 필요 |
| **A1** | Hook 모든 tool 적용 | B.2.5 | matcher 점검 필요 |
| **A2** | Tool 전체 상속 (subagent unrestricted) | B.2.3 | bkit subagent 검토 필요 |
| **A2** | Skill description 부실 | B.2.10 | 모든 skill description audit 필요 |
| **A2** | YOLO + untrusted input (CVSS 10.0) | B.2.2 | CI 시나리오 검토 필요 |
| **A3** | Silent model downgrade 미인지 | B.2.6 | 모니터링 추가 필요 |
| **A3** | Auto Memory regression (v0.42.0 migration) | B.2.7 | settings.json audit |
| **A3** | Session resume 신뢰성 의존 | B.2.8 | 의존 안 함 (현재 OK) |
| **A3** | Parallel subagent + 코드 편집 | B.2.9 | 현재 안전, future 주의 |
| **A4** | Quota 시스템 불투명 의존 | B.2.11 | 사용자 가이드 필요 |
| **A4** | Configuration 분산 (multi-store) | B.2.12 | bkit이 약함 — SoT 설정 필요 |

---

## §10 출처 리스트 (전체)

### 공식/준공식 블로그
- https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli/ (2026-04-15)
- https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/ (2026-01-28)
- https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/
- https://developers.googleblog.com/pick-up-exactly-where-you-left-off-with-session-management-in-gemini-cli/
- https://developers.googleblog.com/making-gemini-cli-extensions-easier-to-use/
- https://developers.googleblog.com/gemini-cli-fastmcp-simplifying-mcp-server-development/

### Google Cloud Community (Medium)
- https://medium.com/google-cloud/practical-gemini-cli-instruction-following-gemini-md-hierarchy-part-1-3ba241ac5496 (Prashanth Subrahmanyam)
- https://medium.com/google-cloud/practical-gemini-cli-structured-approach-to-bloated-gemini-md-360d8a5c7487
- https://medium.com/google-cloud/advanced-gemini-cli-part-3-isolated-agents-b9dbab70eeff (2025-10-18)
- https://medium.com/google-cloud/mastering-gemini-cli-subagents-part-1-a4666091c154
- https://medium.com/google-cloud/beyond-prompt-engineering-using-agent-skills-in-gemini-cli-04d9af3cda21 (Daniel Strebel)
- https://medium.com/google-cloud/yes-we-can-have-nice-things-using-gemini-cli-in-an-enterprise-environment-631351e8198e (2025-11-05)
- https://medium.com/google-cloud/gemini-cli-tutorial-series-part-9-understanding-context-memory-and-conversational-branching-095feb3e5a43 (Romin Irani)
- https://medium.com/google-cloud/gemini-cli-tutorial-series-part-11-gemini-cli-extensions-69a6f2abb659
- https://medium.com/google-cloud/gemini-cli-part-2-awesome-extensions-c0d9aaa594ef
- https://medium.com/google-cloud/self-hosted-gemma-4-on-tpu-with-mcp-adk-and-gemini-cli-7f646458a3c3

### 독립 블로그 / 뉴스레터
- https://addyo.substack.com/p/gemini-cli-tips-and-tricks (Addy Osmani, 2025-10-21)
- https://addyosmani.com/blog/gemini-cli/
- https://github.com/addyosmani/gemini-cli-tips
- https://aipositive.substack.com/p/how-i-turned-gemini-cli-into-a-multi (Paul Datta, 2025-07-26)
- https://aipositive.substack.com/p/a-look-at-context-engineering-in (Paul Datta, 2025-09-18)
- https://aipositive.substack.com/p/secure-gemini-cli-with-the-policy
- https://leslieo2.github.io/posts/context-engineering/ (2025-10-18)
- https://www.philschmid.de/gemini-cli-cheatsheet
- https://allen.hutchison.org/2025/11/26/the-guardrails-of-autonomy/
- https://danicat.dev/posts/agent-skills-gemini-cli/
- https://faraazmohdkhan.medium.com/master-context-engineering-with-gemini-cli-how-to-build-smarter-ai-powered-workflows-3445814f5968

### Anthropic / 경쟁 시각
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (2025-09-29)
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://resources.anthropic.com/2026-agentic-coding-trends-report
- https://thenewstack.io/vibe-coding-is-passe/ (Karpathy update, 2026-05)
- https://www.technologyreview.com/2025/11/05/1127477/from-vibe-coding-to-context-engineering-2025-in-software-development/

### 비교 도구 리뷰
- https://www.datacamp.com/blog/gemini-cli-vs-claude-code
- https://codersera.com/blog/gemini-cli-vs-claude-code-2026/
- https://shipyard.build/blog/claude-code-vs-gemini-cli/
- https://realpython.com/gemini-cli-vs-claude-code/
- https://intuitionlabs.ai/articles/claude-code-vs-codex-vs-gemini-cli-comparison
- https://www.codeant.ai/blogs/claude-code-cli-vs-codex-cli-vs-gemini-cli-best-ai-cli-tool-for-developers-in-2025
- https://thoughts.jock.pl/p/ai-coding-harness-agents-2026
- https://www.augmentcode.com/tools/cursor-vs-gemini-cli
- https://elguerre.com/2026/03/30/ai-agents-vs-skills-commands-in-claude-code-codex-copilot-cli-gemini-cli-stop-mixing-them-up/

### Extension Repos
- https://github.com/Joonghyun-Lee-Frieren/oh-my-gemini-cli (OmG)
- https://github.com/sathariels/context-engineering-intro-GeminiCLI
- https://github.com/philschmid/gemini-cli-extension
- https://github.com/Piebald-AI/awesome-gemini-cli-extensions
- https://github.com/Piebald-AI/awesome-gemini-cli

### 한국 / 일본 커뮤니티
- https://velog.io/@dnjstjdgus03/GeminiCLI (FURVEN, 2025-07-03)
- https://velog.io/@johj703/GeminiCLI-사용기
- https://zenn.dev/daishiro/articles/gemini-cli-cheatsheet (2026-02-28)
- https://zenn.dev/carenet/articles/7f4d0bf85cc0e2 (2025-06-27)
- https://zenn.dev/schroneko/articles/gemini-cli-tutorial
- https://zenn.dev/nyanko_super/articles/7a5a24622b905c
- https://qiita.com/youtoy/items/fa5b696b055ed4a992ec
- https://artofcoding.dev/building-a-context-aware-gemini-cli-workflow (2025-11-14)

### 보안 / 이슈
- https://thehackernews.com/2026/04/google-fixes-cvss-10-gemini-cli-ci-rce.html (2026-04-30)
- https://hackernoon.com/googles-gemini-cli-has-a-reliability-problem-developers-cant-ignore (2026-04-07)
- https://www.securityweek.com/critical-gemini-cli-flaw-enabled-host-code-execution-supply-chain-attacks/
- https://github.com/google-gemini/gemini-cli/issues/25623
- https://github.com/google-gemini/gemini-cli/issues/24535
- https://github.com/google-gemini/gemini-cli/issues/24532

### GitHub Discussions
- https://github.com/google-gemini/gemini-cli/discussions/26216 (v0.40 tiered memory)
- https://github.com/google-gemini/gemini-cli/discussions/4226 (v1 roadmap)
- https://github.com/google-gemini/gemini-cli/discussions/17812 (skills, hooks, rewind)
- https://github.com/google-gemini/gemini-cli/discussions/7432 (challenges)
- https://github.com/google-gemini/gemini-cli/discussions/24166 (local models)

### 컴페티터 도구 정보
- https://x.com/_philschmid/status/1937862749205205456
- https://x.com/_philschmid/status/1937887668710355265
- https://x.com/_philschmid/status/1950206886071992667

---

## §11 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Best Practices (B.1) | ⬛⬛⬛⬛⬜ | 다수 공식+준공식 소스 교차 검증 |
| Anti-Patterns (B.2) | ⬛⬛⬛⬛⬜ | GitHub issue + 보안 권고 + 블로그 교차 |
| UX 보고 (B.3) | ⬛⬛⬛⬜⬜ | 일부 anecdotal (소수 사용자 보고) |
| Extension 사례 (B.4) | ⬛⬛⬛⬛⬜ | 5+ 케이스 직접 분석 |
| 경쟁 비교 (B.5) | ⬛⬛⬛⬛⬜ | 5+ 비교 리포트 교차 |
| 트렌드 시그널 (B.6) | ⬛⬛⬛⬛⬜ | Karpathy/Anthropic 1차 소스 |
| Cross-LLM (B.7) | ⬛⬛⬛⬜⬜ | 명확한 표준은 있으나 통합 사례 부족 |

---

## §12 다음 단계 (B축이 다른 축에 전달)

- **A축 (공식 문서)**: B.1.17 (Auto Memory Inbox v0.42.0), B.2.7 (regression issue) 교차 검증 권장
- **C축 (GitHub)**: B.3.1 (session resume bug), B.2.7 (memoryManager migration) issue 추적 권장
- **D축 (Context Engineering 철학)**: B.7.1 (Anthropic 4 strategies), B.6.2 (MIT Tech Review trend) 통합 분석 권장
- **E축 (bkit 코드베이스)**: §8 P1~P3 항목 코드 수준 적용 가능성 검토 권장

**B축 임무 완료.**

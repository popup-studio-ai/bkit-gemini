# Gemini CLI Context Engineering & Performance 심층 조사 보고서

> 조사일: 2026-04-09
> 조사 범위: Gemini CLI v0.35~v0.38 (현재 bkit v2.0.3 = v0.36.0 기준)
> 조사자: gemini-researcher agent
> 목적: Extension의 Context 성능 최적화를 위한 기술적 근거 확보

---

## 1. Context Loading Architecture (컨텍스트 적재 아키텍처)

### 1.1 GEMINI.md 적재 방식

**현재 동작: Eager Loading (즉시 전량 적재)**

Gemini CLI는 세션 시작 시 모든 GEMINI.md 파일을 **즉시** 발견하고 적재한다.
구체적으로, CWD에서 하위 디렉토리까지 재귀적(breadth-first search)으로 탐색하여 모든 GEMINI.md를 찾고, 내용을 연결(concatenate)하여 **매 프롬프트마다** 모델에 전송한다.

**3-Tier 계층 구조:**

| Tier | 위치 | 적재 시점 | 지속성 |
|------|------|-----------|--------|
| Global | `~/.gemini/GEMINI.md` | 세션 시작 즉시 | 전 세션 |
| Workspace | 프로젝트 루트 및 상위 디렉토리 GEMINI.md | 세션 시작 즉시 | 전 세션 |
| JIT (Just-in-Time) | 도구가 접근한 디렉토리의 GEMINI.md | 도구 실행 시 동적 | 발견 후 전 세션 |

> **v0.37.0 참고**: JIT context loading이 기본값 `false`로 복원됨.
> 즉, Tier 3 JIT는 비활성 상태가 기본이며, 모든 context는 세션 시작 시 eager load됨.

**참조:**
- [Provide context with GEMINI.md files](https://geminicli.com/docs/cli/gemini-md/)
- [GitHub Issue #11488: Refactor to Dynamic JIT Context](https://github.com/google-gemini/gemini-cli/issues/11488)

### 1.2 @import 동작 방식

**구문**: GEMINI.md 내에서 `@file.md` 또는 `@./path/to/file.md`

**동작**: Memory Import Processor를 통해 처리됨. import된 파일 내용이 GEMINI.md 내용에 **인라인 삽입**된다. `.md` 파일만 지원.

**토큰 비용**: import된 내용은 GEMINI.md 본문과 동일하게 취급되어 **매 프롬프트마다 시스템 프롬프트의 일부로 전송**된다. 별도의 lazy loading이나 조건부 로딩 없음.

**성능 함의**: 10개의 @import가 있으면 10개 파일의 전체 내용이 매 턴마다 토큰으로 소비됨.

**참조:**
- [GEMINI.md docs](https://geminicli.com/docs/cli/gemini-md/)
- [Addy Osmani - Gemini CLI Tips](https://addyo.substack.com/p/gemini-cli-tips-and-tricks)

### 1.3 `.gemini/context/` 디렉토리

**결론: `.gemini/context/` 는 Gemini CLI의 공식 기능이 아님.**

공식 문서에서 이 디렉토리에 대한 언급은 없다. Context는 오직 GEMINI.md 파일(이름 커스터마이즈 가능)과 @import를 통해서만 관리된다. `context.fileName` 설정으로 `["AGENTS.md", "CONTEXT.md", "GEMINI.md"]` 같이 복수 파일명을 지정할 수 있지만, 이는 파일 이름 매칭일 뿐 별도 디렉토리 구조가 아님.

### 1.4 세션별 Context 선택적 로딩 가능 여부

**직접적인 "이번 세션에서는 X context만 로드" 메커니즘은 없음.**

대안적 방법:
- `.geminiignore`로 특정 디렉토리 제외 (토큰 절약)
- `context.fileName` 설정으로 어떤 파일명을 context로 인식할지 제어
- Skills 시스템 사용 (아래 섹션 참조) - progressive disclosure로 필요할 때만 로드
- `/memory reload`로 수동 재스캔

---

## 2. Skill System Performance (스킬 시스템 성능)

### 2.1 Progressive Disclosure (점진적 공개) 아키텍처

Skills는 GEMINI.md의 eager loading과 근본적으로 다른 접근법을 사용한다.

**3단계 적재 모델:**

| 단계 | 적재 내용 | 토큰 비용 | 지속성 |
|------|-----------|-----------|--------|
| Discovery (발견) | name + description만 시스템 프롬프트에 주입 | ~100 words/skill | 전 세션 |
| Activation (활성화) | SKILL.md 전체 body + 디렉토리 구조 | 수백~수천 tokens | 활성화 이후 전 세션 |
| Execution (실행) | 번들 리소스 (scripts/, references/) | 요청 시 | 요청 시 |

**참조:**
- [Agent Skills docs](https://geminicli.com/docs/cli/skills/)
- [Beyond Prompt Engineering - Daniel Strebel](https://medium.com/google-cloud/beyond-prompt-engineering-using-agent-skills-in-gemini-cli-04d9af3cda21)
- [GitHub Issue #15688: Activation Tool](https://github.com/google-gemini/gemini-cli/issues/15688)
- [GitHub Issue #15689: System Prompt Awareness](https://github.com/google-gemini/gemini-cli/issues/15689)

### 2.2 Skill 메타데이터 시스템 프롬프트 주입

구현 상세 (Issue #15689 기반):

1. 세션에 skill이 존재하면 시스템 프롬프트에 **"Skill Guidance" 섹션**이 조건부 추가됨
2. 각 skill의 `name`과 `description`만 포함
3. `activate_skill` 도구는 skill이 존재할 때만 모델에 노출됨 (Dynamic Tool Visibility)
4. 활성화된 skill의 지침은 일반 기본값보다 **우선** 적용됨

### 2.3 Skill 활성화 시 Context 흐름

1. 모델이 `activate_skill` 도구를 호출
2. 사용자 승인 필요 (`ASK_USER` 보안 정책)
3. `SKILL.md` body 전체가 `<ACTIVATED_SKILL>` XML 태그로 감싸져 conversation history에 추가
4. skill 디렉토리가 에이전트의 허용 파일 경로에 추가
5. **skill은 세션이 끝날 때까지 활성 상태 유지** ("remains active for the duration of the session")

### 2.4 43개 Skill의 토큰 오버헤드 추정

**Discovery 단계 비용 (매 턴 고정):**

| 항목 | 추정치 | 근거 |
|------|--------|------|
| Skill당 metadata | ~100 words (~130 tokens) | 공식 문서 "~100 words" |
| 43 skills metadata | ~5,590 tokens | 130 * 43 |
| "Skill Guidance" 섹션 오버헤드 | ~100 tokens | 섹션 헤더, 포맷팅 |
| **총 Discovery 비용** | **~5,700 tokens/턴** | 매 턴마다 시스템 프롬프트에 포함 |

**Activation 단계 비용 (활성화 시 추가):**

| 항목 | 추정치 | 비고 |
|------|--------|------|
| SKILL.md body (평균) | 500~2,000 tokens | skill 복잡도에 따라 |
| 디렉토리 구조 힌트 | ~50 tokens | 폴더 트리 |
| **Skill당 활성화 비용** | **~550~2,050 tokens** | conversation history에 1회 추가 |

> **bkit 영향**: 43개 skill의 metadata만으로 매 턴 ~5,700 tokens가 시스템 프롬프트에 고정 소비됨. 이는 1M context window의 0.5%에 해당하지만, 시스템 프롬프트는 매 API 호출마다 전송되므로 누적 비용이 발생함.

### 2.5 Skill 크기 권장사항

- SKILL.md body는 **500줄 미만** 권장 (community best practice, 공식 docs에는 명시 없음)
- 500줄 초과 시 별도 파일로 분리하여 references/에 번들
- 간결한 description이 핵심 - 모델의 skill 선택 정확도에 직결

---

## 3. Hook System Performance (훅 시스템 성능)

### 3.1 Hook 실행 모델

**동기(Synchronous) 실행**: Hook이 완료될 때까지 에이전트 루프가 차단됨.

> "Hooks run synchronously--slow hooks delay the agent loop."

**타임아웃**: 기본 60초 (60,000ms), `settings.json`에서 커스터마이즈 가능.
빠른 유효성 검사 hook은 5초로 제한 권장.

**실행 전략:**
- `"sequential": true` - 순차 실행
- `"sequential": false` - 병렬 실행

**참조:**
- [Hooks Best Practices](https://geminicli.com/docs/hooks/best-practices/)
- [Hooks Reference](https://geminicli.com/docs/hooks/reference/)

### 3.2 additionalContext 지속성 분석 (핵심 발견)

| Hook Event | additionalContext 지원 | 지속 범위 | 성능 영향 |
|------------|------------------------|-----------|-----------|
| SessionStart | O | interactive: 첫 번째 historical turn으로 추가 / non-interactive: 프롬프트에 prepend | 세션 전체 (history에 남음) |
| BeforeAgent | O | **현재 턴에만** ("for this turn only") | 1턴 한정 |
| AfterTool | O | 해당 도구 결과에 append | 해당 도구 응답 한정 |
| BeforeTool | X | - | - |
| AfterAgent | X | - | clearContext 옵션만 |
| BeforeModel | X | - | llm_request 수정 가능 |
| AfterModel | X | - | - |
| SessionEnd | X | - | 비동기, 무시됨 |

**핵심 발견:**
- **additionalContext는 누적되지 않음**. 각 hook 이벤트별로 독립적으로 범위가 한정됨.
- **BeforeAgent의 additionalContext는 "this turn only"** - 가장 토큰 효율적인 컨텍스트 주입 방법.
- **SessionStart의 additionalContext는 conversation history에 남음** - 압축 시까지 지속.
- BeforeAgent를 통한 "현재 턴 전용" 컨텍스트 주입이 가능 (질문 4번의 답).

**참조:**
- [GitHub docs/hooks/reference.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md)
- [GitHub Issue #15413: SessionStart context injection bug](https://github.com/google-gemini/gemini-cli/issues/15413)

### 3.3 Hook 실행 레이턴시 영향

| Hook Event | 실행 빈도 | 레이턴시 영향 |
|------------|-----------|---------------|
| SessionStart | 세션당 1회 | 낮음 (시작 시 1회) |
| BeforeAgent | 매 턴 | **중간~높음** (매 사용자 입력마다) |
| AfterAgent | 매 턴 | 중간 (매 응답 후) |
| BeforeTool | 도구 호출마다 | **높음** (빈번한 도구 사용 시) |
| AfterTool | 도구 호출마다 | **높음** |
| BeforeModel | 모든 LLM 청크 | **매우 높음** (스트리밍 시 매 청크) |
| AfterModel | 모든 LLM 청크 | **매우 높음** |

> **bkit 영향**: bkit의 11개 hook 중 BeforeAgent/AfterTool hook이 가장 빈번하게 실행됨.
> 각 hook의 실행 시간을 최소화하는 것이 턴당 레이턴시의 핵심.

### 3.4 Hook 성능 최적화 Best Practices

1. **병렬 실행**: `Promise.all()`로 동시 요청 처리
2. **캐싱**: 비용이 큰 연산 결과를 hook 간 캐싱 (시간 기반 만료)
3. **이벤트 선택**: `AfterModel` (매 청크) 대신 `AfterAgent` (턴당 1회) 사용
4. **Matcher 정밀화**: `"*"` 와일드카드 대신 `"write_file|replace"` 같은 정확한 패턴
5. **타임아웃 제한**: 빠른 hook은 5초 제한 설정

---

## 4. Agent System Performance (에이전트 시스템 성능)

### 4.1 Agent Description 적재 방식

Agent(Subagent) 설명은 메인 에이전트의 시스템 프롬프트에 포함되어 모델이 적절한 전문가를 선택할 수 있게 한다.

- Agent 정의: `.gemini/agents/*.md` (프로젝트) 또는 `~/.gemini/agents/*.md` (사용자)
- YAML frontmatter의 `description` 필드가 메인 에이전트에 노출됨
- markdown body가 해당 subagent의 시스템 프롬프트가 됨

### 4.2 21개 Agent의 토큰 오버헤드 추정

| 항목 | 추정치 | 근거 |
|------|--------|------|
| Agent당 description | ~50-100 tokens | 이름 + 짧은 설명 |
| 21 agents metadata | ~1,050~2,100 tokens | 시스템 프롬프트에 포함 |
| Agent 라우팅 안내문 | ~200 tokens | "use expert subagent when available" |
| **총 Agent Discovery 비용** | **~1,250~2,300 tokens/턴** | 매 턴 시스템 프롬프트에 고정 |

**핵심 아키텍처 이점:**
- **Subagent는 별도 context loop에서 실행됨** ("interactions with a subagent happen in a separate context loop")
- subagent와의 대화가 메인 conversation history에 **토큰을 추가하지 않음**
- subagent는 다른 subagent를 호출할 수 없음 (재귀 방지)

### 4.3 `enableAgents: true` 오버헤드

- v0.37.0에서 기본값이 `true`로 복원됨
- `enableAgents: true`일 때: agent descriptions가 시스템 프롬프트에 포함 + `delegate_to_agent` 도구 노출
- `enableAgents: false`일 때: agent 관련 시스템 프롬프트 섹션과 도구 모두 제거
- **오버헤드**: 주로 시스템 프롬프트 크기 증가 (~1,250~2,300 tokens)

**참조:**
- [Subagents docs](https://github.com/google-gemini/gemini-cli/blob/main/docs/core/subagents.md)
- [GitHub Discussion #1471: AGENTS.md thought leadership](https://github.com/google-gemini/gemini-cli/discussions/1471)

---

## 5. Context Management Configuration (컨텍스트 관리 설정)

### 5.1 토큰 관리 설정 전체 맵

```jsonc
{
  // 컨텍스트 압축
  "model.compressionThreshold": 0.5,  // context 사용률 50%에서 압축 트리거
  // (구버전: model.chatCompression.contextPercentageThreshold = 0.7)

  // History Window
  "contextManagement.historyWindow.maxTokens": 150000,      // 압축 트리거 토큰 수
  "contextManagement.historyWindow.retainedTokens": 40000,   // 항상 유지할 토큰 수

  // Message Limits (턴당)
  "contextManagement.messageLimits.normalMaxTokens": 2500,           // 일반 턴 토큰 예산
  "contextManagement.messageLimits.retainedMaxTokens": 12000,        // 최대 단일 턴 토큰
  "contextManagement.messageLimits.normalizationHeadRatio": 0.25,    // 절단 시 앞부분 유지 비율

  // Tool Output 관리
  "contextManagement.tools.distillation.maxOutputTokens": 10000,           // 도구 출력 절단 최대
  "contextManagement.tools.distillation.summarizationThresholdTokens": 20000,  // LLM 요약 트리거
  "contextManagement.tools.outputMasking.protectionThresholdTokens": 50000,    // 마스킹 보호 임계
  "contextManagement.tools.outputMasking.minPrunableThresholdTokens": 30000,   // 마스킹 가능 최소
  "contextManagement.tools.outputMasking.protectLatestTurn": true,             // 최신 턴 보호

  // Per-tool 요약 예산
  "model.summarizeToolOutput": {
    "run_shell_command": { "tokenBudget": 2000 }
  },

  // Session 제한
  "model.maxSessionTurns": -1  // 무제한 (-1)
}
```

**참조:**
- [Configuration docs](https://geminicli.com/docs/reference/configuration/)
- [GitHub Issue #12068: COMPRESSION_TOKEN_THRESHOLD](https://github.com/google-gemini/gemini-cli/issues/12068)

### 5.2 Context 압축 메커니즘

| 기법 | 설명 | 트리거 |
|------|------|--------|
| Auto-Compression | 임계값 초과 시 자동 요약 | `compressionThreshold` (기본 0.5) |
| Manual Compression | `/compress` 명령 | 사용자 수동 |
| Output Masking | 오래된 도구 출력을 마스킹 | `protectionThresholdTokens` 초과 |
| Stale Output Elision | 수정된 파일의 이전 읽기 결과 제거 | 파일 수정 감지 |
| Semantic Elision | 반복 실패를 단일 블록으로 축약 | 동일 패턴 반복 감지 |
| Auto-Distillation | 대량 도구 출력을 경량 모델로 필터 | `summarizationThresholdTokens` 초과 |
| Token Caching | API 레벨에서 시스템 지침 재사용 | 자동 (API key 인증 시) |

### 5.3 Token Caching (API 레벨 최적화)

- API key 또는 Vertex AI 인증 시 자동 활성화
- 시스템 지침(system instructions)과 context를 재사용하여 후속 요청의 처리 토큰 절감
- OAuth 사용자는 미지원 (Code Assist API 한계)
- `/stats` 명령으로 캐시 절약량 확인 가능

**참조:**
- [Token Caching docs](https://geminicli.com/docs/cli/token-caching/)

---

## 6. Known Issues & Community Reports (알려진 이슈)

### 6.1 성능 관련 GitHub Issues

| Issue | 제목 | 핵심 내용 | bkit 관련성 |
|-------|------|-----------|-------------|
| [#13198](https://github.com/google-gemini/gemini-cli/issues/13198) | Excessive Token Consumption | v0.14.0부터 모델이 같은 내용 반복 읽기, 50K -> 5M 토큰 | 높음: extension context가 반복 읽기 유발 가능 |
| [#2479](https://github.com/google-gemini/gemini-cli/issues/2479) | Unexpectedly high token usage | 예상치 못한 토큰 폭주 | 중간 |
| [#11488](https://github.com/google-gemini/gemini-cli/issues/11488) | Refactor to Dynamic JIT Context | eager loading의 토큰 낭비 문제 제기 | **높음**: bkit의 context 전략에 직결 |
| [#10726](https://github.com/google-gemini/gemini-cli/issues/10726) | Critical Slowdown in Startup (60s) | 시작 시간 60초까지 증가 | 중간: extension 수에 비례 |
| [#20372](https://github.com/google-gemini/gemini-cli/issues/20372) | Slow startup from networked storage | 네트워크 스토리지의 extension 로딩 지연 | 낮음 |
| [#12068](https://github.com/google-gemini/gemini-cli/issues/12068) | COMPRESSION_TOKEN_THRESHOLD 0.7 | 압축 임계값 적정성 논의 | 중간: 커스텀 설정 가이드 |
| [#15413](https://github.com/google-gemini/gemini-cli/issues/15413) | SessionStart additionalContext bug | SessionStart hook의 context 주입 미작동 (수정됨) | 높음: bkit SessionStart hook 의존 |
| [#21792](https://github.com/google-gemini/gemini-cli/issues/21792) | Epic: Session Continuity | output masking, elision, scratchpad 등 계획 | 미래 최적화 참고 |
| [#3859](https://github.com/google-gemini/gemini-cli/issues/3859) | Token limit without conversation | 대화 없이 토큰 한도 도달 | 높음: 과도한 context 적재 시 |

### 6.2 Eager Loading 문제점 (Issue #11488 분석)

현재의 eager loading이 야기하는 3가지 문제:

1. **Token Bloat**: "즉시 context window를 잠재적으로 무관한 하위 디렉토리의 지침으로 범람"
2. **Noise & Distraction**: 먼 코드베이스 부분의 충돌/무관한 규칙이 응답 품질 저하
3. **Startup Latency**: 대규모 디렉토리 구조의 BFS 탐색이 초기 로드 시간 증가

> **v0.37.0 상태**: JIT context가 `false`로 복원되어 eager loading이 기본 동작.
> 이 이슈의 제안(hybrid 3-tier)은 아직 완전히 구현되지 않음.

---

## 7. bkit Extension의 토큰 오버헤드 총 추정

### 7.1 매 턴 고정 비용 (시스템 프롬프트)

| 구성 요소 | 추정 토큰 | 비고 |
|-----------|-----------|------|
| GEMINI.md (global + workspace) | 1,000~5,000 | bkit의 GEMINI.md 크기에 따라 |
| @import된 파일들 | 파일 크기 합계 | 매 턴 전량 전송 |
| 43 Skills metadata | ~5,700 | name + description * 43 |
| 21 Agents metadata | ~1,750 | description * 21 |
| Skill Guidance 섹션 | ~100 | 섹션 헤더 |
| Agent 라우팅 안내 | ~200 | routing instructions |
| activate_skill 도구 스키마 | ~100 | tool definition |
| delegate_to_agent 도구 스키마 | ~100 | tool definition |
| **고정 합계 (GEMINI.md 제외)** | **~7,950 tokens** | 매 API 호출마다 |

### 7.2 가변 비용 (세션 중)

| 구성 요소 | 추정 토큰 | 트리거 |
|-----------|-----------|--------|
| Skill 활성화 (건당) | 550~2,050 | activate_skill 호출 시 |
| Hook additionalContext (BeforeAgent) | 가변 | 매 턴 (설정에 따라) |
| Hook additionalContext (SessionStart) | 가변 | 세션 시작 1회 |
| Subagent 대화 | 0 (별도 loop) | delegate_to_agent 호출 시 |

### 7.3 토큰 효율성 분석

| 항목 | 1M context 대비 | 150K history 대비 | 평가 |
|------|----------------|-------------------|------|
| Skills+Agents metadata (~7,950) | 0.8% | 5.3% | 양호 |
| + GEMINI.md 3,000 tokens | 1.1% | 7.3% | 주의 필요 |
| + @import 10,000 tokens | 2.1% | 13.9% | **경고** |
| + SessionStart context 5,000 | 2.6% | 17.2% | **경고** |

> **핵심 인사이트**: 1M context window 기준으로는 여유가 있지만,
> `historyWindow.maxTokens` 기본값 150,000 기준으로는 시스템 프롬프트가
> 가용 history의 상당 부분을 차지할 수 있음.

---

## 8. Performance Optimization Recommendations (성능 최적화 권고)

### 8.1 Context Loading 최적화

| 우선순위 | 권고 사항 | 예상 절감 | 난이도 |
|----------|-----------|-----------|--------|
| P1 | GEMINI.md를 최소한으로 유지 (핵심 지침만) | 수천 tokens/턴 | 낮음 |
| P1 | @import는 진정으로 매 턴 필요한 내용만 | @import 파일 크기 | 낮음 |
| P2 | 상세 가이드를 skills로 이동 (progressive disclosure) | 수천 tokens/턴 | 중간 |
| P2 | `.geminiignore`로 불필요한 하위 디렉토리 제외 | 가변 | 낮음 |
| P3 | BeforeAgent hook으로 턴 전용 context 주입 | SessionStart 대비 절감 | 중간 |

### 8.2 Skill 최적화

| 우선순위 | 권고 사항 | 근거 |
|----------|-----------|------|
| P1 | Skill description을 1-2문장으로 제한 | metadata가 매 턴 시스템 프롬프트에 포함 |
| P1 | SKILL.md body를 500줄 미만으로 유지 | 활성화 시 conversation history에 추가 |
| P2 | 대용량 참조 자료를 references/로 분리 | body와 별도로 필요 시 로드 |
| P2 | 유사 기능의 skills를 통합하여 총 수 감소 | skill 수 * ~130 tokens 절감 |
| P3 | skill 미사용 시 enableSkills 비활성화 검토 | metadata 비용 완전 제거 |

### 8.3 Hook 최적화

| 우선순위 | 권고 사항 | 근거 |
|----------|-----------|------|
| P1 | BeforeAgent additionalContext 활용 (턴 전용) | SessionStart보다 토큰 효율적 |
| P1 | Hook 실행 시간 최소화 (5초 타임아웃 권장) | 동기 실행으로 agent loop 차단 |
| P2 | AfterModel 대신 AfterAgent 사용 | AfterModel은 매 스트리밍 청크마다 실행 |
| P2 | Matcher 정밀화 (와일드카드 최소화) | 불필요한 프로세스 생성 방지 |
| P3 | Hook 결과 캐싱 구현 | 반복 연산 방지 |

### 8.4 Agent 최적화

| 우선순위 | 권고 사항 | 근거 |
|----------|-----------|------|
| P1 | Agent description을 간결하게 (1-2문장) | 시스템 프롬프트 크기 최소화 |
| P2 | 유사 역할의 agents 통합 | agent 수 * ~100 tokens 절감 |
| P3 | 미사용 agents 정리 | 불필요한 metadata 제거 |

---

## 9. bkit에 대한 전략적 시사점

### 9.1 현재 bkit 아키텍처 평가

bkit v2.0.3는 43 skills + 21 agents + 11 hooks를 포함하는 대규모 extension이다.

**긍정적:**
- Skills의 progressive disclosure가 context bloat을 효과적으로 방지
- Subagents의 별도 context loop가 main conversation을 보호
- Hook의 per-turn context injection이 유연한 컨텍스트 관리 제공

**우려 사항:**
- 43 skills의 metadata만으로 ~5,700 tokens/턴 (history 150K 기준 3.8%)
- GEMINI.md + @import의 eager loading이 추가 부담
- SessionStart hook의 context가 영구 지속되어 압축까지 남음

### 9.2 권장 조사 후속 과제

1. **실측**: bkit extension 활성화 전/후 `/stats`로 실제 토큰 사용량 측정
2. **GEMINI.md 감량**: 현재 GEMINI.md + @import 전체 토큰 수 측정 및 최적화
3. **Skill 통합 검토**: 43개 skill 중 유사/중복 기능 통합 가능성 분석
4. **BeforeAgent 활용**: SessionStart 대신 BeforeAgent로 턴 전용 context 주입 전환 검토
5. **v0.38.0 모니터링**: ContextCompressionService, Background Memory Service 등 새 기능 추적

---

## 10. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Context Loading 아키텍처 | HIGH | 공식 docs + GitHub issues + source code issues로 교차 검증 |
| Skill Progressive Disclosure | HIGH | 공식 docs + 구현 PR (#15725) + 설계 Issue (#15688, #15689) |
| Hook additionalContext 지속성 | HIGH | 공식 reference docs + bug fix PR (#15746) |
| 토큰 수치 추정 | MEDIUM | "~100 words/skill" 공식 언급 기반 추정, 실측 필요 |
| Agent 오버헤드 | MEDIUM | 아키텍처 문서 기반 추론, 정확한 수치는 실측 필요 |
| 성능 최적화 권고 | HIGH | 공식 best practices + community 경험 + 아키텍처 분석 종합 |
| v0.38.0 계획 사항 | LOW | Epic issue 기반, 구현 미확인 |

---

## 11. 원문 참조 링크

### 공식 문서
- [Provide context with GEMINI.md files](https://geminicli.com/docs/cli/gemini-md/)
- [Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Extension Reference](https://geminicli.com/docs/extensions/reference/)
- [Extension Best Practices](https://geminicli.com/docs/extensions/best-practices/)
- [Configuration](https://geminicli.com/docs/reference/configuration/)
- [Hooks Reference](https://geminicli.com/docs/hooks/reference/)
- [Hooks Best Practices](https://geminicli.com/docs/hooks/best-practices/)
- [Token Caching](https://geminicli.com/docs/cli/token-caching/)

### GitHub Issues / PRs
- [#11488: Refactor to Dynamic JIT Context](https://github.com/google-gemini/gemini-cli/issues/11488)
- [#15688: Activation Tool Implementation](https://github.com/google-gemini/gemini-cli/issues/15688)
- [#15689: System Prompt Awareness](https://github.com/google-gemini/gemini-cli/issues/15689)
- [#15413: SessionStart additionalContext bug](https://github.com/google-gemini/gemini-cli/issues/15413)
- [#15746: Fix SessionStart context injection](https://github.com/google-gemini/gemini-cli/pull/15746)
- [#12068: COMPRESSION_TOKEN_THRESHOLD discussion](https://github.com/google-gemini/gemini-cli/issues/12068)
- [#13198: Excessive Token Consumption](https://github.com/google-gemini/gemini-cli/issues/13198)
- [#21792: Epic - Session Continuity](https://github.com/google-gemini/gemini-cli/issues/21792)
- [#3859: Token limit without conversation](https://github.com/google-gemini/gemini-cli/issues/3859)

### 기술 블로그 / 분석
- [A Look at Context Engineering in Gemini CLI - Paul Datta](https://aipositive.substack.com/p/a-look-at-context-engineering-in)
- [Gemini CLI Tips & Tricks - Addy Osmani](https://addyo.substack.com/p/gemini-cli-tips-and-tricks)
- [Agent Skills Introduction - MCP Toolbox](https://medium.com/google-cloud/your-gemini-cli-extensions-just-got-smarter-introducing-agent-skills-a8fbfa077e7f)
- [Beyond Prompt Engineering - Daniel Strebel](https://medium.com/google-cloud/beyond-prompt-engineering-using-agent-skills-in-gemini-cli-04d9af3cda21)
- [Agent Skills Deep Dive - danicat.dev](https://danicat.dev/posts/agent-skills-gemini-cli/)

### GitHub 문서 (소스)
- [docs/hooks/reference.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md)
- [docs/core/subagents.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/core/subagents.md)
- [docs/cli/gemini-md.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md)

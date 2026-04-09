# Gemini CLI Extension System: Constraints & Limitations 심층 분석

> 조사일: 2026-04-09
> 조사 범위: Gemini CLI v0.36.0~v0.37.0 Extension Architecture
> 목적: bkit-gemini가 Gemini CLI extension으로서 가지는 **구조적 한계** 식별
> 비교 대상: bkit-claude-code v1.6.1 (Claude Code plugin)

---

## Executive Summary

| 제약 카테고리 | 심각도 | 항목 수 | bkit 영향 |
|-------------|--------|--------|----------|
| Hook System 한계 | CRITICAL | 6 | 이벤트 부족으로 Claude Code 수준 오케스트레이션 불가 |
| Agent System 한계 | CRITICAL | 5 | 팀/병렬 에이전트 아키텍처 불가 |
| Skill System 한계 | HIGH | 4 | Skills는 프롬프트 주입이며 코드 실행 주체 아님 |
| Context Engineering 한계 | HIGH | 4 | 프로그래매틱 토큰 관리 불가 |
| Policy/Automation 한계 | MEDIUM | 3 | 확장이 trust/yolo bypass 불가 |
| Extension Packaging 한계 | MEDIUM | 3 | 확장이 핵심 런타임 제어 불가 |

**핵심 결론**: Gemini CLI extension은 "관찰자 + 조언자" 역할에 제한된다. Claude Code plugin이 가능한 "런타임 제어자" 역할은 구조적으로 불가능하다.

---

## 1. Hook System Constraints (CRITICAL)

### 1.1 사용 가능한 Hook Events (11개)

| Event | Trigger | 수정 가능 범위 | 제약 |
|-------|---------|--------------|------|
| `SessionStart` | 시작/재개/clear | additionalContext 주입, systemMessage 표시 | **블로킹 불가** (advisory only) |
| `BeforeAgent` | 사용자 프롬프트 후, planning 전 | 프롬프트에 context 추가, deny로 프롬프트 삭제 | 프롬프트 **대체** 불가, 추가만 가능 |
| `AfterAgent` | 턴 종료 후 | deny로 재시도 강제, clearContext | 턴당 1회만 발화 |
| `BeforeModel` | LLM 요청 전 | llm_request 오버라이드, 합성 응답 반환 | 메시지 구조 이해 필요, 시스템 프롬프트 직접 수정 가능하나 **비공식** |
| `AfterModel` | LLM 응답 청크 수신 후 | 청크 교체, deny로 폐기 | **청크 단위** 발화 (스트리밍), 성능 위험 |
| `BeforeToolSelection` | 도구 선택 전 | toolConfig.mode, allowedFunctionNames | decision/continue/systemMessage **미지원** |
| `BeforeTool` | 도구 실행 전 | deny로 차단, tool_input 수정 | 도구 **대체**(다른 도구로 전환) 불가 |
| `AfterTool` | 도구 실행 후 | deny로 결과 숨김, additionalContext 추가, tailToolCallRequest | 실행 **취소** 불가 (이미 실행됨) |
| `SessionEnd` | 종료 | systemMessage 표시 | **best-effort**, CLI가 대기 안 함, flow-control 무시 |
| `Notification` | 시스템 알림 발생 | systemMessage 표시 | **관찰 전용**, 차단 불가 |
| `PreCompress` | 히스토리 압축 전 | systemMessage 표시 | **비동기 advisory**, 압축 수정/차단 불가 |

**참조**: [Hooks Reference](https://geminicli.com/docs/hooks/reference/), [Writing Hooks](https://geminicli.com/docs/hooks/writing-hooks/)

### 1.2 Claude Code 대비 누락된 Hook Events

| Claude Code Event | 용도 | Gemini CLI 대응 | Gap 심각도 |
|-------------------|------|----------------|-----------|
| `SubagentStart` | 서브에이전트 시작 감지 | **없음** | CRITICAL - 팀 오케스트레이션 불가 |
| `SubagentStop` | 서브에이전트 완료 감지 | **없음** | CRITICAL - 결과 수집/조합 불가 |
| `TeammateIdle` | 팀원 에이전트 유휴 감지 | **없음** (개념 자체 부재) | CRITICAL - 동적 작업 분배 불가 |
| `PostToolUse` | 도구 사용 후 검증 (되돌릴 수 있음) | `AfterTool` (부분 대응) | MEDIUM - AfterTool은 결과 숨김만 가능, 되돌리기 불가 |
| `UserPromptSubmit` | 사용자 입력 전처리 | `BeforeAgent` (대체 가능) | LOW - 기능적으로 대체 가능 |
| `PreCompact` | 컨텍스트 압축 전 | `PreCompress` (대응) | LOW - 유사 기능 |
| `TaskCompleted` | 태스크 완료 감지 | **없음** | HIGH - PDCA 단계 전환 자동화 불가 |

### 1.3 Hook 실행 모델 제약

```
[CONSTRAINT] 동기 실행 (Synchronous Blocking)
- 모든 훅은 에이전트 루프 내에서 동기적으로 실행
- 훅이 완료될 때까지 CLI가 대기
- 장시간 실행 훅 = 에이전트 응답 지연
- 기본 타임아웃: 60초

[CONSTRAINT] JSON-over-stdio 통신
- stdin으로 JSON 수신, stdout으로 JSON 반환
- stdout에 JSON 외 출력 시 즉시 파싱 실패 (Golden Rule)
- CLI 내부 상태에 직접 접근 불가
- JSON으로 직렬화 가능한 데이터만 교환 가능

[CONSTRAINT] 프로세스 격리
- 훅은 별도 프로세스(subprocess)로 실행
- CLI 메모리, 변수, 상태에 직접 접근 불가
- 훅 간 직접 통신 불가 (HookAggregator가 중재)
- 파일시스템을 통한 간접 통신만 가능
```

### 1.4 BeforeModel의 가능성과 한계

BeforeModel은 가장 강력한 훅이지만 명확한 한계가 있다:

**가능한 것:**
- `hookSpecificOutput.llm_request`로 모델명, temperature, 메시지 배열 수정
- `hookSpecificOutput.llm_response`로 합성 응답 반환 (LLM 호출 스킵)
- 도구 설정 수정

**불가능한 것:**
- 시스템 프롬프트의 **구조적 수정** (메시지 배열 내 시스템 메시지 위치/형식은 CLI 내부 구현에 의존)
- **선택적 메시지 삭제** (히스토리에서 특정 턴만 제거)
- **토큰 카운트 접근** (요청에 토큰 정보 미포함)
- **컨텍스트 윈도우 잔여 용량 확인**

**참조**: [BeforeModel Reference](https://geminicli.com/docs/hooks/reference/), [Hooks Best Practices](https://geminicli.com/docs/hooks/best-practices/)

---

## 2. Agent System Constraints (CRITICAL)

### 2.1 서브에이전트 구조적 한계

| 제약 | 설명 | 영향 |
|-----|------|------|
| **재귀 호출 금지** | 서브에이전트가 다른 서브에이전트를 호출할 수 없음. `*` 와일드카드로 모든 도구 접근해도 다른 에이전트 도구는 보이지 않음 | CTO-lead -> frontend-architect -> component-designer 같은 다층 위임 불가 |
| **병렬 실행 미지원** | 공식적으로 병렬 서브에이전트 실행 미지원. 순차적 보고만 가능 | Claude Code Agent Teams (최대 10개 동시 에이전트) 대비 불가 |
| **컨텍스트 격리** | 서브에이전트는 독립 컨텍스트 루프에서 실행. 메인 에이전트와 히스토리 공유 안 함 | 장점(토큰 절약)이자 단점(컨텍스트 전달 비용) |
| **결과 압축** | 서브에이전트 결과는 단일 요약 메시지로 압축되어 반환 | 반복적 다턴 상호작용 불가 |
| **최대 턴/타임아웃** | 기본 30턴, 10분 타임아웃 | 장기 복합 작업에 제한 |

**참조**: [Subagents](https://geminicli.com/docs/core/subagents/), [DeepWiki Analysis](https://deepwiki.com/google-gemini/gemini-cli/3.11-agent-skills-and-sub-agents)

### 2.2 Agent Teams 부재

| 기능 | Claude Code | Gemini CLI | 상태 |
|------|------------|------------|------|
| 팀 개념 | Agent Teams (실험적) | **없음** | [Feature Request #19430](https://github.com/google-gemini/gemini-cli/issues/19430) - need-triage |
| 병렬 에이전트 | 최대 10개 동시 실행 | 불가 | 커뮤니티: tmux + git worktree 워크어라운드 |
| 에이전트간 직접 통신 | 공유 태스크 리스트 | 불가 (부모-자식만) | A2A 프로토콜은 원격 에이전트 전용 |
| 동적 작업 분배 | TeammateIdle 이벤트 | 없음 | 개념 자체 부재 |
| 태스크 큐 | TaskCreate/TaskUpdate 도구 | 없음 | Plan Mode의 todo만 존재 |
| 의존성 추적 | 에이전트 간 종속성 | 불가 | 서브에이전트 결과만 반환 |

**핵심 영향**: bkit-claude-code의 5가지 오케스트레이션 패턴(Leader/Council/Swarm/Pipeline/Watchdog) 중 Gemini CLI에서 구현 가능한 것은 **Leader 패턴만** (순차적 서브에이전트 호출).

### 2.3 배경 에이전트(Background Agent) 상태

- [Issue #4168](https://github.com/google-gemini/gemini-cli/issues/4168): "Run autonomous background Agents" - **In Design** (P1, Public Roadmap)
- Ctrl+B로 장시간 프로세스(dev server 등)는 백그라운드 실행 가능하나, **자율 에이전트 백그라운드 실행**은 미구현
- Cloud Run 배포 또는 Jules 통합이 제안되었으나 구현 미완료
- **Extensions에서 배경 에이전트를 프로그래매틱으로 시작/관리하는 API 없음**

### 2.4 에이전트 lib/ 모듈 접근

| 질문 | 답변 |
|------|------|
| 에이전트가 lib/ JS 모듈을 import할 수 있는가? | **아니오**. 에이전트는 `.md` 파일(마크다운 프롬프트)이며 코드 실행 주체가 아님 |
| 에이전트가 스크립트를 실행할 수 있는가? | **간접적**. 도구(run_shell_command 등)를 통해서만 가능 |
| 에이전트 간 공유 상태가 있는가? | **아니오**. 각 에이전트는 격리된 컨텍스트 |
| Extensions이 에이전트 모델을 선택할 수 있는가? | **간접적**. BeforeModel 훅으로 모델명 오버라이드 가능 |

---

## 3. Skill System Constraints (HIGH)

### 3.1 Skills의 본질: 프롬프트 주입

```
Skills = 마크다운 지침서 (SKILL.md)
       + 선택적 리소스 (scripts/, references/, assets/)
       + 메타데이터 (name, description)

Skills != 실행 가능한 코드
Skills != 에이전트
Skills != 도구
```

### 3.2 Skills 구조적 한계

| 제약 | 설명 | Claude Code 비교 |
|-----|------|-----------------|
| **코드 직접 실행 불가** | Skills 자체는 코드를 실행하지 않음. 스크립트를 "번들"할 수 있으나, 에이전트가 도구를 통해 실행해야 함 | Claude Code skills도 마크다운이나, PreToolUse/PostToolUse 훅과 결합하여 자동 실행 파이프라인 구성 가능 |
| **에이전트 호출 불가** | Skills에서 서브에이전트를 직접 호출하는 메커니즘 없음 | Claude Code에서도 동일 |
| **활성화 시 전체 로딩** | [Issue #15895](https://github.com/google-gemini/gemini-cli/issues/15895) - Level 3 (리소스 on-demand 로딩) 미구현. 활성화 시 모든 리소스가 한번에 로딩 | 컨텍스트 블로트 위험 |
| **시맨틱 리소스 구분 부재** | `scripts/`, `references/`, `assets/` 폴더의 의미적 차이를 CLI가 이해하지 못함. 평면 파일 목록으로 반환 | 실행 파일 vs 참조 문서 구분 불가 |
| **프론트매터 필드 무시** | `compatibility`, `allowed-tools`, `metadata` 필드 파싱하지 않음 | 전제조건 검증, 도구 게이팅 불가 |
| **세션 종료 시 유지** | 활성화된 스킬은 세션 지속 동안 활성 상태 유지 (비활성화 불가?) | 동적 스킬 전환 제한 |

### 3.3 Skill vs Agent 비교표 (Gemini CLI 내부)

| 측면 | Skill | Agent (서브에이전트) |
|------|-------|-------------------|
| 본질 | 프롬프트 증강(주입) | 독립 실행 인스턴스 |
| 실행 컨텍스트 | **메인 에이전트와 동일** | **격리된 컨텍스트** |
| 히스토리 | 메인 히스토리에 누적 | 요약으로 압축 반환 |
| 활성화 | `activate_skill` 도구 호출 | 에이전트 이름으로 도구 호출 |
| 도구 접근 | 메인 에이전트의 모든 도구 | 명시적으로 부여된 도구만 |
| 상태 | 세션 종료까지 지속 | 작업 완료 시 종료 |
| 토큰 비용 | **누적** (메인 컨텍스트에 추가) | **격리** (별도 윈도우) |

**참조**: [Agent Skills](https://geminicli.com/docs/cli/skills/), [Issue #15895](https://github.com/google-gemini/gemini-cli/issues/15895)

---

## 4. Context Engineering Constraints (HIGH)

### 4.1 프로그래매틱 컨텍스트 제어 불가

| 기능 | 가능 여부 | 방법 | 한계 |
|------|----------|------|------|
| 초기 컨텍스트 주입 | O | SessionStart hook `additionalContext` | 정적 주입만, 동적 판단 불가 |
| 턴별 컨텍스트 추가 | O | BeforeAgent hook `additionalContext` | 기존 컨텍스트 제거 불가, 추가만 |
| LLM 요청 수정 | O | BeforeModel hook `llm_request` | 전체 메시지 배열 이해 필요 |
| 토큰 카운트 접근 | **X** | N/A | 훅 입력에 토큰 정보 미포함 |
| 컨텍스트 윈도우 잔여량 확인 | **X** | N/A | API 미제공 |
| 특정 히스토리 항목 삭제 | **X** | N/A | AfterAgent `clearContext`는 **전체** 삭제만 |
| JIT 컨텍스트 로딩 확장 | **X** | N/A | 내부 ContextManager 전용, 확장 API 미노출 |
| GEMINI.md 동적 수정 | 간접 | 파일시스템 직접 수정 | CLI 재시작 전까지 반영 불확실 |
| 시스템 프롬프트 교체 | 간접 | `GEMINI_SYSTEM_MD` 환경변수 | 세션 시작 전에만 설정 가능 |

### 4.2 3-Tier Context 시스템의 확장 한계

```
Tier 1: ~/.gemini/GEMINI.md (Global)
Tier 2: {project}/.gemini/GEMINI.md (Project) 
Tier 3: {subdirectory}/.gemini/GEMINI.md (Subdirectory - JIT)

[CONSTRAINT] Extensions이 Tier 구조를 수정하거나 새 Tier를 추가할 수 없음
[CONSTRAINT] contextFileName으로 파일명만 변경 가능 (구조 변경 불가)
[CONSTRAINT] memoryBoundaryMarkers로 경계만 커스텀 가능
[CONSTRAINT] JIT 컨텍스트 로딩 (experimental.jitContext)은 내부 전용
```

### 4.3 토큰 관리 Gap

- Gemini API 자체는 `countTokens` API를 제공하지만, **Gemini CLI가 이를 훅에 노출하지 않음**
- 커뮤니티 확장(gemini-context-extension)이 존재하나, CLI 외부에서 별도 추적
- **Extensions이 현재 컨텍스트 크기를 알 수 있는 방법 없음**
- PreCompress 훅이 압축 시점을 알려주지만, 수정/차단 불가

---

## 5. Extension Packaging Constraints (MEDIUM)

### 5.1 gemini-extension.json 제약

| 필드 | 가능 | 제약 |
|------|------|------|
| `mcpServers` | MCP 서버 자동 시작 | `trust` 옵션 **사용 불가** (사용자 확인 우회 불가) |
| `excludeTools` | 특정 도구 차단 | 도구 **추가**는 MCP를 통해서만 가능 |
| `contextFileName` | GEMINI.md 파일명 변경 | 파일 **내용** 프로그래매틱 수정 불가 |
| `settings` | 환경변수 기반 설정 | `sensitive: true`로 키체인 저장 가능 |
| `hooks` | `hooks/hooks.json`에 정의 | 프로젝트/사용자 훅보다 **낮은 우선순위** |
| `skills` | 스킬 번들 | 확장 스킬은 최하위 우선순위 (Workspace > User > Extension) |
| `agents` | 에이전트 번들 | 같은 우선순위 구조 |
| `policies` | 정책 번들 | **`allow` 결정과 `yolo` 모드 무시됨** (보안 제한) |
| `commands` | 커스텀 명령 | 충돌 시 확장명 접두사 강제 (e.g., `/bkit.deploy`) |
| `themes` | UI 테마 | 색상만 (레이아웃 변경 불가) |

### 5.2 확장이 할 수 **없는** 것

```
[CANNOT] 코어 CLI 동작 수정
[CANNOT] 에이전트 루프 구조 변경
[CANNOT] 도구 실행 엔진 교체
[CANNOT] 컨텍스트 관리자 교체/확장
[CANNOT] 모델 라우팅 로직 교체 (BeforeModel로 모델명만 변경 가능)
[CANNOT] 사용자 확인 우회 (trust/yolo는 확장 정책에서 무시)
[CANNOT] 인터랙티브 CLI 모드에서 확장 명령 사용
[CANNOT] 핫 리로드 (세션 재시작 필요)
[CANNOT] 다른 확장과 직접 통신
```

### 5.3 Policy Engine 확장 제약

| 계층 | 우선순위 | 확장 가능 |
|------|---------|----------|
| Admin | 5 (최고) | 아니오 |
| User | 4 | 아니오 (사용자 직접 설정) |
| Workspace | 3 | 아니오 (프로젝트 직접 설정) |
| **Extension** | **2** | **예** (여기에만 정책 추가 가능) |
| Default | 1 (최저) | 아니오 |

**핵심 제약**: 확장 정책에서 `allow` 결정은 **무시**됨. `deny`와 `ask_user`만 유효.
- 확장은 도구를 **차단**할 수 있지만 **자동 승인**할 수 없음
- YOLO 모드를 확장에서 활성화할 수 없음
- 품질 게이트(deny)는 구현 가능하나, 자동 진행(allow)은 불가

**참조**: [Extension Reference](https://geminicli.com/docs/extensions/reference/), [Policy Engine](https://geminicli.com/docs/reference/policy-engine/)

---

## 6. bkit 핵심 기능별 실현 가능성 분석

### 6.1 Claude Code bkit vs Gemini CLI bkit 구현 가능성

| bkit 기능 | Claude Code 구현 | Gemini CLI 구현 가능성 | 대안 |
|----------|-----------------|---------------------|------|
| **CTO Team 오케스트레이션** | Agent Teams + 5패턴 | 불가 (Leader만 가능) | 순차적 서브에이전트 호출로 단순화 |
| **PDCA 자동 단계 전환** | TaskCompleted hook | 불가 | AfterAgent hook에서 결과 분석 후 다음 단계 제안 |
| **품질 게이트 (Phase 차단)** | PreToolUse + PostToolUse | 부분 가능 | BeforeTool deny로 특정 도구 차단, AfterAgent deny로 재시도 강제 |
| **Template Validator** | PostToolUse hook | 부분 가능 | AfterTool hook에서 문서 내용 검증 (되돌리기 불가) |
| **lib/ 208 exports** | JS 모듈 직접 import | 불가 | 스크립트를 MCP 서버 또는 도구로 래핑 |
| **Executive Summary 자동 출력** | Stop hook | 부분 가능 | AfterAgent hook `systemMessage` |
| **Feature Usage Report** | 매 응답 자동 출력 | 부분 가능 | AfterAgent hook에서 추적 |
| **PM Agent Team (5개)** | 5개 병렬 에이전트 | 순차만 가능 | 서브에이전트로 1개씩 순차 호출 |
| **모델 자동 선택** | 에이전트별 모델 지정 | 가능 | BeforeModel hook으로 모델 오버라이드 |
| **배경 에이전트 관리** | 미지원 (실험적) | 미지원 (설계 중) | 양쪽 모두 미성숙 |
| **Loop/Batch 스킬** | 반복/병렬 실행 | 반복만 부분 가능 | 서브에이전트 순차 호출 |
| **Level 시스템 (L0-L4)** | Skills + Hooks 조합 | 가능 | Skills + Policy 조합 |
| **Automation Level 제어** | hooks로 승인 자동화 | 부분 가능 | 정책 deny만 가능, allow 불가 |

### 6.2 Plan Mode 활용 (기회)

Plan Mode는 bkit PDCA와 자연스러운 정렬 가능:

| Plan Mode 기능 | bkit 활용 가능성 |
|---------------|-----------------|
| `enter_plan_mode` / `exit_plan_mode` 도구 | BeforeTool/AfterTool 훅으로 PDCA Plan 단계와 연동 가능 |
| `plan.modelRouting` (Pro->Flash 자동 전환) | PDCA Plan(Pro) -> Do(Flash) 모델 최적화 |
| 비대화형 모드에서 자동 승인 | CI/CD 파이프라인에서 PDCA 자동화 가능 |
| Plan 디렉토리 설정 | bkit plan 디렉토리와 통합 |

### 6.3 A2A 프로토콜 (기회)

원격 서브에이전트를 통한 확장 가능성:

| 기능 | 상태 | bkit 활용 |
|------|------|----------|
| HTTP/HTTPS 원격 에이전트 | 안정 | 전문 분석 서버 연동 가능 |
| 4가지 인증 방식 | 안정 | OAuth, API Key 지원 |
| 에이전트 카드 기반 발견 | 안정 | 동적 에이전트 등록 가능 |
| 혼합 로컬+원격 | **미지원** | 단일 파일에 로컬+원격 혼합 불가 |

---

## 7. 구조적 불가능 항목 (Hard Constraints)

아래 항목들은 Gemini CLI 아키텍처 변경 없이는 구현 불가능하다:

### 7.1 절대 불가능 (Architecture-level)

1. **에이전트 재귀 호출**: 서브에이전트가 다른 서브에이전트를 호출할 수 없음 - CLI 코어 제한
2. **병렬 에이전트 실행**: Agent Teams 개념 부재 - [Feature Request #19430](https://github.com/google-gemini/gemini-cli/issues/19430)
3. **에이전트간 직접 메시징**: 부모-자식 관계만 존재
4. **CLI 내부 상태 접근**: 훅은 subprocess로 격리
5. **토큰 카운트 실시간 접근**: 훅 입력에 미포함
6. **컨텍스트 히스토리 선택적 삭제**: clearContext는 전체 삭제만
7. **확장에서 도구 자동 승인**: 정책에서 `allow` 결정 무시됨

### 7.2 워크어라운드로 우회 가능

1. **팀 오케스트레이션**: 순차적 서브에이전트 호출 + 파일시스템 기반 상태 공유
2. **품질 게이트**: BeforeTool deny + AfterAgent deny 조합
3. **lib/ 모듈 사용**: MCP 서버로 래핑하여 도구화
4. **동적 컨텍스트**: BeforeModel llm_request 수정으로 메시지 조작
5. **토큰 추적**: 외부 트래커(커뮤니티 확장) 활용 또는 자체 추정
6. **PDCA 단계 전환**: AfterAgent에서 결과 분석 후 다음 단계를 additionalContext로 제안

---

## 8. 권고 사항: bkit-gemini 아키텍처 전략

### 8.1 "관찰자 + 조언자" 패턴 수용

Gemini CLI extension의 구조적 역할을 인정하고, Claude Code의 "런타임 제어자" 패턴을 모방하지 않는다.

```
Claude Code bkit: "런타임을 제어하는 오케스트레이터"
  - Agent Teams 직접 조작
  - 208개 lib/ 함수로 런타임 로직 실행
  - Hook으로 도구 실행 전후 완전 제어

Gemini CLI bkit: "컨텍스트를 주입하는 조언자"
  - Skills로 전문 지식 주입
  - Hooks로 관찰 + 차단 (제어 아님)
  - 서브에이전트로 순차적 위임
  - MCP 서버로 도구 기능 제공
```

### 8.2 Gemini CLI 고유 강점 활용

| Gemini CLI 강점 | bkit 활용 방안 |
|----------------|---------------|
| 1M 토큰 컨텍스트 | 대규모 코드베이스 분석에 유리 |
| Plan Mode (stable) | PDCA Plan 단계와 네이티브 통합 |
| plan.modelRouting | 자동 비용 최적화 (Pro plan -> Flash do) |
| A2A 원격 에이전트 | 전문 분석 서버 연동 |
| Policy Engine | 도구 차단 기반 안전장치 |
| Progressive Skill Disclosure | 컨텍스트 효율적 전문지식 관리 |

---

## 9. 원문 참조 링크

### 공식 문서
- [Hooks Reference](https://geminicli.com/docs/hooks/reference/)
- [Writing Hooks](https://geminicli.com/docs/hooks/writing-hooks/)
- [Hooks Best Practices](https://geminicli.com/docs/hooks/best-practices/)
- [Extension Reference](https://geminicli.com/docs/extensions/reference/)
- [Build Extensions](https://geminicli.com/docs/extensions/writing-extensions/)
- [Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Creating Skills](https://geminicli.com/docs/cli/creating-skills/)
- [Subagents](https://geminicli.com/docs/core/subagents/)
- [Remote Agents](https://geminicli.com/docs/core/remote-agents/)
- [Policy Engine](https://geminicli.com/docs/reference/policy-engine/)
- [Plan Mode](https://geminicli.com/docs/cli/plan-mode/)

### GitHub Issues & Discussions
- [#19430 - Parallel Agent Teams Feature Request](https://github.com/google-gemini/gemini-cli/issues/19430)
- [#15895 - Skills Architecture Missing Core Implementation](https://github.com/google-gemini/gemini-cli/issues/15895) (CLOSED - NOT PLANNED)
- [#4168 - Autonomous Background Agents](https://github.com/google-gemini/gemini-cli/issues/4168) (In Design, P1, Roadmap)
- [#9070 - Comprehensive Hooking System](https://github.com/google-gemini/gemini-cli/issues/9070)
- [#11703 - Comprehensive System of Hooks](https://github.com/google-gemini/gemini-cli/issues/11703)
- [#5941 - Background Task Processing](https://github.com/google-gemini/gemini-cli/issues/5941)

### 기술 분석
- [DeepWiki - Agent Skills and Sub-agents](https://deepwiki.com/google-gemini/gemini-cli/3.11-agent-skills-and-sub-agents)
- [DeepWiki - Hooks System](https://deepwiki.com/google-gemini/gemini-cli/5.7-hooks-system)
- [Google Developers Blog - Hooks](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/)
- [Google Developers Blog - Plan Mode](https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/)
- [DataCamp - Gemini CLI vs Claude Code](https://www.datacamp.com/blog/gemini-cli-vs-claude-code)
- [MorphLLM - Agent Teams Comparison](https://www.morphllm.com/comparisons/gemini-cli-vs-claude-code)

---

## 10. 조사 신뢰도

| 항목 | 신뢰도 | 비고 |
|------|--------|------|
| Hook System 제약 | 5/5 | 공식 문서 + 소스 코드 분석(DeepWiki) 교차 검증 |
| Agent System 제약 | 5/5 | 공식 문서 명시적 제한 + GitHub Issue 확인 |
| Skill System 제약 | 4/5 | 공식 문서 + Issue #15895 상세 분석, Level 3 미구현 확인 |
| Context Engineering | 4/5 | 공식 문서에 미노출 API는 "없음"으로 추정, 소스 코드 미확인 |
| Extension Packaging | 5/5 | 공식 Extension Reference 직접 확인 |
| Policy Engine | 5/5 | 공식 Policy Engine 문서 직접 확인 |
| Claude Code 비교 | 4/5 | Claude Code hooks reference + 커뮤니티 비교 기사 |
| 배경 에이전트 | 3/5 | Issue #4168 "In Design" 상태, 구현 세부사항 미공개 |

# bkit v2.0.5 Finalization — Design

> **Plan**: [`bkit-v2.0.5-finalization.plan.md`](../../01-plan/features/bkit-v2.0.5-finalization.plan.md)
> **Architecture Decision**: **Option C (Pragmatic Balance)** — slim default + GEMINI.md 보완 + env var 복원 + list_agents 단순 패치

## Context Anchor (Plan에서 복사)

| 차원 | 값 |
|------|---|
| WHY | v0.39.0 마이그레이션 후 식별된 3건 마감 |
| WHO | bkit 사용자 + 개발자 + 다음 cycle |
| RISK | 정보 손실 → GEMINI.md 이관으로 보완 |
| SUCCESS | SessionStart 한 줄 + list_agents 21개 + manifest v2.0.5 + 회귀 0 |
| SCOPE | 6개 파일 |

## 1. Architecture Options

| | A: 환경변수만 | **B: 슬림 default + GEMINI.md** ★ | C: BeforeAgent 이관 (반려) |
|--|-------------|-----------------------------------|--------------------------|
| 슬림 default | ❌ verbose가 기본 | ✅ 슬림이 기본 | — |
| 정보 보존 | hook stdout만 | GEMINI.md 자동 로드 | hook 다른 곳 |
| Issue #25655 영향 | 풀본문 × 2 그대로 | 한 줄 × 2 (시각 부담 거의 0) | BeforeAgent도 동일 2회 |
| 작업량 | 0.5h | 1.5h | 3-4h |
| 리스크 | 사용자 적응 0 | 정보 GEMINI.md 의존 | wrong-layer 위반 |
| **선택** | | **★ 채택** | (Plan §4.5 결정 2 반려) |

## 2. Slim systemMessage 설계

### 2.1 hook 출력 (default)

```json
{
  "decision": "allow",
  "systemMessage": "bkit Vibecoding Kit v2.0.5 activated (Gemini CLI) - Level: Starter",
  "metadata": { ... }
}
```

### 2.2 verbose 모드 (BKIT_SESSION_START_VERBOSE=true)

기존 `generateDynamicContext()` 풀 본문 그대로 (PDCA Core Rules + Skills + Returning User + …).

### 2.3 분기 로직 (session-start.js generateDynamicContext)

```js
function generateDynamicContext(...) {
  const verbose = process.env.BKIT_SESSION_START_VERBOSE === 'true';
  if (!verbose) {
    return `bkit Vibecoding Kit v2.0.5 activated (Gemini CLI) - Level: ${level}`;
  }
  // ... 기존 풀 본문 빌드 그대로
}
```

## 3. GEMINI.md 보완 설계

### 3.1 root GEMINI.md에 추가 섹션

기존 GEMINI.md에 다음 섹션 추가 (또는 `templates/GEMINI.template.md`에 모듈로 추가):

```md
## bkit Auto-Activation (v2.0.5+)

bkit Vibecoding Kit이 자동 활성화됩니다. SessionStart hook은 한 줄 헤더만 출력하며,
PDCA Core Rules / Auto-Triggers / Natural Language Handling은 본 문서를 통해 매 세션 자동 컨텍스트로 로드됩니다.

### PDCA Core Rules
- New feature → Plan/Design 먼저
- After implementation → Gap analysis 제안
- Match Rate < 90% → pdca-iterator 자동 개선
- Match Rate >= 90% → /simplify → report

### Agent Auto-Triggers
요청 컨텍스트 기반 자동 활성. Agents: gap-detector, code-analyzer, design-validator, pdca-iterator, ...

### Natural Language Feature Request
"build login feature" 같은 자연어 → /pdca plan, design, do, analyze 자동 안내.
Exception: "just build it" / "skip docs" 시 즉시 진입.

### Verbose mode
환경변수 `BKIT_SESSION_START_VERBOSE=true` 설정 시 SessionStart에 풀 본문 표시 (이전 동작).
```

## 4. list_agents Fix 설계

`mcp/bkit-server.js` `handleListAgents()` 현재 구현이 16개만 노출. 원인 추정:
- 하드코딩된 화이트리스트 / safetyTier 필터 / agent 메타데이터 누락 등

### 4.1 수정 방향

`agents/` 디렉토리 전수 스캔 → frontmatter 파싱 → 모두 노출. SafetyTier 정보가 있어도 list_agents는 가시 목적이므로 필터 제거.

```js
function handleListAgents() {
  const agentsDir = path.join(extensionPath, 'agents');
  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  const agents = files.map(f => parseAgentFrontmatter(path.join(agentsDir, f)));
  return { agents };  // 21개 모두
}
```

## 5. tc114 신설 설계

`tests/suites/tc114-session-start-slim-mode.js` — 6 tests:

| # | 테스트 |
|---|------|
| TC114-01 | default 모드 (verbose unset) → systemMessage 한 줄, 'PDCA Core Rules' 미포함 |
| TC114-02 | default 모드 stdout 한 줄, systemMessage 1회 (tc113 계약 유지) |
| TC114-03 | verbose=true → systemMessage에 'PDCA Core Rules' 포함, sections >= 5 |
| TC114-04 | verbose=true 모드도 stdout 한 줄, systemMessage 1회 (tc113 계약 유지) |
| TC114-05 | systemMessage 첫 부분이 'bkit Vibecoding Kit v2.0.5' (manifest 일관성) |
| TC114-06 | metadata.version === manifest version (cross-ref) |

## 6. Implementation Order

1. W1: manifest + 코드 v2.0.4 → v2.0.5 일괄 (sed 또는 Edit)
2. W2: session-start.js generateDynamicContext에 verbose 분기 + GEMINI.md 보완
3. W3: mcp/bkit-server.js handleListAgents 패치
4. W4: tc114 신설 + run-all.js 등록 + tc113 회귀 확인
5. W5: 풀 baseline 회귀 + Gemini CLI L1+L2 자동 sweep 재실행

## 7. Test Plan (§8 in template — qa 단계용)

- L1: tc114 6/6 + tc113 8/8 + 핵심 회귀 (tc18, tc26, tc34, tc63, tc82, tc105, tc111) green
- L2: hook spawn (10/10) + MCP handshake + list_agents 21개 반환 + spawn_agent dry call
- L3 (사용자): 새 gemini 세션 시작 → systemMessage 한 줄 표시 + verbose=true 시 풀 본문 복원

---

*Design 작성: 2026-04-24 — L4 자동 모드*

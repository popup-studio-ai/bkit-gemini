# bkit `agentMemory` ↔ Gemini CLI Auto Memory `extraction.patch` — 매핑 분석 문서

> **작성일**: 2026-05-14 (Sprint v2.0.7-upgrade W6 ENH-3)
> **상위 산출물**: `docs/01-plan/sprints/v2.0.7-upgrade-master-plan.md`
> **트리거**: bkit이 향후 Gemini CLI Auto Memory inbox flow(PR #26338, Cx2)를 옵트인 채택할 경우 사전 매핑 비용 분석 + 통합 시나리오 5건 사전 평가
> **scope**: 매핑 표 2개 + 시나리오 5건 cost-benefit-risk 분석. **실제 통합 구현 0건** (본 sprint scope 외)
> **출처**:
> - bkit `lib/core/agent-memory.js` (214 lines, AgentMemoryManager class)
> - Gemini CLI [PR #26338](https://github.com/google-gemini/gemini-cli/pull/26338) (Auto Memory inbox + canonical-patch contract)
> - Gemini CLI [docs/cli/auto-memory/](https://geminicli.com/docs/cli/auto-memory/) 공식 사양

---

## §1. bkit `agentMemory` JSON 스키마 실측

### 1.1 저장 위치

`lib/core/agent-memory.js:38-43` — `getMemoryPath()`:

```
- User scope:    ~/.gemini/agent-memory/bkit/<agentName>.json
- Project scope: <projectDir>/.gemini/agent-memory/bkit/<agentName>.json
```

agent별로 별도 파일. **21 agents = 최대 21 files** (per scope).

### 1.2 JSON 스키마 (`_createDefault()`, line 178-188)

```json
{
  "version": "1.0",
  "agent": "<agentName>",
  "scope": "project|user",
  "lastUpdated": "2026-05-14T12:34:56.789Z",
  "sessions": [
    {
      "sessionId": "1abc23xy",
      "timestamp": "2026-05-14T12:34:56.789Z",
      "summary": "Analyzed login feature design vs implementation",
      "keyFindings": ["Match rate 87%", "Missing JWT refresh"]
    }
    // ... 최대 20 sessions (newest-first), trim oldest beyond
  ],
  "patterns": {
    "commonGaps": ["JWT refresh missing", "Session timeout undefined"],
    "projectSpecificNotes": "Free-form text"
  },
  "stats": {
    "totalSessions": 42
  }
}
```

### 1.3 API (외부 호출 가능 함수)

| Method | 입력 | 출력 | 역할 |
|---|---|---|---|
| `load(projectDir)` | projectDir 경로 | memory object | 파일 로드 (없으면 default 생성) |
| `save(projectDir)` | projectDir 경로 | (void) | 디스크 저장 + lastUpdated 갱신 |
| `addSession({sessionId, summary, keyFindings})` | session 데이터 | (void) | sessions 배열 prepend + maxSessions=20 enforce |
| `getRecentSessions(count=5)` | count | session[] | 최신 N개 반환 |
| `updatePatterns(patterns)` | patterns object | (void) | Object.assign merge |
| `getSummary()` | — | string | Context injection용 multi-line 요약 |
| `clear(projectDir)` | projectDir | (void) | reset to default + save |

### 1.4 Scope 결정 로직 (`getAgentMemory()`, line 202-212)

```javascript
const userScopeAgents = ['starter-guide', 'pipeline-guide'];
// 위 2개는 user scope, 나머지 19개는 project scope
```

bkit 21 agents 매핑:
- **User scope** (2): `starter-guide`, `pipeline-guide`
- **Project scope** (19): `gap-detector`, `code-analyzer`, `qa-monitor`, `qa-strategist`, `pdca-iterator`, `report-generator`, `design-validator`, `cto-lead`, `frontend-architect`, `infra-architect`, `security-architect`, `enterprise-expert`, `pm-lead`, `pm-discovery`, `pm-strategy`, `pm-research`, `pm-prd`, `product-manager`, `bkend-expert`

### 1.5 핵심 설계 의도

1. **Per-agent isolation**: 각 agent가 *자신의 session history*만 본다 (`<agentName>.json` 별도 파일)
2. **Project vs user scope 분리**: 도메인 지식 (starter-guide, pipeline-guide)은 user scope (project 간 공유), 작업 컨텍스트는 project scope (격리)
3. **Bounded history**: maxSessions=20 (오래된 것 자동 삭제) — 토큰 비용 제어
4. **Pattern aggregation**: `patterns.commonGaps` — gap-detector가 *반복되는 갭 패턴* 학습
5. **Stat tracking**: `stats.totalSessions` — 누적 카운트
6. **Graceful degradation**: JSON parse error 시 default 새로 생성 (충돌 회피)

---

## §2. Gemini CLI Auto Memory `extraction.patch` 스키마 실측

### 2.1 저장 위치

PR #26338 + geminicli.com/docs/cli/auto-memory/:

```
- Project scope:  <projectMemoryDir>/.inbox/<kind>/extraction.patch
- Private scope:  ~/.gemini/agent-memory/main/.inbox/<kind>/extraction.patch
- Skills scope:   <skill-dir>/.inbox/<kind>/extraction.patch
```

`<kind>` = "private" / "global" / "skills" (3-tier inbox).

**bkit의 per-agent 21 파일과 다른 것**: Auto Memory는 *단일 patch 파일 per kind* (3 files total per scope). bkit은 *21 files per scope*.

### 2.2 Patch 형식 (canonical-patch contract)

PR #26338 본문 인용:
> "Single canonical filename per kind: `extraction.patch`. Pending inbox contents are surfaced into the agent's initial context so it rewrites the existing patch incrementally rather than creating new files each session."

**관찰 사실**: `extraction.patch`는 *단일 파일에 모든 추출 사항이 patch 형태로 누적*. bkit의 *세션별 entry 배열*과 구조 차이 큼.

### 2.3 Schema 추정 (⚠️ 추가 확인 필요)

PR #26338 + 공식 docs에서 정확한 patch 내용 schema 명시 부재 (본 sprint 시점). 추정:

```
# extraction.patch (text format, unified-diff style 또는 markdown)
[메타데이터: extracted_at, agent_id, source_session]
[추출된 fact/preference/constraint 목록]
[diff: 이전 patch와의 변경 사항]
```

⚠️ **정확한 schema는 PR #26338 코드 또는 후속 sprint에서 직접 확인 필요**.

### 2.4 안전망 (PR #26338에서 인용)

- **MemoryService snapshot/rollback**: extraction agent 실행 전후 active memory snapshot, MEMORY.md/sibling .md 직접 쓰기 시 rollback
- **isPathAllowed deny**: `.inbox/` 디렉터리는 main agent 쓰기 차단 → 모델이 reviewable patch를 *우회*해서 직접 메모리 수정 불가
- **runWithScopedMemoryInboxAccess**: extraction agent만 inbox에 쓰기 가능 (scope 제한)

### 2.5 Human-in-loop 워크플로우

PR #26338 + Conductor 철학:
> "Nothing is applied automatically — the user reviews each entry in `/memory inbox` and approves or dismisses it."

1. Auto Memory가 *유휴 세션*에서 (≥3h idle, ≥10 user messages) extraction agent 실행
2. extraction agent가 chat history에서 *facts/preferences/constraints* 추출 → `<inbox>/<kind>/extraction.patch` 저장
3. 사용자가 `gemini memory inbox` 명령으로 *patch 검토*
4. 사용자가 *approve* → patch가 `MEMORY.md`에 merge / *dismiss* → patch 삭제

### 2.6 핵심 설계 의도

1. **Canonical single file**: 매 세션마다 새 파일 생성 안 함, 단일 patch incremental
2. **Human-in-loop gate**: 자동 추출 + 사용자 검토 = silent contamination 차단
3. **3-tier scope**: private/global/skills 분리
4. **Snapshot/rollback 안전망**: extraction 실패 시 rollback
5. **Read-only main agent**: main agent가 inbox 직접 수정 불가

---

## §3. 매핑 표 1 — bkit `agentMemory` → `extraction.patch`

### 3.1 직접 매핑 가능 필드

| bkit field | extraction.patch 매핑 | 변환 비용 | 비고 |
|---|---|---|---|
| `version: "1.0"` | (메타데이터) | LOW | patch header에 매핑 |
| `agent: "<agentName>"` | (메타데이터 `source_agent`) | LOW | 1:1 |
| `lastUpdated` | (메타데이터 `extracted_at`) | LOW | 1:1 timestamp |

### 3.2 일부 매핑 + 변환 필요 필드

| bkit field | extraction.patch 매핑 | 변환 비용 | 비고 |
|---|---|---|---|
| `sessions[i].summary` | patch 내 *fact* 또는 *constraint* | MEDIUM | summary가 fact인지 preference인지 LLM judgment 필요 |
| `sessions[i].keyFindings[]` | patch 내 *facts* 배열 | MEDIUM | 1:N mapping |
| `patterns.commonGaps[]` | patch 내 *constraint* "이런 갭이 반복됨" | MEDIUM | aggregate → constraint 추출 |
| `patterns.projectSpecificNotes` | patch 내 *project-context fact* | LOW | free-form text |

### 3.3 매핑 불가 필드 (목적 차이)

| bkit field | 매핑 불가 사유 | 대안 |
|---|---|---|
| `scope: "project|user"` | Auto Memory의 3-tier scope (private/global/skills)와 *직교* | bkit project → Auto Memory private, bkit user → global (불완전) |
| `sessions[].sessionId` | Auto Memory는 *patch 단일 파일* (per-session 식별 없음) | 추출 시 sessionId를 fact 안에 *문자열*로 포함 (loss of structure) |
| `stats.totalSessions` | Auto Memory에 *counter 개념 없음* | 별도 file로 유지 (bkit only) |
| `sessions[].timestamp` (per-session) | patch는 *aggregated*, per-session timestamp 손실 | extraction at timestamp만 보존 |

### 3.4 정보 손실 분석 (bkit → patch)

- **maxSessions=20 history**: patch는 single canonical → 20 sessions이 *aggregate*되어 *최신 정보만 보존*. **80% 정보 손실 가능**.
- **per-agent isolation**: 21 agents 각자 history → 3-tier scope (private/global/skills) merge. **agent context 손실**.
- **structured patterns**: `patterns.commonGaps[]` 배열 → free-form text "common gaps". **structured query 손실**.

---

## §4. 매핑 표 2 — `extraction.patch` → bkit `agentMemory`

### 4.1 직접 매핑 가능

| extraction.patch field (추정) | bkit field | 변환 비용 |
|---|---|---|
| `extracted_at` | `lastUpdated` | LOW |
| `source_agent` | `agent` | LOW |

### 4.2 일부 매핑 + 변환

| extraction.patch field | bkit field | 변환 비용 |
|---|---|---|
| facts[] (text) | `sessions[].keyFindings[]` (text array) | MEDIUM, 1:N split |
| constraints[] | `patterns.commonGaps[]` 또는 `patterns.projectSpecificNotes` | MEDIUM, free-form vs structured 판단 |
| preferences[] | (bkit 미사용) | LOW (drop or store as note) |

### 4.3 매핑 불가 사유

| extraction.patch field | 매핑 불가 사유 |
|---|---|
| Diff format (이전 patch와의 차이) | bkit은 *세션 list*라 diff 개념 없음 |
| Approval state | bkit은 *명시 approval flow 부재* (sessions가 곧 ground truth) |
| 3-tier scope (private/global/skills) | bkit project/user 2-tier와 직교 |

### 4.4 정보 손실 분석 (patch → bkit)

- **Single canonical → 21 agents**: patch는 *aggregate*, bkit은 *per-agent*. **어느 agent에게 어떤 fact를 줄지 LLM 판단 필요**.
- **Diff history**: bkit이 patch history (diff 누적)를 *재구성* 불가. **patch 변화 추적 손실**.
- **Approval semantic**: bkit은 sessions에 approval 메커니즘 없음. **확정 vs 임시 구분 손실**.

---

## §5. 통합 시나리오 5건 (Cost-Benefit-Risk)

### 5.1 Scenario A — bkit only (현재, v2.0.7)

**구성**: bkit `agentMemory` 단독 사용. `experimental.autoMemory: false` 잠금.

| 측면 | 평가 |
|---|---|
| Cost | 0 (현 상태 유지) |
| Benefit | bkit per-agent isolation 보존. 21 agents 각자 학습. |
| Risk | Gemini CLI 신기능(Auto Memory inbox) 미활용. 외부 ecosystem 정합성 ↓. |
| 적합 시기 | 본 sprint (v2.0.7) — 사용자가 *bkit-only* 환경 |

### 5.2 Scenario B — Auto Memory only (v2.1.0+)

**구성**: bkit `agentMemory` deprecated. `experimental.autoMemory: true`. extraction.patch 사용.

| 측면 | 평가 |
|---|---|
| Cost | HIGH — bkit `lib/core/agent-memory.js` 폐기 + 21 agents의 history 손실 + bkit 메모리 활용 모든 코드 변경 |
| Benefit | Gemini CLI ecosystem 완전 정합. Human-in-loop 안전망. Snapshot/rollback 안전망. |
| Risk | bkit 21-agent 특화 학습 손실. 마이그레이션 손상 위험. |
| 적합 시기 | v2.2.0 또는 v3.0.0 (major bump) — bkit 메모리 시스템 redesign |

### 5.3 Scenario C — 양립 (read-only 안내, ENH-4 본 sprint 채택)

**구성**: bkit `agentMemory` 단독 사용 + Auto Memory inbox *존재 시 안내만*.

| 측면 | 평가 |
|---|---|
| Cost | LOW — ENH-4 30분 작업 (session-start.js 안내 1줄) |
| Benefit | 사용자가 *둘 다 인지*. autoMemory를 *수동 활성화*한 사용자에게 bkit이 *조용히 무시*하지 않음. |
| Risk | 사용자 *혼란* (어떤 메모리 시스템을 신뢰할지 모름). D-A2 결재로 안내 톤 정보성 (Option A) 선택 → 위험 LOW. |
| 적합 시기 | **본 sprint (v2.0.7-upgrade) — 현재 채택 (ENH-4)** |

### 5.4 Scenario D — 부분 통합 (특정 키만 export, v2.1.0+)

**구성**: bkit `agentMemory` 유지 + 일부 키 (예: `patterns.commonGaps`)를 *읽기 전용 export*하여 Auto Memory `extraction.patch`로 *fact*로 변환.

| 측면 | 평가 |
|---|---|
| Cost | MEDIUM — 변환 로직 구현 (`lib/core/agent-memory-to-patch.js` 신규) + extraction agent와 협업 명세 |
| Benefit | 점진적 통합. 사용자가 *bkit 학습*을 Auto Memory ecosystem에 *공유* 가능. |
| Risk | 변환 손실 (§3.4 분석). 양 시스템 동기화 비용. |
| 적합 시기 | v2.1.0-context-optimization sprint (carry from 본 sprint) |

### 5.5 Scenario E — 완전 통합 (~v2.2.0+)

**구성**: bkit `agentMemory` 완전 재설계하여 *Auto Memory `extraction.patch`의 superset*으로 만듦. patch format 채택 + per-agent isolation 추가 (확장).

| 측면 | 평가 |
|---|---|
| Cost | VERY HIGH — bkit `lib/core/agent-memory.js` 재작성 + 21 agents 메모리 마이그레이션 + Gemini CLI extraction agent 협업 명세 |
| Benefit | 단일 메모리 시스템. Gemini CLI ecosystem 완전 정합. Human-in-loop + per-agent 양립. |
| Risk | 마이그레이션 사용자 환경 손상. bkit 메모리 시스템 unique value 손실 가능. |
| 적합 시기 | v2.2.0 또는 v3.0.0 (major bump) — 충분한 burn-in 후 |

---

## §6. 권고 (본 sprint v2.0.7-upgrade 시점)

### 6.1 본 sprint 채택 (확정)

- **Scenario A** (bkit only) 유지 + **Scenario C** (read-only 안내) 동시 진행
- ENH-4 (Auto Memory inbox 안내 capability flag) 채택
- **본 sprint 통합 구현 0건** (매핑 문서만)

### 6.2 후속 sprint 위임 (carry items)

| Carry | 위임 sprint | 시기 |
|---|---|---|
| Scenario D (부분 통합, `patterns.commonGaps` export) | `v2.1.0-context-optimization` | v0.43.0 stable 출시 후 |
| Auto Memory 활성화 시 namespace 충돌 검증 | `v2.1.0-context-optimization` | Scenario D 전제 |
| `extraction.patch` 정확한 schema 직접 확인 | `v2.1.0-context-optimization` 또는 별도 research | PR #26338 코드 review |

### 6.3 장기 (v2.2.0+) carry

| Carry | 시기 |
|---|---|
| Scenario E (완전 통합) | major bump, v0.43.0 stable 6개월 burn-in 후 |
| bkit `agentMemory` superset redesign | adoption signal 확인 후 |

---

## §7. Cost-Benefit Summary (5 Scenarios 종합)

| Scenario | Cost | Benefit | Risk | 본 sprint 채택? |
|---|---|---|---|---|
| **A** bkit only | 0 | bkit isolation 보존 | Ecosystem 단절 | ✅ (현 상태 유지) |
| **B** Auto Memory only | HIGH | Ecosystem 완전 정합 | bkit 가치 손실 | ❌ (v2.2.0+) |
| **C** 양립 read-only | LOW | 양립 인지 | 사용자 혼란 (LOW) | ✅ **(ENH-4 채택)** |
| **D** 부분 통합 | MEDIUM | 점진 통합 | 변환 손실 | ❌ (v2.1.0 sprint) |
| **E** 완전 통합 | VERY HIGH | 단일 시스템 | 마이그레이션 손상 | ❌ (v2.2.0+) |

**본 sprint 결정**: A + C = Scenario "양립" (가장 안전하고 비용 최소).

---

## §8. 후속 작업 (v2.1.0-context-optimization sprint를 위한 input)

본 매핑 문서는 후속 sprint `v2.1.0-context-optimization`이 다음 작업에 직접 활용할 수 있도록 작성됨:

1. **Scenario D 구현 시작점**: §3.2/§3.3에서 *MEDIUM 변환 비용* 필드를 우선 선택
2. **Scenario E 사전 평가**: §5.5 cost-benefit-risk 가정으로 PRD 작성
3. **`extraction.patch` schema 확정 작업**: §2.3의 ⚠️ 추가 확인 항목을 v2.1.0 sprint W1 = "Auto Memory schema deep dive"로 위임
4. **bkit 21 agents의 ecosystem 진입**: §1.5 5번 (per-agent isolation)을 Auto Memory 3-tier scope에 어떻게 매핑할지 결정

본 매핑 문서는 *bkit-Gemini CLI Auto Memory 통합 결정 트리*의 base 산출물.

---

## §9. References

### 9.1 코드 참조
- bkit `lib/core/agent-memory.js` (214 lines, AgentMemoryManager class)
- bkit `bkit.config.json` `agentMemory.agentScopes` (현재 미사용, 향후 확장 후보)
- bkit `hooks/scripts/session-start.js` `maybeAutoMemoryInboxHint()` (ENH-4)

### 9.2 외부 출처
- [PR #26338](https://github.com/google-gemini/gemini-cli/pull/26338) — feat(memory): add Auto Memory inbox flow with canonical-patch contract (SandyTao520, merged 2026-05-04)
- [Gemini CLI docs/cli/auto-memory/](https://geminicli.com/docs/cli/auto-memory/) — 공식 사양
- A축 조사 산출물: `docs/01-plan/research/v2.0.7-upgrade/A-official-docs.research.md`
- D축 조사 산출물: `docs/01-plan/research/v2.0.7-upgrade/D-context-engineering.research.md` §D.3.4
- E축 조사 산출물: `docs/01-plan/research/v2.0.7-upgrade/E-bkit-codebase.deep-analysis.md` §E.4

### 9.3 관련 carry items
- 본 매핑 문서는 v2.0.7-upgrade master plan §7.4 carry item #4 (autoMemory 옵트인 활성화)의 *사전 분석 산출물*
- v0.43.0-preview.0 시그널: PR #26655 Snapshotter (rolling window summaries) — 본 매핑에 시너지 가능

---

## §10. Status

- **본 문서**: Draft v1.0 — pending review
- **본 sprint scope 내 구현**: 0건 (매핑 문서만)
- **본 sprint scope 외 carry**: Scenario D (v2.1.0-context-optimization sprint), Scenario E (v2.2.0+ 별도 major sprint)

> ⚠️ **§2.3 "extraction.patch schema 추정"**은 본 sprint에서 직접 확인 불가 (PR #26338 코드 review 별도 작업 필요). v2.1.0-context-optimization sprint W1에서 정확 schema 확정 후 본 매핑 문서 갱신.

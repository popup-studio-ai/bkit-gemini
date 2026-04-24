# Gemini CLI v0.39.0 마이그레이션 계획서 — bkit v2.0.4 (Minor Bump + Defensive Test 보강)

> **Feature**: gemini-cli-v0390-migration
> **Version**: bkit v2.0.4
> **Created**: 2026-04-23
> **Status**: Draft
> **Strategy**: **B' (Spot Validation + Defensive Test)** — testedVersions/feature-flag 갱신 + Issue #25655 회귀 방어 + Tool-controlled display 회귀 검증
> **Migration Scope**: v0.38.2 → v0.39.0 (Minor, 누적 101 commits / 513 files / 41 contributors)
> **Delta Scope**: 명시적 Breaking 1건 (Legacy `SubagentTool` 제거 — bkit 영향 0건), 새 기능 10+, 의존성 fork (`@github/keytar`), 보안 패치 (#25022)
> **Research**: [gemini-cli-v0.39.0-research.md](../research/gemini-cli-v0.39.0-research.md)
> **Impact Analysis**: [gemini-cli-v0.39.0-impact.analysis.md](../../03-analysis/gemini-cli-v0.39.0-impact.analysis.md)
> **Parent (관찰만)**: [gemini-cli-v0.38.2-migration.plan.md](gemini-cli-v0.38.2-migration.plan.md) — Issue #25655 방어 테스트 신설 약속이 v0.39.0에서도 유효 (잔존 회귀)

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| Feature ID | `gemini-cli-v0.39.0-migration` |
| 대상 버전 | **v0.38.2 → v0.39.0** |
| 릴리스 일자 | 2026-04-23 04:12 UTC, commit `398f78d` |
| 작성일 | 2026-04-23 |
| 전체 위험도 | **MEDIUM** (Breaking 자체는 LOW (0건 hit) + Issue #25655 잔존 + ContextManager+Sidecar의 v2.1.0 plan 교차) |
| Breaking Changes (증분) | 1건 (Legacy SubagentTool 제거, **bkit hit 0**) |
| Critical Impact | 1건 (업스트림 Issue #25655 SessionStart 중복 잔존) |
| 새 기능 (증분) | 10+건 (`/memory inbox`, skill patching, JSONL chat, ContextManager+Sidecar, useAgentStream, MCP auth, Tool-controlled display, Plan Mode 게이트, IDE stdio 보안, AskUser UX) |
| 예상 작업 시간 | **0.7h (P0 필수)** + 2.0h (P1 방어 테스트 + display 회귀) + 0.5h buffer = **~3.2h** |
| Wave 구조 | 3 Waves (Version swap → Spot validation → Defensive test + display 회귀) |
| Affected Files | 2개 직접 (`bkit.config.json`, `lib/gemini/version.js`) + 3개 간접/검증 (`session-start.js`, `bkit-server.js`, `platform.js`) |
| YAGNI Savings | **~75%** (naive C 풀셋 13~16h+ → B' 3.2h) |

---

## Executive Summary

**TL;DR**: v0.39.0의 단일 명시적 Breaking Change(Legacy `SubagentTool`/`SubagentToolWrapper` 제거, PR #25053)는 **bkit 코드베이스 hit 0건**이다. bkit는 자체 `mcp/bkit-server.js`의 `spawn_agent` MCP tool + `gemini -e <agent>.md` 외부 spawn 방식을 사용하므로 Gemini CLI 내부 SubagentTool 클래스에 의존하지 않는다 (감사 grep 0 hit, 문서 17 hit는 모두 사전 예고 텍스트). 따라서 즉시 코드 수정 필수 항목은 testedVersions 갱신 + feature flag 그룹 신설 2건뿐이다.

핵심 위험 1: **Issue #25655 SessionStart `systemMessage` 이중 렌더링**이 v0.38.2 → v0.39.0 잔존 (fix PR #25827 OPEN). bkit `hooks/scripts/session-start.js` Line 89/114가 정면 적중 영역이며, 직전 v0.38.2 사이클이 약속했던 `tc107-v0382-session-start-duplication.js` 방어 테스트가 **미신설** 상태다 → 본 v0.39.0 사이클에서 P0 우선순위로 신설.

핵심 위험 2: **ContextManager + Sidecar 디커플드 아키텍처 (PR #24752)**가 bkit v2.1.0 context-optimization plan과 교차. v0.40.0의 MemoryManager 4-tier가 합쳐지면 종합 재설계가 거의 확정적이므로, **본 사이클에서는 spec 추출만 하고 v2.1.0 plan 본격 갱신은 v0.40.0 cycle로 위임** (의도적 deferral).

추가 1건: **Tool-controlled display protocol Steps 2-3 (PR #25134)** 가 bkit `decision/systemMessage/metadata` 페이로드 호환성에 영향 가능 → P1 회귀 검증.

---

## 1. Problem Statement (문제 정의)

### 1.1 왜 v0.39.0 마이그레이션을 해야 하는가

1. **npm `latest` tag 교체**: 2026-04-23 04:12 UTC 기준 `@google/gemini-cli@latest`가 v0.39.0으로 교체. testedVersions에 포함되지 않으면 사용자가 최신 stable을 쓸 때 bkit가 "미검증 환경"으로 동작
2. **v0.38.2 → v0.39.0 누적 갭이 큼**: 101 commits / 513 files / 41 contributors (6일 간격). 호환성 선언을 미루면 v0.40.0 도래 시 누적 갭 가속
3. **보안 수혜**: PR #25022 IDE stdio override RCE 차단 등 보안 패치 5건 + 메모리 누수 fix 4건 (Subagent #25048, OAuth #24968, PTY/MCP #25079, Sandbox #24763) — 사용자 환경 안정성 향상
4. **메모리 4-tier 우회 시간 확보**: 메모리 스냅샷 예고와 달리 MemoryManager 4-tier(#25716)와 autoMemory split(#25601)은 v0.39.0에 **미포함**, v0.40.0으로 미뤄짐 → bkit v2.1.0 context-optimization 재설계에 최소 1 minor cycle 시간 확보

### 1.2 왜 **지금** (2026-04-23) 처리해야 하는가

- v0.39.0 stable과 v0.40.0-preview.2가 **동일일 동시 출시**(릴리스 트레인 가속). v0.40.0 stable이 4월 말~5월 초 가능성. v0.39.0을 늦추면 v0.40.0 cycle과 겹쳐 작업 충돌
- Issue #25655가 v0.38.2부터 **누적 6일 미해결** + fix PR #25827 OPEN. v0.39.0 사이클에서 방어 테스트를 신설하지 않으면 약속 누적이 추가 미이행됨

### 1.3 scope boundary

- ✅ **포함**: testedVersions 4개 추가, feature flag 그룹 신설, Issue #25655 방어 테스트 신설 (v0.38.2 약속 이행), Tool-controlled display 회귀 검증, ContextManager+Sidecar spec 추출 (light)
- ❌ **제외 (의도적)**: invoke_agent 마이그레이션 코드 (bkit 미사용), session-start.js 본문 수정 (NG1 wrong-layer), v2.1.0 plan 본격 재설계 (v0.40.0 cycle로 deferral), MemoryManager 4-tier 대응 (v0.40.0), `/memory inbox`/skill patching 통합 PoC (P3 이관)

---

## 2. Goals (목표)

| ID | 목표 | 수용 기준 |
|----|------|---------|
| G1 | v0.39.0 호환성 확보 | `bkit.config.json` `compatibility.testedVersions`에 `"0.38.0"`, `"0.38.1"`, `"0.38.2"`, `"0.39.0"` 4개 모두 포함, smoke test 993/993 green |
| G2 | feature flag 게이팅 인프라 강화 | `lib/gemini/version.js`에 v0.37+/v0.38+/v0.39+ 그룹 5~7개 신설 (`hasInvokeAgent`, `hasContextManagerSidecar`, `hasMcpAuthBlock`, `hasToolControlledDisplay`, `hasMemoryInbox` 등) |
| G3 | Issue #25655 회귀 감지 역량 확보 (v0.38.2 약속 이행) | `tc107-v0382-session-start-duplication.js` 신설, 훅 stdout이 `systemMessage`를 정확히 1회 배출하는지 검증 + v0.39.0 환경 수동 E2E 1회 |
| G4 | Tool-controlled display protocol 호환성 검증 | `before-tool.js` Line 68 (decision: 'ask' + systemMessage), `after-tool.js`, `platform.js#outputAllow` 페이로드가 새 디스플레이 프로토콜에 호환되는지 회귀 테스트 통과 |
| G5 | ContextManager+Sidecar spec 라이트 추출 | PR #24752 본문에서 sidecar interface signature 1쪽 요약 추출 → v2.1.0 plan에 "v0.40.0 cycle 재진입 hint" 1줄 추가 (본격 재설계는 미수행) |

---

## 3. Non-Goals (하지 않을 것)

| ID | 항목 | 이유 |
|----|------|------|
| NG1 | `hooks/scripts/session-start.js` 본문 수정 (systemMessage 가드/이관) | 업스트림 버그(#25655)가 근본 원인. bkit 측 수정은 fix PR #25827 머지 시 **오히려 UX 회귀** 유발. v0.38.2 NG1 그대로 유지 |
| NG2 | `notifications: false` 플래그 명시 | Issue #25655에서 **무시됨** 공식 확인. v0.38.2 NG2 유지 |
| NG3 | invoke_agent 마이그레이션 코드 작성 | bkit는 `spawn_agent` MCP tool 사용. Gemini CLI 내부 SubagentTool과 **무관** (Impact §1.1, grep 0 hit 확정) |
| NG4 | MemoryManager 4-tier 대응 / `experimental.memoryV2` 도입 | v0.40.0 영역. 본 사이클 진입 시 scope creep |
| NG5 | v2.1.0 context-optimization plan 본격 재설계 | ContextManager+Sidecar(#24752) + MemoryManager 4-tier(v0.40.0)가 합쳐진 후 종합 재설계가 정직 (Impact §3.4, §10.1) |
| NG6 | `/memory inbox` ↔ bkit memory 통합 PoC | P3 이관. 가치는 인정하나 본 사이클 핫픽스 + 방어 테스트 우선 |
| NG7 | Skill patching ↔ bkit `skill-create` 통합 | P3 이관 (NG6와 동일 근거) |
| NG8 | useAgentStream 도입 PoC | P2 이관. 1d 작업이며 본 사이클 외 |
| NG9 | MCP `auth` 블록 마이그레이션 | bkit-server는 stdio 로컬 통신만 사용 (인증 운영 없음). 향후 OAuth 도입 시 적용 |
| NG10 | Issue #25655 업스트림 기여 PR | v0.38.2 plan과 동일하게 P3. 내부 품질 확보와 무관 |
| NG11 | `tool.description` ANSI sanitization 선제 구현 | bkit 훅에 외부 입력 주입 경로 없음 (Impact §6 확인). YAGNI |
| NG12 | Plan Mode TOML 정책 마이그 | bkit는 plan_mode 정책 미사용 (Impact §2.1 확인) |
| NG13 | v0.40.0-preview.2 / v0.41.0-nightly 작업 본 plan에 포함 | **별도 cycle**. 본 plan 끝에 재진입 hint 1줄만 |

---

## 4. 브레인스토밍: 대안 비교 (Strategy Alternatives)

### 4.1 Intent Discovery (Why)

| 질문 | 답 |
|------|---|
| 사용자가 v0.39.0으로 가는 진짜 동기는? | (1) npm `latest` 추종으로 사용자가 신규 stable에서 "미검증 환경" 경고를 받지 않게 함, (2) 보안 패치(#25022) + 메모리 누수 fix 4건의 안정성 수혜, (3) v0.40.0과 동시 출시된 릴리스 트레인 가속 압력 회피 |
| "최신 따라가기" 외 가치는? | (a) Issue #25655 방어 테스트 신설을 통한 회귀 자동 감지 인프라 구축 (v0.38.2 미이행 약속 결제), (b) feature flag 인프라 강화로 향후 버전 분기 로직 게이팅 가능, (c) Tool-controlled display protocol 회귀 검증으로 hookOutput 계약 확정 |
| 무엇을 안 해도 되는가 (YAGNI)? | (1) invoke_agent 마이그 (bkit 미사용 확정), (2) v2.1.0 plan 본격 재설계 (v0.40.0 종합 cycle로 위임), (3) 새 기능 통합 PoC (P3 이관), (4) 업스트림 기여 (내부 품질 무관) |

### 4.2 Approach Alternatives (5개 대안)

#### 접근법 A: No-Op (testedVersions만 갱신)

**범위**: `bkit.config.json` testedVersions에 `"0.39.0"` 추가만.

| 작업 | 파일 | 공수 |
|------|------|------|
| testedVersions 4개 문자열 추가 (v0.38.0/.1/.2/0.39.0) | `bkit.config.json` L120 | 5분 |
| smoke `npm test` | 전체 | 5분 |
| **합계** | **1 file** | **~0.2h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| 최소 비용 | Issue #25655 방어 테스트 미신설 약속 누적, Tool-controlled display 회귀 미검증 | **High** (#25655 사용자 적중 + display 호환성 미검증) | **Low** |

#### 접근법 A' (Spot Validation): A + 새 기능 1~2개 회귀 검증

**범위**: A + Tool-controlled display protocol Steps 2-3 회귀 검증 + agents/*.md 절대 경로 grep.

| 작업 | 파일 | 공수 |
|------|------|------|
| A 전체 | (위) | 0.2h |
| `lib/gemini/version.js` feature flag 그룹 추가 | `lib/gemini/version.js` | 30분 |
| Tool-controlled display 페이로드 회귀 (수동 1회) | `before-tool.js` 출력 캡처 | 30분 |
| `agents/*.md` 36개 절대 경로 표현 grep | 수동 grep | 10분 |
| **합계** | **2 files 수정** | **~1.4h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| feature flag 인프라 + display 회귀 확보 | Issue #25655 방어 테스트 여전히 미신설 (약속 미이행) | Medium (#25655 잔존) | **Low-Medium** |

#### 접근법 B' (Spot Validation + Defensive Test) — RECOMMENDED

**범위**: A' + `tc107-v0382-session-start-duplication.js` 신설 (v0.38.2 약속 이행).

| 작업 | 파일 | 공수 |
|------|------|------|
| A' 전체 | (위) | 1.4h |
| `tc107-v0382-session-start-duplication.js` 신설 (훅 단위 systemMessage 1회 배출 검증) | `tests/suites/tc107-v0382-session-start-duplication.js` 신규 | 1.5h |
| 수동 E2E: v0.39.0 환경 `bkit Session Start` 등장 횟수 캡처 | 수동 | 20분 |
| ContextManager+Sidecar PR #24752 spec 라이트 추출 + v2.1.0 plan 1줄 hint | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | 30분 (cap) |
| **합계** | **2 files 수정 + 1 file 신규 + 1 file 갱신 (v2.1.0 hint)** | **~3.2h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| Issue #25655 방어 자동화 + display 회귀 + feature flag + v2.1.0 재진입 hint | A' 대비 +1.8h | Low | **HIGH** ★★★★★ |

#### 접근법 C: Feature Adoption (B' + 새 기능 1개 채택)

**범위**: B' + `useAgentStream` PoC 또는 `/memory inbox` 통합 (택1).

| 작업 | 공수 |
|------|------|
| B' 전체 | 3.2h |
| useAgentStream PoC (`mcp/bkit-server.js#executeAgent` Line 1040 stream 전환) | 1d (~6h) |
| **합계** | **~9-10h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| Trust Score "Full Visibility" 강화, ai-native-principles Verification Ability 향상 | 본 사이클 비용 3배, scope creep, v0.40.0 진입 시점 지연 | Medium (PoC 실패 시 deferral) | ★★★ (P2 이관 권고) |

#### 접근법 D: Architecture Pre-work (A' + ContextManager+Sidecar spec + v2.1.0 plan 본격 갱신)

**범위**: A' + PR #24752 본문 정독 + v2.1.0 plan 6-Layer ↔ sidecar 매핑 본격 설계.

| 작업 | 공수 |
|------|------|
| A' 전체 | 1.4h |
| PR #24752 본문 정독 + sidecar interface 추출 | 1h |
| v2.1.0 plan 본격 갱신 (6-Layer를 sidecar로 노출 PoC 설계) | 4-6h |
| **합계** | **~7-8h** |

| 장점 | 단점 | 리스크 | 추천도 |
|------|------|--------|--------|
| v0.40.0 진입 전 사전 준비 완료 | v0.40.0의 MemoryManager 4-tier가 합쳐진 후 **재작업 거의 확정** (Impact §3.4) | **High** (sunk cost) | **Low** (v0.40.0 cycle로 통합 권고) |

### 4.3 Evaluation Matrix

| 기준 (가중치) | A: No-Op (0.2h) | A': Spot (1.4h) | **B': Spot+Defensive (3.2h)** | C: Feature (9-10h) | D: Arch Pre-work (7-8h) |
|---------------|-----------------|-----------------|-------------------------------|--------------------|-----|
| 위험도 (30%) | 4 (#25655 방치) | 6 (#25655 잔존) | 9 (방어 확보) | 9 | 7 (sunk cost 위험) |
| 작업량 (25%) | 10 | 9 | 7 | 3 | 4 |
| 가치 창출 (25%) | 3 | 6 | 8 | 9 | 5 (v0.40.0 재작업 위험) |
| 장기 이점 (20%) | 3 | 6 | 8 | 8 | 5 |
| **가중 합계** | **5.20** | **6.85** | **8.05** | **6.90** | **5.40** |

### 4.4 Strategy Decision

**선택: 접근법 B' (Spot Validation + Defensive Test)** — 가중 합계 **8.05**

선택 근거:

1. **약속 결제**: v0.38.2 plan이 약속한 `tc107-v0382` 방어 테스트가 미신설 상태. v0.39.0 사이클에서 약속 누적을 결제하지 않으면 **bkit 자체 신뢰성 저하** (No Guessing 원칙 위배)
2. **Critical 회귀 방어**: Issue #25655가 v0.38.2 → v0.39.0 잔존. 방어 테스트는 fix PR #25827 머지 시 자동으로 회귀 확인 카나리아 역할
3. **인프라 강화**: feature flag 그룹 신설로 향후 v0.39+/v0.40+ 분기 로직 게이팅 가능 (선행 투자)
4. **Tool-controlled display 호환성**: 새 디스플레이 프로토콜이 bkit hookOutput 계약에 무영향임을 회귀 검증으로 고정
5. **C/D 탈락**:
   - **C** — useAgentStream은 가치 있으나 1d 작업이며 본 사이클의 우선순위(약속 결제) 외. P2 이관
   - **D** — v0.40.0 MemoryManager 4-tier가 합쳐지면 sunk cost 거의 확정. 본 사이클은 spec **라이트 추출** + 1줄 hint만으로 충분
6. **Strategy B' 패턴 일관성**: `feedback_migration_pattern.md` "Strategy B 기본 채택" + 이전 사이클(v0.38.2)이 검증한 B' 변종 재사용 — `project_v0382_migration.md` 메모리 따름

### 4.5 Sharp Decisions (첨예 결정 2건)

#### 결정 1: ContextManager + Sidecar(#24752) ↔ v2.1.0 plan 검토 타이밍

| 옵션 | 내용 | 장점 | 단점 | 리스크 | 추천도 |
|------|------|------|------|--------|--------|
| **옵션 A (반려)** | v0.39.0에서 즉시 v2.1.0 plan 본격 갱신 (선제적) | v0.40.0 진입 전 준비 완료 | v0.40.0 MemoryManager 4-tier가 합쳐지면 재작업 거의 확정 (Impact §3.4) | High (sunk cost) | ★★ |
| **옵션 B (채택)** | v0.40.0 MemoryManager 4-tier 출시 후 종합 재설계 (한 번에) | 정합성 보장, 재작업 회피 | 본 사이클은 hint만 — v0.40.0 시점에 큰 작업 (8-12h 예상) | Low (한 번에 처리) | ★★★★★ |

**채택: 옵션 B** — 근거: PR #24752와 PR #25716(MemoryManager 4-tier)는 **컨텍스트 라이프사이클이라는 동일 도메인**에 영향. 둘이 합쳐진 후 종합 설계가 정직. 본 사이클은 **PR #24752 본문 라이트 추출 (30분 cap)** + v2.1.0 plan에 "v0.40.0 cycle 재진입 hint 1줄" 추가만 수행 (Wave 3.7).

#### 결정 2: Issue #25655 회피 전략

| 옵션 | 내용 | 장점 | 단점 | 리스크 | 추천도 |
|------|------|------|------|--------|--------|
| **옵션 X (채택)** | 업스트림 PR #25827 머지 대기 (passive) + tc107 방어 테스트 유지 | 업스트림 픽스 도래 시 자동 해결, bkit 코드 안정, 약속 결제 | 중복 출력 UX 불편 일시 지속 | Low (기능 정상, UX만 일시 저하) | ★★★★★ |
| **옵션 Y (반려)** | `session-start.js` systemMessage를 BeforeAgent 훅으로 이관 (즉시 회피) | 즉시 회피 가능 | (1) v0.38.2 NG1 위반 (wrong-layer fix), (2) fix PR #25827 머지 시 BeforeAgent 측 출력이 잔존하여 **여전히 중복**, (3) 2-3h 작업 → tc107 방어 테스트와 비교해 효과 불확실 | Medium (잘못된 위치) | ★★ |

**채택: 옵션 X** — 근거: v0.38.2 분석 §3.4와 본 P2 §7.4가 일관되게 옵션 X를 권고. 핵심은 **이슈가 CLI 상위 렌더러 레이어**이며, BeforeAgent로 이관해도 BeforeAgent의 systemMessage가 동일하게 중복될 가능성이 높다 (CLI 레이어 버그). bkit 측 코드 이동은 fix PR #25827 머지 시 **불필요한 아키텍처 회귀**가 된다. 옵션 X는 정직한 조치.

### 4.6 하위 호환성 전략

| 질문 | 결정 |
|------|------|
| v0.38.x 지원 유지? | **유지**. `minGeminiCliVersion: "0.34.0"`, testedVersions에 v0.38.0/.1/.2 + v0.39.0 병행 기재 |
| testedVersions 배열 관리 전략 | **누적 기재**. 각 minor/patch를 문자열로 추가, Deprecation/drop은 Major 릴리스에서 일괄 |
| v0.38.2 → v0.39.0 단번 업그레이드 안전성 | 안전. Breaking 1건은 bkit hit 0, 계약 무변경 |
| v0.39.x 지원 정책 | v0.39.0만 추가. v0.39.1 핫픽스 도래 시 추가 testedVersions 1문자열 추가 (목요/금요 패턴) |

---

## 5. YAGNI Review (YAGNI 리뷰 결과)

### 5.1 채택/보류 판정

| # | 항목 | 공수 | 채택? | 근거 |
|---|------|------|-------|------|
| 1 | `bkit.config.json` testedVersions 4개 문자열 추가 | 5분 | **채택 P0** | 호환성 선언 필수 |
| 2 | `lib/gemini/version.js` feature flag 그룹 5~7개 신설 | 30분 | **채택 P0** | 향후 분기 로직 게이팅 인프라 |
| 3 | smoke `npm test` 993/993 green 확인 | 5분 | **채택 P0** | 계약 무변경 검증 |
| 4 | `tc107-v0382-session-start-duplication.js` 신설 (v0.38.2 약속) | 1.5h | **채택 P0** | 약속 결제, 회귀 자동 감지 |
| 5 | 수동 E2E (v0.39.0 환경 `bkit Session Start` 등장 횟수 캡처) | 20분 | **채택 P0** | 실재 확인 |
| 6 | Tool-controlled display protocol 회귀 검증 (수동) | 30분 | **채택 P1** | hookOutput 계약 호환성 고정 |
| 7 | `agents/*.md` 36개 절대 경로 표현 grep | 10분 | **채택 P1** | Plan Mode #25138 회귀 예방 |
| 8 | ContextManager+Sidecar PR #24752 spec 라이트 추출 + v2.1.0 plan 1줄 hint | 30분 | **채택 P1** | v0.40.0 cycle 재진입 도구 |
| 9 | session-start.js 본문에 가드 추가 | 30분 | **보류** | NG1, wrong-layer |
| 10 | `notifications: false` 플래그 삽입 | 1분 | **보류** | NG2, 무시됨 |
| 11 | invoke_agent 마이그 코드 작성 | 4-6h | **보류 (NG3)** | bkit 미사용, 0 hit |
| 12 | Phase-Aware Context를 BeforeAgent로 이관 | 2-3h | **보류** | 옵션 Y 반려, NG1 연장 |
| 13 | useAgentStream PoC | 1d | **보류 → P2** | 가치 인정, 본 사이클 외 |
| 14 | `/memory inbox` 통합 PoC | 4-6h | **보류 → P3** | YAGNI, 본 사이클 외 |
| 15 | Skill patching 통합 PoC | 4-6h | **보류 → P3** | YAGNI, 본 사이클 외 |
| 16 | MCP `auth` 블록 마이그 | 30분 | **보류** | bkit-server 인증 미운영 |
| 17 | v2.1.0 plan 본격 재설계 (옵션 D) | 4-6h | **보류 (옵션 B 채택)** | v0.40.0 sunk cost 위험 |
| 18 | Issue #25655 업스트림 기여 PR | 2-4h | **보류 → P3** | 내부 품질 무관 |
| 19 | `tool.description` ANSI sanitization 방어 | 30분 | **보류 (NG11)** | 주입 경로 없음 |
| 20 | JSONL audit-store 포맷 정합성 검토 | 2-3h | **보류 → P2** | bkit는 이미 JSONL, 즉시성 낮음 |
| 21 | v0.40.0-preview.2 사전 작업 | — | **보류 (NG13)** | 별도 cycle |

### 5.2 YAGNI 체크리스트

- [x] "있으면 좋을 것 같은" 기능 제외: invoke_agent 마이그(미사용), Phase-Aware 이관(NG1), `/memory inbox` 통합(P3), useAgentStream(P2), MCP auth(미운영)
- [x] 현재 사용자가 실제로 필요: testedVersions 갱신, 회귀 감지 자동화, display 호환성, feature flag 인프라
- [x] bkit 철학 부합: **No Guessing**(중복 원인을 훅에서 추측 수정 안 함, NG1), **Docs = Code**(v2.1.0 plan hint 동기화), **Automation First**(tc107로 회귀 감지 자동화), **Safe Defaults**(테스트 기반 호환성 확정)
- [x] 유지보수 비용 대비 가치: 3.2h 투자로 약속 결제 + 회귀 자동 감지 + display 호환성 고정 + v0.40.0 cycle 진입 도구 확보
- [x] 이전 마이그레이션 불필요 패턴 미반복: v0.38.2 B' 패턴 재사용, plan 분할 회피, naive 풀셋 방지

### 5.3 YAGNI Savings

| Category | Items | Effort |
|----------|-------|--------|
| 채택 (Wave 1-3) | 8 items | 3.2h |
| 보류/이관 | 13 items | 13~16h |
| **Naive 추정 합계 (C/D 풀셋)** | 21 items | ~13~16h |
| **YAGNI 절감률** | | **~75%** |

---

## 6. Recommended Strategy + Rationale (권장 전략 요약)

**Strategy B' (Spot Validation + Defensive Test)** — 3.2h, 3 Waves, 2 file 수정 + 1 file 신규 + 1 file 갱신 (v2.1.0 hint)

### 6.1 핵심 근거

1. **약속 결제 우선**: v0.38.2가 약속한 `tc107-v0382` 미신설 → bkit 자체 신뢰성 회복
2. **올바른 위치의 수정**: 근본 버그(#25655)는 CLI 상위 렌더러 → bkit 코드 수정은 wrong layer (NG1). 방어 테스트가 정직한 조치
3. **업스트림 픽스 자동 추적**: `tc107` + 수동 E2E가 fix PR #25827 머지 도래 시점을 자동 감지
4. **인프라 강화**: feature flag 그룹은 향후 v0.39+/v0.40+ 분기 로직의 일관된 진입점
5. **v0.40.0 cycle 친화**: ContextManager+Sidecar spec 라이트 추출만 수행, 본격 재설계는 v0.40.0 MemoryManager 4-tier와 종합 처리 (옵션 B)
6. **Strategy B' 패턴 정합성**: 8th Strategy B family application, 미니/마이너 업그레이드 + Critical 회귀 방어 + display 회귀 변종

### 6.2 다른 옵션 대비 정당화

| vs A (No-Op) | +3.0h 투자로 약속 결제 + 회귀 자동 감지 + display 호환성 + feature flag 인프라 4개 동시 확보 |
| vs A' (Spot) | +1.8h 투자로 v0.38.2 미이행 약속 결제 (#25655 방어) — 약속 누적 차단 가치가 비용을 상회 |
| vs C (Feature) | useAgentStream은 가치 인정하나 1d 작업이며 본 사이클 약속 결제 후순위 — P2 이관 |
| vs D (Arch) | v2.1.0 본격 재설계는 v0.40.0 MemoryManager 4-tier 도래 후가 정직 (sunk cost 회피) — 옵션 B 채택 |

---

## 7. 구현 단계 (Implementation Steps / Roadmap)

### Wave 1: Version Swap, Feature Flags & Smoke (0.7h) — P0

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 1.1 | `bkit.config.json` `compatibility.testedVersions`에 `"0.38.0"`, `"0.38.1"`, `"0.38.2"`, `"0.39.0"` 4개 문자열 추가 (없는 것만) | `bkit.config.json` L120 | 5분 | P0 |
| 1.2 | `lib/gemini/version.js`에 feature flag 그룹 5~7개 신설 — `hasInvokeAgent` (≥0.39.0), `hasContextManagerSidecar` (≥0.39.0), `hasMcpAuthBlock` (≥0.39.0), `hasToolControlledDisplay` (≥0.39.0), `hasMemoryInbox` (≥0.39.0), `hasGeminiPlansDirEnv` (≥0.39.0). `MAX_PLAUSIBLE_VERSION = '2.0.0'` 안전 범위 유지 | `lib/gemini/version.js` | 30분 | P0 |
| 1.3 | v0.39.0 설치 후 `npm test` 실행 → 993/993 green | 전체 | 5분 | P0 |

**합격 기준**: 993/993 green 유지, feature flag 그룹 export 확인.

### Wave 2: Spot Validation (Display + Plan Mode + ContextManager Spec) (1.0h) — P1

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 2.1 | Tool-controlled display protocol 회귀 (수동) — `before-tool.js` Line 68 (decision: 'ask' + systemMessage), `after-tool.js`, `platform.js#outputAllow` 페이로드를 v0.39.0 환경에서 1회 실행 후 stdout 캡처 → 새 디스플레이 프로토콜과 호환되는지 확인 | 수동 caputre | 30분 | P1 |
| 2.2 | `agents/*.md` 36개 grep — 절대 경로 강제 표현 검출 (Plan Mode #25138 회귀 예방). 발견 시 상대 경로 안내 또는 보존 결정 | `agents/*.md` 전수 | 10분 | P1 |
| 2.3 | PR #24752 본문 정독 → sidecar interface signature 1쪽 메모. 결과를 v2.1.0 plan에 "v0.40.0 cycle 재진입 hint" 1줄 추가 (`<!-- v0.40.0 cycle: ContextManager+Sidecar(#24752) + MemoryManager 4-tier(#25716) 종합 재설계 진입 -->`) | `docs/01-plan/features/v2.1.0-context-optimization.plan.md` 상단 | 30분 (cap) | P1 |

**합격 기준**: display 회귀 0건, agent prompt 절대 경로 강제 표현 0건 (또는 발견 시 기록), v2.1.0 plan에 hint 1줄 추가.

### Wave 3: Defensive Regression Test (1.5h) — P0 (약속 결제)

| # | 작업 | 파일 | 공수 | 우선순위 |
|---|------|------|------|----------|
| 3.1 | `tc107-v0382-session-start-duplication.js` 스켈레톤 (기존 `tc88-hooks-session-start.js` 패턴 참조) | `tests/suites/tc107-v0382-session-start-duplication.js` 신규 | 30분 | P0 |
| 3.2 | 테스트 로직: `hooks/scripts/session-start.js`를 subprocess 실행 → stdout 수집 → JSON parse → `systemMessage` field가 정확히 1번 존재하는지 검증. sentinel 문자열(`bkit Session Start`, `bkit Vibecoding Kit v2.0.4 activated`) 카운트 검증 | 동일 | 30분 | P0 |
| 3.3 | tc107 docstring에 한계 명시: "이 테스트는 훅 단위만 검증. CLI 상위 렌더러 중복은 E2E 수동 확인 필요 (Issue #25655, fix PR #25827 OPEN)" + "본 테스트는 fix PR 머지 시점을 자동 감지하는 카나리아 역할" | 동일 | 10분 | P0 |
| 3.4 | 수동 E2E: v0.39.0 설치 → bkit extension 활성화 → `gemini` 실행 → `bkit Session Start` 등장 횟수 캡처. 결과를 v0.39.0 report에 기록 (Do phase에서) | 수동 | 20분 | P0 |
| 3.5 | tc107 포함 `npm test` → 994/994 green | 전체 | 5분 | P0 |

**합격 기준**: tc107 추가로 994/994 green, 수동 E2E 결과 기록 (1회 또는 2회 어느 쪽이든 관찰 사실).

### Wave 4 (Deferred): 위임

| 항목 | 위임 대상 |
|------|----------|
| useAgentStream PoC | **P2** (별도 cycle) |
| `/memory inbox` 통합 PoC | **P3** |
| Skill patching 통합 PoC | **P3** |
| JSONL audit-store 포맷 정합성 검토 | **P2** |
| MCP `auth` 블록 마이그 | **유보** (bkit-server 인증 도입 시점) |
| ContextManager+Sidecar v2.1.0 plan 본격 재설계 | **v0.40.0 cycle** (옵션 B) |
| MemoryManager 4-tier (#25716), autoMemory split (#25601) 대응 | **v0.40.0 cycle** |
| Issue #25655 업스트림 기여 | **P3** |
| PR #25827 머지 모니터링 | **P3** (5분/주) |

### 총 공수

| Wave | 공수 | 누적 | 우선순위 |
|------|------|------|----------|
| Wave 1: Version Swap, Feature Flags & Smoke | 0.7h | 0.7h | P0 |
| Wave 2: Spot Validation (Display + Plan Mode + Context spec) | 1.0h | 1.7h | P1 |
| Wave 3: Defensive Regression Test (tc107) + E2E | 1.5h | 3.2h | P0 |
| **Buffer** | 0h | **3.2h** | |

---

## 8. 롤백 전략 (Rollback Plan)

### 8.1 체크포인트 생성 시점

1. **Wave 1 시작 전**: `git commit` 또는 branch 분기 `migration/v0.39.0` 생성
2. **Wave 2 시작 전**: Wave 1 완료분 커밋 (P0만으로 호환성 선언 + feature flag 인프라 완료 상태 보존)
3. **Wave 3 시작 전**: Wave 2 완료분 커밋 (display 회귀 + spec hint 보존)
4. **Wave 3 완료 후**: 최종 커밋 (tc107 포함)

### 8.2 롤백 절차 (실패 시)

| 실패 시점 | 복구 절차 |
|----------|----------|
| Wave 1.3 smoke 실패 (993/993 회귀) | `git revert <Wave 1 commit>` → `npm install @google/gemini-cli@0.38.2` 재pin → 원인 분석 후 v0.39.1 대기 |
| Wave 2.1 display 회귀 발견 (hookOutput 형식 호환성 깨짐) | bkit 훅 출력 형식 호환성 패치 또는 `lib/gemini/version.js`의 `hasToolControlledDisplay` 플래그로 분기 처리. v0.39.0 testedVersions 미포함 임시 |
| Wave 3.1~3.3 tc107 작성 환경 이슈 | Wave 1-2만 유지 (display + spec hint 완료 상태), tc107은 차회 이관 |
| Wave 3.4 E2E에서 사용자 심각 UX 저하 (#25655 macOS/Linux 재현) | bkit README 또는 output-style에 임시 경고 "v0.39.0 사용 시 SessionStart 중복 출력 있음, v0.38.2 권장". 근본 수정 대신 안내 |
| 타 이슈 발견 (#25615, #25610) | testedVersions에서 v0.39.0 문자열만 제거, v0.38.2 pin 유지 |

### 8.3 하위 호환 보장

- `minGeminiCliVersion: "0.34.0"` 유지 → 사용자 자율 다운그레이드 가능
- testedVersions에 v0.38.0/.1/.2 병행 기재 → "Issue #25655 회피 원하는 사용자는 v0.38.x 고정" 안내 가능
- bkit 코드 계약 무변경 → v0.38.0 ~ v0.39.0 어느 버전이든 동일 동작
- feature flag 그룹은 모두 `version >= '0.39.0'` 게이팅이므로 하위 버전에서는 false 반환 (안전 fallback)

---

## 9. 검증 체크리스트 (Acceptance Criteria)

### 9.1 필수 항목 (P0)

- [ ] `bkit.config.json` `compatibility.testedVersions` 배열에 `"0.38.0"`, `"0.38.1"`, `"0.38.2"`, `"0.39.0"` 4개 모두 포함
- [ ] `lib/gemini/version.js`에 feature flag 그룹 5~7개 신설 (`hasInvokeAgent`, `hasContextManagerSidecar`, `hasMcpAuthBlock`, `hasToolControlledDisplay`, `hasMemoryInbox`, `hasGeminiPlansDirEnv` 등)
- [ ] v0.39.0 설치 상태에서 `npm test` 결과 **993/993 PASS** (Wave 1 완료 시점) → **994/994 PASS** (Wave 3 완료 시점)
- [ ] `tests/suites/tc107-v0382-session-start-duplication.js` 신설
- [ ] tc107이 훅 프로세스 stdout JSON의 `systemMessage` 필드를 정확히 1회만 검출 (`bkit Session Start`, `bkit Vibecoding Kit v2.0.4 activated` 카운트 1)
- [ ] tc107 docstring에 한계 명시 (CLI 상위 렌더러 중복 검증은 E2E 수동, 카나리아 역할)
- [ ] 수동 E2E: v0.39.0 실환경에서 `gemini` 실행 시 "bkit Session Start" 등장 **횟수 관찰 결과를 Do report에 기록** (1회/2회 어느 쪽이든)

### 9.2 선택 항목 (P1)

- [ ] Tool-controlled display protocol 페이로드 회귀 검증 (`before-tool.js` Line 68 등) 통과
- [ ] `agents/*.md` 36개 절대 경로 강제 표현 grep 결과 (0건이면 confirm, 발견 시 기록)
- [ ] PR #24752 sidecar interface 1쪽 메모 + v2.1.0 plan에 "v0.40.0 cycle 재진입 hint" 1줄 추가

### 9.3 문서 업데이트 범위

| 문서 | 수정 | 내용 |
|------|------|------|
| `docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md` | **신규** (본 문서) | Strategy B' plan |
| `docs/01-plan/features/v2.1.0-context-optimization.plan.md` | hint 1줄 추가 | "v0.40.0 cycle: ContextManager+Sidecar + MemoryManager 4-tier 종합 재설계 진입" |
| `docs/04-report/gemini-cli-v0.39.0-migration.report.md` | Do phase 후 생성 | 실행 결과 + E2E 재현 관찰 기록 + tc107 결과 |
| `docs/01-plan/research/gemini-cli-v0.39.0-research.md` | 수정 없음 | 완료 |
| `docs/03-analysis/gemini-cli-v0.39.0-impact.analysis.md` | 수정 없음 | 완료 |
| `hooks/scripts/session-start.js` | **수정 없음 (NG1)** | 업스트림 버그, bkit 측 수정 금지 |
| `mcp/bkit-server.js` | **수정 없음** | spawn_agent 메커니즘 영향 0건 (Impact §1.1) |

---

## 10. 의존성 및 리스크 (Risk Management)

### 10.1 식별된 위험

| # | 위험 | 확률 | 영향 | 완화책 |
|---|------|------|------|--------|
| R1 | Issue #25655로 인해 v0.39.0 사용자 세션에서 SessionStart 중복 출력 잔존 | **High** (Windows 11 재현, macOS/Linux 미검증) | Medium (UX 저하, 기능 정상) | 옵션 X passive + tc107 방어 테스트, output-style 임시 안내 선택적 |
| R2 | 업스트림 v0.39.1/v0.40.0에서 #25655 픽스 지연 | Medium | Medium | tc107이 픽스 도래 자동 감지, v0.38.x 권장 경로 유지 |
| R3 | Tool-controlled display protocol Steps 2-3가 bkit hookOutput 형식과 미세 비호환 (예: `decision: 'ask'` payload 변경) | Low | Medium | Wave 2.1 회귀 검증으로 조기 발견. 발견 시 `hasToolControlledDisplay` 플래그로 분기 처리 |
| R4 | tc107 작성 중 기존 test harness와 호환성 문제 | Low | Low | Wave 3 실패 시 P0 (Wave 1) + P1 (Wave 2)만 유지하고 tc107은 차회 이관 |
| R5 | v0.39.0 설치 후 993/993 중 예상치 못한 회귀 (101 commits / 513 files 누적 갭으로 인한 hidden regression) | Low (Breaking 0건이지만 누적 갭 큼) | High | `git revert` + v0.38.2 재pin, 원인 분석 |
| R6 | `agents/*.md` 일부에 절대 경로 강제 표현이 발견되어 Plan Mode #25138 동작 변경 영향 | Very Low | Low | Wave 2.2 grep으로 확인, 발견 시 수동 패치 |
| R7 | feature flag 그룹 추가가 기존 분기 로직과 충돌 | Very Low | Low | `hasFeature(version)` 함수 호출자 부재 확인 후 추가 (기존 분기 로직 미변경) |
| R8 | v0.40.0 stable이 본 plan Do phase 진행 중 출시 | Medium (4월 말~5월 초 예상) | Low (본 plan은 v0.39.0만, v0.40.0은 별도 cycle) | 본 plan을 신속 완료 후 v0.40.0 cycle 진입 |
| R9 | ContextManager+Sidecar PR #24752 본문이 sidecar interface spec을 충분히 노출하지 않음 | Medium | Low (라이트 추출만 목표) | spec 추출 30분 cap 엄수, 미흡 시 v2.1.0 plan에 "spec 추출 보류, v0.40.0 cycle에서 본격 진행" 명시 |
| R10 | `@github/keytar` fork 전환이 bkit 환경에 transitive 영향 | Very Low | Low | bkit는 `package.json` 부재 (Impact §2.2), keytar 의존 0건 확정 |

### 10.2 롤백 의사결정 기준

| 상황 | 대응 |
|------|------|
| Wave 1 smoke 실패 | 즉시 revert, v0.38.2 재pin |
| Wave 2.1 display 회귀 발견 | `hasToolControlledDisplay` 플래그로 분기 또는 v0.39.0 testedVersions 미포함 임시 |
| Wave 3 tc107 실패 (설계/환경) | Wave 3 포기, P0 (Wave 1) + P1 (Wave 2)만 유지 |
| E2E에서 SessionStart 중복 심각 UX 저하 확인 | output-style 안내 추가, v0.38.2 권장 명시 |
| v0.39.1 또는 v0.40.0 stable 출시되며 #25655 픽스 | 즉시 다음 마이그레이션 트리거, testedVersions 추가 + tc107 자동 green 확인 |

---

## 11. 참고 문서 (References)

### 11.1 bkit 내부

- Research: `docs/01-plan/research/gemini-cli-v0.39.0-research.md`
- Impact Analysis: `docs/03-analysis/gemini-cli-v0.39.0-impact.analysis.md`
- Predecessor Plan: `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md`
- Related Plan: `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (Wave 2.3 hint 추가 대상)
- Strategy B Pattern: `.claude/agent-memory/migration-strategist/feedback_migration_pattern.md`
- Prior Migration Memory: `project_v0382_migration.md`, `project_v0381_migration.md`

### 11.2 업스트림

- v0.39.0 Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.39.0
- v0.38.2 → v0.39.0 Compare: https://github.com/google-gemini/gemini-cli/compare/v0.38.2...v0.39.0
- **PR #25053 (Breaking)** Legacy SubagentTool 제거: https://github.com/google-gemini/gemini-cli/pull/25053
- PR #24489 invoke_agent 통합: https://github.com/google-gemini/gemini-cli/pull/24489
- PR #25134 Tool-controlled display protocol Steps 2-3: https://github.com/google-gemini/gemini-cli/pull/25134
- PR #24752 ContextManager + Sidecar 디커플드 아키텍처: https://github.com/google-gemini/gemini-cli/pull/24752
- PR #24292 / #24297 useAgentStream: https://github.com/google-gemini/gemini-cli/pull/24292
- PR #24544 / #25148 `/memory inbox` + skill patching: https://github.com/google-gemini/gemini-cli/pull/24544
- PR #23749 JSONL chat recording: https://github.com/google-gemini/gemini-cli/pull/23749
- PR #24946 Plan Mode `activate_skill` 게이트: https://github.com/google-gemini/gemini-cli/pull/24946
- PR #25138 Plan Mode 중첩 디렉토리 + 상대 경로: https://github.com/google-gemini/gemini-cli/pull/25138
- PR #24770 MCP `auth` 블록: https://github.com/google-gemini/gemini-cli/pull/24770
- PR #25022 IDE stdio override RCE 차단: https://github.com/google-gemini/gemini-cli/pull/25022
- PR #25143 keytar → @github/keytar fork: https://github.com/google-gemini/gemini-cli/pull/25143
- PR #25296 GEMINI_PLANS_DIR env var to hooks: https://github.com/google-gemini/gemini-cli/pull/25296
- **Issue #25655 (CRITICAL, 잔존)**: https://github.com/google-gemini/gemini-cli/issues/25655
- **Fix PR #25827 (OPEN, 미머지)**: https://github.com/google-gemini/gemini-cli/pull/25827

### 11.3 v0.40.0 Cycle 재진입 hint (본 plan 범위 외, 별도 cycle)

> v0.40.0-preview.2 (2026-04-23 동시 출시)는 다음을 포함:
> - **MemoryManager 4-tier 리팩터** (PR [#25716](https://github.com/google-gemini/gemini-cli/pull/25716)) — `experimental.memoryManager` → `experimental.memoryV2` (alias 없음), `experimental.jitContext` 기본값 false→true
> - **`autoMemory` rename/split** (PR [#25601](https://github.com/google-gemini/gemini-cli/pull/25601)) — `memoryManager` 단일 플래그 → `memoryManager` + `autoMemory` 분리
>
> 본 v0.39.0 cycle 완료 후 v0.40.0 stable 출시 트리거 시 다음 진입 지점에서 재개:
> 1. ContextManager+Sidecar (#24752) + MemoryManager 4-tier (#25716) 종합 재설계 → `v2.1.0-context-optimization.plan.md` 본격 갱신 (옵션 D 시점)
> 2. `lib/core/agent-memory.js` (현재 user/project 2-scope) + `lib/core/memory.js` + `bkit-system/philosophy/context-engineering.md` Line 271-279 (Memory Systems 4종) 종합 영향 분석
> 3. `experimental.memoryManager` → `experimental.memoryV2` rename 호환성 분석 (alias 없음 — bkit 명시 사용 시 즉시 break)

---

## 12. 권장 다음 단계 (Recommended Next Steps)

| # | 단계 | 명령 / 트리거 | 산출물 |
|---|------|---------------|--------|
| 1 | 본 plan 사용자 검토 + 승인 | (수동 검토) | 승인 또는 수정 요청 |
| 2 | P4 보고서 작성 (Plan Validation Report) | `/pdca check gemini-cli-v0.39.0-migration` 또는 직접 작성 | `docs/04-report/gemini-cli-v0.39.0-migration.report.md` (Do 전 — Plan validation 섹션) |
| 3 | Do phase 실행 — Wave 1 (Version Swap & Smoke) | `/pdca do gemini-cli-v0.39.0-migration` | `bkit.config.json`, `lib/gemini/version.js` 수정 + smoke 결과 |
| 4 | Do phase 실행 — Wave 2 (Spot Validation) | (계속) | display 회귀 결과, agent grep 결과, v2.1.0 plan hint |
| 5 | Do phase 실행 — Wave 3 (Defensive Test) | (계속) | `tests/suites/tc107-v0382-session-start-duplication.js` 신설 + E2E 결과 기록 |
| 6 | 최종 보고서 갱신 + 메모리 업데이트 | (수동) | `project_v0390_migration.md` 메모리, MEMORY.md 인덱스 업데이트 |
| 7 | v0.40.0 stable 출시 모니터링 | 외부 트리거 | 별도 cycle 진입 (본 plan 11.3 hint 활용) |

---

*Plan 작성 완료: 2026-04-23 | 승인 대기*
*Strategy: B' (Spot Validation + Defensive Test) — 9th Strategy B family application, Minor 업그레이드 + Critical 회귀 방어 (약속 결제) + Tool-controlled display 회귀 변종*
*Migration target: v0.38.2 → v0.39.0 (101 commits / 513 files / 41 contributors, Breaking hit 0)*

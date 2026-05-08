# Gemini CLI v0.40.0 마이그레이션 종합 보고서

> /gemini-migration Phase 4 산출물 (Phase 1~3 통합)
> 작성일: 2026-04-29
> 범위: v0.39.1 → v0.40.0 stable 마이그레이션 전략, 위험 분석, 구현 로드맵

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| **대상 버전** | v0.39.1 → v0.40.0 stable (2026-04-28 출시) |
| **조사 완료일** | 2026-04-29 |
| **총 영향 범위** | 27개 파일 (Critical 0 / High 3 / Medium 7 / Low 17) |
| **Critical Issues** | **0건** (Phase 1 Field Verification으로 trust env 회귀 확정 0건) |
| **기능 개선 기회** | 5건 (이번 cycle 1건 부분 적용 + 4건 별도 cycle 위임) |
| **채택 전략** | **Strategy B' (Standard + Spot Verification)** — 가중 7.65, B family 10번째 적용 |
| **예상 작업 기간** | **3.5~4.5시간** (Wave 1: P0 ~30분 + Wave 2: P1 ~2-2.5h + Wave 3: P2 ~1h) |
| **위험도** | **LOW** |

### Value Delivered (4 관점)

| 관점 | 내용 |
|------|------|
| **Problem** | v0.40.0 stable 출시(2026-04-28)로 bkit v2.0.6이 1단계 뒤처짐. Memory 모델 재편(4-tier prompt-driven) + topic narration default-on + Headless Trust Enforcement 강화가 bkit 토글/baseline에 잠재 영향 가능 |
| **Solution** | Phase 1~3 통합 분석으로 영향 27개 파일 식별, Critical 회귀 0건 확인. Strategy B'(Standard + Spot Verification)로 ~4시간 안전 마이그레이션 + v2.1.0 context-optimization cycle 트리거 점화 |
| **Function UX Effect** | bkit baseline runner stdout 노이즈 사전 차단(topic narration false), version capability flag로 v0.40.0 신기능 게이트, testedVersions 누적으로 호환성 매트릭스 명시 |
| **Core Value** | bkit 마이그레이션 패턴(B family) 10번째 적용으로 표준화 안정 강화. 외부 인터페이스 실측 검증 절차(CLI env/flag 실측) 9→10번째 적용. v2.1.0 context-optimization(token budget 최적화) 본격 진입 채비 |

---

## 1. v0.40.0 변경사항 요약

### §1.1 통계

**범위**: v0.39.1...v0.40.0 (72 commits, 10 behind)

- 총 PR 수: 72개 (user-facing ~62개)
- 카테고리 분포:
  - 🔴 Breaking-leaning Behavior Change: 3개
  - 🟠 Behavior Change: 6개
  - 🟡 Feature Add: 15개
  - 🟢 Bug Fix: 27개
  - 🔒 Security: 1개
  - Docs/Internal: 10개

### §1.2 Top 3 영향 후보

1. **PR #25601 + #25716 (Memory 모델 재편)**
   - `experimental.memoryManager` 의미 분리: (a) MemoryManagerAgent 제거 + `save_memory` swap / (b) background skill 추출 → 신규 `experimental.autoMemory` 토글로 이동
   - 4-tier prompt-driven 메모리: ① `./GEMINI.md` / ② `./<sub>/GEMINI.md` / ③ `~/.gemini/tmp/<hash>/memory/MEMORY.md` (신규 private tier) / ④ `~/.gemini/GEMINI.md`
   - bkit 직접 영향: 0건 (bkit는 자체 메모리 `.bkit/state/memory.json` 사용)

2. **PR #25814 (Headless Trust Enforcement)**
   - ⚠️ **Phase 1 Field Verification (2026-04-29 실측)**: 정확한 환경변수명은 **`GEMINI_CLI_TRUST_WORKSPACE`** (CLI prefix 유지)
   - bkit 현재 상태: `mcp/bkit-server.js:1119`에서 정확하게 사용 중 → **회귀 0건**

3. **PR #25586 (Topic Update Narration default-on + general 승격)**
   - `experimental.topicUpdateNarration` (default `false`) → `general.topicUpdateNarration` (default `true`)
   - bkit baseline runner stdout에 multi-step 진행 narration 자동 추가 → noisy pattern 회귀 잠재 위험 1건

### §1.3 이전 메모 정정/확정 사항

| 항목 | 이전 메모 | v0.40.0 stable 검증 결과 |
|------|-----------|--------------------------|
| `experimental.memoryV2` rename | 미확정 | ❌ rename 없음. 키 이름 `experimental.memoryManager` 유지, 의미만 4-tier prompt-driven으로 변경 |
| PR #25814 Headless Trust 변수명 | `GEMINI_TRUST_WORKSPACE` (오류) | ✅ 정정 필요. 정확한 변수명: **`GEMINI_CLI_TRUST_WORKSPACE`** (CLI prefix 유지) — bkit는 이미 정확하게 사용 중 |
| PR #25601 autoMemory split | bkit 토글 영향 | ✅ 확정. 신규 `experimental.autoMemory` 추가. bkit 미사용 (default `false`) |
| PR #25716 4-tier 메모리 | 본문 검증 필요 | ✅ 확정. MemoryManagerAgent 완전 제거 (-157 lines), 4-tier 파일 라우팅 prompt-driven 전환 |

### §1.4 미해결 추적 항목

| PR | 이슈 | 상태 | bkit 영향 |
|----|----|------|-----------|
| #25827 | Issue #25655 SessionStart `systemMessage` 중복 렌더 fix | **OPEN** (2026-04-29) | v0.40.0 stable 미포함. bkit tc113 카나리아 방어 유지 필요 |

---

## 2. bkit 영향 분석

### §2.1 영향 매트릭스 요약

**총 27개 파일 영향 범위 (Phase 2 실측)**:
- Critical 0건 (Phase 1 정정으로 회귀 사라짐)
- High 3건 (testedVersions 갱신, version flag, topic narration 잠금)
- Medium 7건 (memoryManager 의미 분리 명문화, autoMemory 신규 토글, 4-tier 메모리 paths 검증, MCP resources 채택, /clear 동작, /new alias, GEMINI_CLI_TRUSTED_FOLDERS_PATH)
- Low 17건 (UI/내부/문서 메타데이터)

### §2.2 Top 3 Breaking/Behavior 매핑

#### Headless Trust Enforcement (Phase 1 정정 후 회귀 0건)

| 항목 | 내용 |
|------|------|
| 정확한 변수명 | `GEMINI_CLI_TRUST_WORKSPACE` (CLI prefix 유지) |
| bkit 현재 상태 | `mcp/bkit-server.js:1119`에서 정확하게 주입 중 |
| tc115 검증 | 모든 TC115-02~05 테스트 `GEMINI_CLI_TRUST_WORKSPACE` 정확한 변수명 사용 |
| 회귀 위험 | **0건** (변수명 일치, 코드 변경 0건) |

#### Memory 모델 재편 (의미 분리 + 4-tier)

| 항목 | 내용 |
|------|------|
| 변경 본질 | `experimental.memoryManager` 의미 둘로 분리 (swap vs. background extraction) |
| MemoryManagerAgent 제거 | 완전 삭제 (-157 lines) |
| bkit 코드 영향 | MemoryManagerAgent spawn/invoke_agent 호출 **0건** (grep 확정) |
| 메모리 path 영향 | `~/.gemini/tmp/<hash>/memory/` 가정 코드 **0건** (bkit는 `.bkit/state/`, `.gemini/agent-memory/bkit/` 사용) |
| 회귀 위험 | **0건** (메모리 모델 재편의 직접 영향 0건) |

#### Topic Narration default-on

| 항목 | 내용 |
|------|------|
| 변경 | `experimental.topicUpdateNarration` (default `false`) → `general.topicUpdateNarration` (default `true`) |
| bkit 회귀 시나리오 | baseline runner stdout assertion에 자동 narration 추가 → noisy line 회귀 잠재 |
| 현 상태 | `.gemini/settings.json`에 `topicUpdateNarration` 명시 없음 → v0.40.0 default `true` 적용됨 |
| 수정 방안 | `.gemini/settings.json`에 `"general": { "topicUpdateNarration": false }` 추가 (1줄) |
| 회귀 위험 | 🟠 High → W1.3 + W2.2 실측으로 사전 차단 |

### §2.3 bkit-system/philosophy 정합성 검증

**종합 결론**: v0.40.0 변화는 bkit 철학(8개 원칙) 중:
- ✅ 4개 강화 (Automation First + Memory 단순화, Full Visibility, No Guessing, Docs=Code)
- ✅ 4개 유지 (Safe Defaults, Progressive Trust, Always Interruptible, AI as Partner)
- ❌ 0개 약화 또는 충돌

v0.40.0은 bkit 철학과 **상향 정렬**. v0.39.1 사이클(보안 강화)에 이어 v0.40.0(메모리 모델 단순화 + AI Partnership 강화)도 일관된 방향.

### §2.4 v2.1.0 context-optimization 플랜과의 시너지

**v2.1.0 plan Section 4 (구체적 개선 항목) 트리거 발동**:

| v2.1.0 항목 | v0.40.0 변화 | 정합 | 신규 기회 |
|----------|------------|-----|---------|
| Section 4 sidecar 매핑 | 변동 0건 | ✅ | — |
| Section 5 Token Budget 재산정 | 4-tier 메모리는 bkit namespace 분리 — 영향 0 | ✅ | **MCP resources export**(PR #25395) — 매 턴 토큰 ~30% 절감 추정 |
| Section 6 Skill 통합 | autoMemory 분리되지만 bkit 미사용 | ✅ | — |
| Section 9 구현 로드맵 | Wave 분할 재설계 트리거 | 🟠 | v2.1.0 plan refresh cycle 진입 권고 |

**결론**: v0.40.0 = v2.1.0 plan 진입점. MCP resources export PoC는 v2.1.0 cycle에서 단독 추진.

### §2.5 사전 부채 83건과의 상호작용

- **해소 가능성**: 0건
- **악화 가능성**: 1건 (stdout assertion 항목이 topic narration noisy line으로 깨질 수 있음 — P0 1줄 설정으로 차단)
- **무영향**: 82건

---

## 3. 채택 전략: Strategy B'

### §3.1 대안 비교 (5개)

| 전략 | 작업 시간 | 핵심 | 가중 점수 |
|------|----------|------|----------|
| A (Minimal) | ~0.5h | "stable 따라잡기" 최소 단위 | 6.10 |
| B (Standard) | ~3-4h | v0.39.1 cycle B 패턴 그대로 | 7.40 |
| **B' (Standard + Spot)** | **~3.5-4.5h** | **v0.39.1 cycle B' 9th 적용 → 10th 적용** | **7.65** ⭐ |
| B'' (B + MCP Lite) | ~5-6h | B + v2.1.0 진입점 포착 | 7.30 |
| C (Full) | ~1-2d | v0.40.0 신규 기능 5건 모두 활용 | 7.05 |

### §3.2 Strategy B' 채택 근거

1. **가중 점수 7.65 = 1위** (마이그 안전성 0.30 + 작업 시간 0.25 + 회귀 차단 0.20 + 새 기능 0.15 + v2.1.0 시너지 0.10 가중치 적용)

2. **검증된 패턴의 10번째 적용**
   - v0.39.1 cycle Strategy B' 적용 결과가 v2.0.6 main merge (PR #24)로 성공
   - 동형 구조 = 안전성 최고

3. **Critical 회귀 0건 + 회귀 잠재 1건(topic narration)을 spot 검증으로 차단**
   - v0.39.1 학습 적용: "외부 인터페이스는 PR 본문이 아닌 CLI 실측이 1차 권위"
   - Spot 항목 3건: tc113/tc107 파일 존재 확인, topic narration baseline 1회 실측, YOLO+deny 우선순위 검증 (총 30분 추가)

4. **Strategy C 제외 사유**
   - C는 새 기능 활용 점수 10점이지만 작업 시간(0.25 가중치) 3점 손해
   - 시너지 가중치(0.10)가 안전성(0.30) + 작업 시간(0.25)를 못 이김
   - MCP resources PoC는 v2.1.0 plan refresh cycle에서 단독 진입 권장

### §3.3 YAGNI 절감 ~28%

18개 후보 항목 중:
- **13개 채택** (testedVersions, version flag 4개, topic narration 잠금, autoMemory/memoryManager 잠금, tc38 매트릭스, tc113/tc107 확인, spot 검증 3건, 문서 갱신 4개)
- **3개 별도 cycle 위임** (MCP resources PoC, 4-tier namespace docs, GEMINI_CLI_TRUSTED_FOLDERS_PATH)
- **2개 제거** (tc116 신규 카나리아, gemini gemma 로컬)

**절감 상세**: 후보 18개 vs v0.39.1 cycle ~25개 — 입력 풀 자체 12% 더 작음 (v0.40.0 영향 자체가 적음). 채택률 72% (13/18).

### §3.4 결정 잠금

**D1**: Strategy B' 채택 ✅

**D2**: MCP resources export — v2.1.0 plan refresh cycle에서 단독 PoC (본 cycle 분리) ✅

**D3**: v2.1.0 plan 갱신 시점 — 별도 cycle (본 cycle 후 1주 이내) ✅

**D4**: testedVersions 누적 정책 — 현행 유지 (계속 누적, N=10 도달 시 재검토) ✅

**D5**: 사전 부채 83건 — 본 cycle은 v0.40.0만 처리. Wave 2.5 baseline 1회로 자동 해소/악화 여부만 보고 ✅

---

## 4. 구현 로드맵 (Wave 분할)

### §4.1 Wave 1 (P0, ~30분) — Critical Patch + 회귀 사전 차단

| # | 작업 | 파일:라인 | 예상 시간 | AC |
|---|------|----------|---------|-----|
| W1.1 | testedVersions에 `"0.40.0"` 추가 | `bkit.config.json:120` | 1분 | json valid |
| W1.2 | v0.40.0+ feature flag 4개 신규 | `lib/gemini/version.js:212` 뒤 | 10분 | `hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral` |
| W1.3 | `general.topicUpdateNarration: false` 명시 | `.gemini/settings.json:2` | 5분 | baseline smoke stdout 잡음 0줄 |
| W1.4 | tc38 매트릭스에 v0.40.0+ 4개 추가 | `tests/suites/tc38-feature-flags-matrix.js` | 15분 | tc38 PASS |

**검증**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS + `general.topicUpdateNarration` 적용 확인

### §4.2 Wave 2 (P1, ~2-2.5h) — Spot Verification + 의도 명문화

| # | 작업 | 파일/명령 | 예상 시간 | AC |
|---|------|----------|---------|-----|
| W2.1 | tc113/tc107 파일 존재 실측 | `find tests/suites -name "tc107*" -o -name "tc113*"` | 10분 | 파일 존재 여부 명시 (부재 시 v0.39.0/v0.39.1 누락 처리) |
| W2.2 | topic narration L3 baseline 1회 실측 | `(cd /tmp && npx --yes @google/gemini-cli@0.40.0 -p "list 3 numbers")` | 15분 | narration 줄 수 == 0 (W1.3 설정 적용 후) |
| W2.3 | bkit-permissions deny 우선순위 spot | `gemini --approval-mode=yolo -p "rm -rf /tmp/xxx"` (격리) | 15분 | deny 규칙이 YOLO 우선 동작 |
| W2.4 | `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 | `.gemini/settings.json:2` (W1.3과 같은 객체에 추가) | 10분 | json valid + baseline 메모리 변경 0건 |
| W2.5 | full baseline 1회 (1925/2032 회복 확인) | `node tests/run-all.js` | 30-60분 | pass >= 1925, fail/skip 분포 v0.39.1과 동일 |
| W2.6 | tc115 / tc113 / tc38 회귀 명시 PASS | run-all 결과 grep | 5분 | 3개 테스트 모두 PASS |
| W2.7 | Phase 1/2 산출물 무결성 확인 | path read | 5분 | 4개 파일 경로 유효 |

**검증**: 
- find 결과: tc113 / tc107 파일 존재 또는 부재 명시
- L3 실측: topic narration noisy line == 0 (W1.3 적용 후)
- Full baseline: pass >= 1925 (v0.39.1 baseline 회복)
- tc115 (trust env), tc113 (#25655 SessionStart) 모두 PASS

### §4.3 Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump

| # | 작업 | 파일:라인 | 예상 시간 | AC |
|---|------|----------|---------|-----|
| W3.1 | GEMINI.md 헤더/footer bkit v2.0.6 → v2.0.7 | `GEMINI.md:1, 67` | 5분 | grep 확인 |
| W3.2 | README.md v0.40.0 testedVersions + 안내 1단락 | `README.md` | 15분 | 1단락 추가 |
| W3.3 | gemini-cli-learning/SKILL.md: 4-tier memory + MCP resources | `gemini-cli-learning/SKILL.md` | 20분 | 2개 단락 추가 |
| W3.4 | gemini-cli-learning/SKILL.md: /new alias | 동일 | 5분 | 1줄 추가 |
| W3.5 | bkit.config.json version 2.0.6 → 2.0.7 | `bkit.config.json` | 1분 | json valid |
| W3.6 | PR commit message 초안 | — | 10분 | `feat(v2.0.7): Gemini CLI v0.40.0 migration + spot verification` |

**검증**:
- 모든 docs에 v0.40.0 테스트 완료 명시
- bkit v2.0.7 일관성 (GEMINI.md, README.md, bkit.config.json)
- PR commit message 초안 준비 완료

### §4.4 Wave 4 (선택, 별도 cycle)

본 cycle에서 제외, 향후 cycle에 위임:
- **v2.1.0 plan refresh cycle**: MCP resources export PoC, 4-tier namespace 명문화, Section 4/5/6/9 갱신
- **onboarding UX cycle**: `GEMINI_CLI_TRUSTED_FOLDERS_PATH` 활용, bootstrap 자동화
- **v0.41.0-preview / next stable cycle**: 신규 변경사항 대응

---

## 5. bkit 기능 개선/고도화 제안

| # | 제안 | 출처 PR | 우선순위 | 본 cycle vs 별도 | 예상 효과 | 상태 |
|---|------|--------|---------|----------------|---------|-----|
| 1 | **MCP resources export** (`list_mcp_resources` / `read_mcp_resource`) | #25395 | P1 | 별도 cycle (v2.1.0) | 매 턴 ~30% token 절감 추정 | Wave 4 위임 |
| 2 | **autoMemory 명시 잠금** (bkit는 비사용) | #25601 | P1 | 본 cycle Wave 2 | No Guessing 강화 + 향후 default 변경 회귀 방어 | W2.4 ✅ |
| 3 | **topic narration 잠금** (baseline noisy stdout 차단) | #25586 | P0 | 본 cycle Wave 1 | baseline runner 노이즈 사전 차단 | W1.3 ✅ |
| 4 | **4-tier memory namespace 명문화** | #25716 | P2 | 별도 cycle (v2.1.0) | Docs=Code 강화 + 사용자 혼란 방지 | Wave 4 위임 |
| 5 | **`gemini gemma` 로컬 모델 fallback** | #25498 | P3 | 별도 cycle | 외부 API 사용 정책 변경 동반 | YAGNI 제거 |

---

## 6. 위험 관리 계획

### §6.1 R1~R5 리스크 매트릭스

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| R1 | topic narration default-on 미차단 시 baseline noisy stdout 회귀 | MED | LOW | W1.3 1줄 + W2.2 L3 1회 실측 | LOW |
| R2 | 4-tier memory paths(`~/.gemini/tmp/<hash>/memory/`) 가정 코드 누락 | LOW | LOW | Impact §1.2 grep 0건 + W2.5 baseline 회복 | NEAR-ZERO |
| R3 | PR #25827 (Issue #25655) 머지 시점이 본 cycle 충돌 | LOW | LOW | tc113 카나리아 유지 + W2.1 파일 존재 실측 | LOW |
| R4 | v0.41.0-preview.0 / next stable이 빨리 출시 | LOW | MED | 사용자 메모리 HOLD 명시 — 출시 시 W1만 즉시 + W2/W3 흡수 | LOW |
| R5 | hidden regression — pass 1925/2032 미달 | LOW | LOW | W2.5 full baseline 1회 + W2.6 카나리아 PASS | LOW |

**전체 리스크**: LOW (Critical 0건, MED 2건이 모두 spot 1건씩으로 차단)

### §6.2 카나리아 유지 전략

- **tc115-v0391-headless-trust.js**: GEMINI_CLI_TRUST_WORKSPACE 환경변수 정확성 (계속 PASS 유지 예상)
- **tc113-issue-25655-systemmessage-duplicate.js**: SessionStart 중복 렌더 방어 (PR #25827 OPEN — 계속 유지)
- **tc38-feature-flags-matrix.js**: v0.40.0+ feature flag 매트릭스 갱신 (4개 항목 추가)

### §6.3 PR #25827 추적

**상태**: OPEN (2026-04-29). v0.40.0 stable 미포함.

**대응**: bkit `hooks/scripts/session-start.js:354-360`의 `BKIT_SESSION_START_VERBOSE=false` slim default 유지로 방어. tc113 카나리아 계속 작동.

### §6.4 v0.41.0-preview.0 / 다음 stable 재산정 트리거

- v0.41.0-preview 안정화 시: 신규 changes 분석
- 다음 stable 출시 시: Wave 1만 즉시 머지, Wave 2/3 흡수 검토

---

## 7. 다음 단계

### §7.1 본 cycle Do 단계 진입

**명령**: `/pdca do gemini-cli-v0.40.0-migration`

Wave 1 → Wave 2 → Wave 3 순차 실행 (역순 금지).

### §7.2 v2.1.0 plan refresh cycle 권고

**진입 조건**: 본 cycle close 직후 (1주 이내)

**담당 항목**:
- Section 4 (sidecar 매핑 재확인)
- Section 5 (Token Budget 재산정 — MCP resources export PoC 등록)
- Section 6 (Skill 통합 후보 갱신)
- Section 9 (구현 로드맵 Wave 재설계)

**예상 시간**: ~1d (plan 갱신) + 3-5d (implementation PoC)

### §7.3 v2.1.0 implementation cycle 권고

**MCP resources export PoC** 본격 진입:
- bkit-server.js에 resources export 인터페이스 추가
- `bkit-system/philosophy/*.md` 4개 export 및 에이전트 자동 검색

### §7.4 v0.41.0-preview.0 / 다음 stable 별도 cycle 트리거 조건

- v0.41.0-preview 안정화
- 다음 stable 출시 시

### §7.5 bkit-baseline-stabilization cycle 별도 권고

**대상**: 사전 부채 83건 (PDCA-* 35 + TC80-* 9 + COMP-* 7 + TC94/91/110/96/109/98/tc92 29)

**진입 시점**: 별도 의사 결정 시

---

## 8. 학습 및 표준 절차 강화

### §8.1 외부 인터페이스 실측 검증 (9→10번째 적용)

v0.39.1 cycle에서 학습한 "gemini-researcher 보고는 1차 자료이지 권위 아님" 원칙을 본 cycle도 유지:

- **환경변수**: PR 본문이 아닌 npx 격리 실측이 1차 권위 → `GEMINI_CLI_TRUST_WORKSPACE` 정확성 확인
- **stdout 동작**: 정적 분석 아닌 L3 baseline 1회 실측 → topic narration noisy line 확인

### §8.2 Strategy B family 10번째 적용으로 패턴 안정화

- v0.38.2: Strategy B' (2.5h)
- v0.39.0: Strategy B' (3.2h)
- v0.39.1: Strategy B' (2.7h) ← 9th application
- **v0.40.0: Strategy B' (3.5-4.5h) ← 10th application**

**패턴 확정**: 마이그레이션 수렴 시간 ~2.5-4.5h, 회귀 위험 spot 검증 ~30분.

### §8.3 YAGNI + Decision 명문화

본 plan D1~D5로 향후 cycle 추적 가능. Decision이 본 cycle 종료 후에도 유효한지 재검토 필요 (v0.41.0 출시 시).

---

## 9. 참고 자료

### §9.1 본 cycle 산출물 4개 파일

1. **Phase 1 Research**: `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (Field Verification 정정 박스 포함, 2026-04-29)
2. **Phase 2 Impact**: `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md` (정정 후 회귀 0건 확정, 2026-04-29)
3. **Phase 3 Plan**: `docs/01-plan/features/gemini-cli-v0.40.0-migration.plan.md` (Strategy B' 채택, 2026-04-29)
4. **Phase 4 Report**: `docs/04-report/gemini-cli-v0.40.0-migration.report.md` (본 파일, 2026-04-29)

### §9.2 이전 cycle 비교 참조

| Cycle | Strategy | 시간 | 위험도 | 테스트 패스 |
|-------|----------|------|--------|-----------|
| v0.38.2 | B' | 2.5h | LOW | baseline 회복 |
| v0.39.0 | B' | 3.2h | MEDIUM-HIGH | baseline 회복 |
| v0.39.1 | B' | 2.7h | MEDIUM-HIGH | baseline 회복 (PR #24 merge) |
| **v0.40.0** | **B'** | **3.5-4.5h** | **LOW** | **baseline 회복 (예상)** |

### §9.3 외부 PR 링크

**핵심 PR** (본문 검증 완료):
- PR #25601: autoMemory split
- PR #25716: 4-tier prompt-driven memory
- PR #25395: MCP resources tools
- PR #25022: IDE stdio RCE fix
- PR #25586: topic narration default-on
- PR #25814: Headless Trust Enforcement
- PR #25827: SessionStart systemMessage 중복 fix (OPEN)

---

## 10. Changelog

### v2.0.7 (2026-04-29 예정)

**Added**:
- Feature flag 4개: `hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral` (v0.40.0+ 게이팅용)
- `general.topicUpdateNarration: false` 명시 (baseline noisy stdout 차단)

**Changed**:
- testedVersions에 `"0.40.0"` 추가 (v0.39.1...v0.40.0 호환성 선언)
- `.gemini/settings.json`에 `experimental.autoMemory: false`, `experimental.memoryManager: false` 명시 (의도 명문화)
- 문서 v0.40.0 신규 기능 반영 (GEMINI.md, README.md, gemini-cli-learning/SKILL.md)

**Fixed**:
- PR #25814 Headless Trust Enforcement 환경변수 정확성 재확인 (`GEMINI_CLI_TRUST_WORKSPACE` — 변수명 일치, 코드 변경 0건)
- PR #25827 (Issue #25655) 미해결 상태 — tc113 카나리아 계속 방어

---

*Report 종료: 2026-04-29*

*Phase 4 통합 완료. Strategy B' (10th application) 채택. 총 작업 3.5-4.5시간, 위험도 LOW, Critical 회귀 0건. 외부 인터페이스 실측 검증 절차 표준화 적용. v2.1.0 context-optimization 본격 진입 트리거 발동.*

*bkit-report-generator agent*

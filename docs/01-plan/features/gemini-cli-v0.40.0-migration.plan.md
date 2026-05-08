# Gemini CLI v0.40.0 마이그레이션 Plan

> Phase 3 산출물. /gemini-migration Phase 3 — Plan-Plus 브레인스토밍.
> Research: `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (Field Verification 정정 박스 포함)
> Impact: `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md`
> 이전 cycle: v0.39.1 Strategy B' (2.7h, 3 phases) — `.claude/agent-memory/migration-strategist/project_v0391_migration.md`
> 작성일: 2026-04-29
> 베이스라인: bkit v2.0.6 (= Gemini CLI v0.39.1 stable, PR #24 main 머지)

---

## 0. Intent Discovery

### 0.1 사용자 의도 추정 (3 가설)

| 가설 | 근거 | 신뢰도 |
|------|------|--------|
| H1: "안전하게 stable 따라잡기" | Critical 회귀 0건. testedVersions 누락은 호환성 선언 부채. v0.40.0은 Phase 1 정정으로 사실상 in-place upgrade — minimal effort로 cycle close 가능 | ⬛⬛⬛⬛⬜ |
| H2: "v2.1.0 context-optimization 본격 가속" | Impact §9가 명시적으로 "v0.40.0 stable 진입 = v2.1.0 plan 트리거 발동" 선언. MCP resources(PR #25395)는 8,613 tokens/turn baseline의 ~30% 절감 추정 — 본 cycle이 토큰 최적화 진입점 | ⬛⬛⬛⬛⬜ |
| H3: "기능 고도화 욕심" (autoMemory, gemma 로컬, /new alias) | Impact §11 5건 모두 P2/P3 — bkit가 자체 메모리/외부 API 사용 중이라 직접 가치 낮음. 욕심으로 전환 시 YAGNI 위반 | ⬛⬛⬜⬜⬜ |

**결론**: H1 + H2 부분 채택. H3 보류. 즉 "안전 우선 minimal upgrade + v2.1.0 진입점 1건만 선포착".

### 0.2 가용 시간 / 리스크 톨러런스 가정

- **가용 시간**: v0.39.1 cycle (2.7h) 직후 1주 이내 본 cycle. 사용자 메모리에 v0.41.0-preview HOLD 상태 명시 — 다음 stable까지 여유 있음. **2-4시간** 가용 추정.
- **리스크 톨러런스**: LOW. v0.39.1에서 Critical 1건이 Phase 1 정정으로 0건이 된 학습 — 외부 인터페이스(env/flag/API) 검증 표준화. baseline (1925/2032 = 94.7%) 유지 우선.
- **하루 단위 작업**(Strategy C ~1-2d) 채택 정당화 어려움. 본 cycle은 v0.40.0 stable에 한정.

---

## 1. 마이그레이션 대안 비교

### 1.1 전략 정의 (5개)

| 전략 | 정의 | 작업 시간 | 핵심 |
|------|------|----------|------|
| **A** | Minimal — testedVersions + version flag + topic narration 잠금 1줄 + tc38 매트릭스 | ~0.5h | "stable 따라잡기" 최소 단위 |
| **B** | Standard — A + autoMemory 명시 잠금 + tc116 회귀 검증 신규 + 문서 갱신 | ~3-4h | v0.39.1 cycle Strategy B 패턴 그대로 |
| **B'** | Standard + Spot Verification — B + tc113/tc107 파일 존재 실측 + topic narration L3 baseline 1회 + bkit-permissions deny 우선순위 spot 검증 | ~3.5-4.5h | v0.39.1 cycle Strategy B' 9th 적용 |
| **B''** | Standard + MCP Resources Lite — A + autoMemory 잠금 + topic narration 검증 + MCP resources read-only PoC (philosophy 4개 export만) | ~5-6h | B + v2.1.0 진입점 *살짝* 포착 |
| **C** | Full — B + MCP resources export 본격 + v2.1.0 plan Section 4/6/9 본격 갱신 + 4-tier namespace 명문화 + GEMINI_CLI_TRUSTED_FOLDERS_PATH 활용 | ~1-2d (8-16h) | v0.40.0 신규 기능 5건 모두 활용 |

### 1.2 가중 점수 매트릭스

가중치(사용자 컨텍스트 반영):
- 마이그레이션 안전성 0.30 (Critical 회귀 0건 — 안전성 가중치 그대로 유지)
- 작업 시간 0.25 (가용 2-4h 가정 — minimal 선호)
- 회귀 차단 0.20 (topic narration 사전 차단 1건이 핵심)
- 새 기능 활용 0.15 (v2.1.0 시너지 한정)
- v2.1.0 시너지 0.10 (트리거 발동 cycle이지만 본 cycle 분리 가능)

각 차원 1~10점:

| 차원 (가중치) | A | B | B' | B'' | C |
|--------------|---|---|----|-----|---|
| 마이그 안전성 (0.30) | 7 | 9 | **10** | 9 | 8 |
| 작업 시간 (0.25) | **10** | 8 | 7 | 6 | 3 |
| 회귀 차단 (0.20) | 6 | 9 | **10** | 9 | 9 |
| 새 기능 활용 (0.15) | 1 | 3 | 3 | 6 | **10** |
| v2.1.0 시너지 (0.10) | 1 | 2 | 2 | 5 | **10** |
| **가중 합** | **6.10** | **7.40** | **7.65** | **7.30** | 7.05 |

### 1.3 권장 전략

**Strategy B' (Standard + Spot Verification)** — 7.65점 (1위, 0.25 차이로 B 추월).

**근거**:
1. v0.39.1 cycle Strategy B' (9th application)와 동형 — **검증된 패턴 10번째 적용**.
2. Critical 회귀 0건 + 회귀 잠재 1건 (topic narration noisy stdout) 구조는 B 표준이면 충분하지만, v0.39.1에서 학습한 "외부 인터페이스 실측 표준"을 본 cycle도 spot으로 적용. tc113/tc107 파일 존재 확인 + topic narration baseline 1회 실측은 30분 추가로 회귀 차단 신뢰도를 9→10으로 올림.
3. C는 새 기능 활용 10점이지만 가용 시간(0.25 가중치)에서 3점 — 시너지 가중치(0.10)가 안전성(0.30) + 작업 시간(0.25)을 못 이김. **C는 별도 cycle (v2.1.0 plan 갱신 cycle)로 분리**.
4. B''는 MCP resources PoC 1건 추가만으로 5-6h — 본 cycle에서 PoC하면 검증 부담이 v0.40.0 회귀 차단과 섞임. v2.1.0 cycle에서 단독 PoC 권장.

**대안 활성화 조건**:
- 가용 시간 0.5h 미만 → A로 강제 축소 (P0 4건만)
- 가용 시간 1-2일 + v2.1.0 cycle 본 cycle과 합치기 결정 → C로 확장

---

## 2. YAGNI 리뷰

각 후보 작업 항목 채택/유보/제거:

| # | 항목 | 채택? | 근거 |
|---|------|-------|------|
| 1 | testedVersions에 0.40.0 추가 | ✅ 채택 | 호환성 명시 부채 — 1줄 |
| 2 | version flag 4개 (`hasMcpResourcesTools`, `hasAutoMemoryToggle`, `hasMemoryFourTier`, `hasTopicNarrationGeneral`) | ✅ 채택 | capability gating은 bkit lib/gemini/version.js 표준 — 향후 활용 시 1줄 수정으로 진입 |
| 3 | `general.topicUpdateNarration: false` 명시 잠금 | ✅ 채택 | default `true` → bkit baseline runner stdout 노이즈 회귀 사전 차단 — 1줄 |
| 4 | tc38 매트릭스 4개 항목 추가 | ✅ 채택 | version flag 추가와 동기화 의무 — 4줄 |
| 5 | `experimental.autoMemory: false` 명시 | ✅ 채택 | default `false`이지만 No Guessing 원칙(의도 명문화) + 향후 default 변경 회귀 방어 — 1줄, P1 |
| 6 | `experimental.memoryManager: false` 명시 | ⚠️ 유보 → ✅ 채택 | autoMemory와 페어로 명시. bkit는 자체 메모리 사용 — 의도 명문화. 1줄 |
| 7 | tc116 신규 (v0.40.0 회귀 검증 카나리아) | ⚠️ 유보 → ❌ 제거 | tc115(v0.39.1 trust) + tc113(#25655) 카나리아 둘 다 v0.40.0에서 PASS 유지 예상 (Impact §6). v0.40.0 단독 카나리아 신설은 회귀 신호 0개 — YAGNI 위반. **B' Spot 검증으로 대체** (tc113/tc107 파일 존재 + topic narration baseline 1회 실측, ~30분) |
| 8 | tc113/tc107 파일 존재 실측 | ✅ 채택 (spot) | Impact §13 신뢰도 ⬛⬛⬛⬜⬜ — find 1줄로 확정. 부재 시 v0.39.1 cycle 누락 처리 |
| 9 | topic narration L3 baseline 1회 실측 | ✅ 채택 (spot) | Impact §13 ⬛⬛⬛⬛⬜ — 정적 분석으로 충분하지만 stdout 노이즈는 실측이 1차 권위 (v0.39.1 학습) |
| 10 | bkit-permissions.toml deny 우선순위 spot 검증 | ✅ 채택 (spot) | YOLO + dangerous heuristic 차단(PR #25341) bkit 보안 영향 — Impact §3 신뢰도 ⬛⬛⬛⬜⬜. 5분 spot |
| 11 | MCP resources export PoC (philosophy 4개) | ❌ 제거 → 별도 cycle | v2.1.0 plan 본격 갱신 cycle에서 PoC 단독 진입. 본 cycle 혼합 시 회귀 차단 부담 가중 |
| 12 | 4-tier namespace docs 명문화 (`context-engineering.md`) | ❌ 제거 → 별도 cycle | 영향 0건이므로 docs-only 갱신은 v2.1.0 cycle과 묶기 |
| 13 | GEMINI_CLI_TRUSTED_FOLDERS_PATH bootstrap 활용 | ❌ 제거 → 별도 cycle | v0.39.1 cycle Strategy B' Phase 3 bootstrap UX 잔존(P2) — 별도 onboarding cycle |
| 14 | `gemini gemma` 로컬 모델 fallback | ❌ 제거 | 외부 API 사용 정책 변경 동반 — bkit 의도 외 |
| 15 | `/new` alias docs 1줄 | ⚠️ 유보 → ✅ 채택 (Wave 3) | gemini-cli-learning/SKILL.md 1줄 — 5분, 사용자 학습 가치 |
| 16 | gemini-cli-learning/SKILL.md v0.40.0 5건 갱신 | ⚠️ 유보 → ✅ 부분 채택 (Wave 3) | 5건 중 핵심 2건만 (4-tier memory, MCP resources) — autoMemory/gemma/topic narration은 bkit 비사용/비채택 |
| 17 | README.md v0.40.0 안내 1단락 | ✅ 채택 (Wave 3) | testedVersions 갱신과 동기 |
| 18 | GEMINI.md 헤더/footer 버전 bump | ✅ 채택 (Wave 3) | bkit v2.0.6 → v2.0.7 (= v0.40.0 cycle close) |

**채택률**: 18 후보 중 13 채택 + 3 별도 cycle 위임 + 2 제거 = **YAGNI 절감 ~28%** (5/18). v0.39.1 cycle YAGNI 절감(~80%)보다 낮은데, 이는 v0.40.0의 bkit 직접 영향 자체가 적어서 후보 수가 처음부터 작기 때문. 후보 수 18 vs v0.39.1 cycle ~25개 — 입력 풀 자체가 12% 더 작음.

---

## 3. 권장 전략 Wave 분할 (Strategy B')

총 예상 시간: **~3.5-4.5시간** (Phase 1 ~30분, Phase 2 ~2-2.5h, Phase 3 ~1h, Buffer ~30분).

### Wave 1 (P0, ~30분) — Critical Patch + 회귀 사전 차단

| # | 작업 | 파일 (file:line) | 검증 (L1/L2/L3) | 예상 시간 |
|---|------|-----------------|---------------|---------|
| W1.1 | testedVersions에 `"0.40.0"` 추가 | `bkit.config.json:120` | L1 unit (json schema) | 1분 |
| W1.2 | v0.40.0+ feature flag 4개 신규 | `lib/gemini/version.js:212` 뒤 | L1 unit (`tc04-lib-modules`) | 10분 |
| W1.3 | `general.topicUpdateNarration: false` 명시 | `.gemini/settings.json:2` | L2 baseline (smoke `gemini -p "test"` stdout 잡음 0줄) | 5분 |
| W1.4 | tc38 매트릭스에 v0.40.0+ 4개 추가 | `tests/suites/tc38-feature-flags-matrix.js` | L1 unit (tc38 PASS) | 15분 |

**AC**: `node tests/run-all.js --suite=tc04,tc38,smoke` PASS + `general.topicUpdateNarration` 적용 확인.

### Wave 2 (P1, ~2-2.5h) — Spot Verification + 의도 명문화

| # | 작업 | 파일 (file:line 또는 명령) | 검증 (L1/L2/L3) | 예상 시간 |
|---|------|--------------------------|---------------|---------|
| W2.1 | tc113/tc107 파일 존재 실측 | `find tests/suites -name "tc107*" -o -name "tc113*" -o -name "*25655*"` | 명령 결과 — 부재 시 v0.39.0/v0.39.1 cycle 누락 처리 | 10분 |
| W2.2 | topic narration L3 baseline 실측 | `(cd /tmp && npx --yes @google/gemini-cli@0.40.0 -p "list 3 numbers")` 1회 stdout 캡처 + 잡음 line 카운트 | L3 1회 실측 — narration 줄 수 == 0 (W1.3 설정 적용 시) | 15분 |
| W2.3 | bkit-permissions deny 우선순위 spot | `gemini --approval-mode=yolo -p "rm -rf /tmp/xxx"` 시뮬 (격리 sandbox) — deny 우선 동작 확인 | L2 spot — deny 규칙이 YOLO 우선 | 15분 |
| W2.4 | `experimental.autoMemory: false` + `experimental.memoryManager: false` 명시 | `.gemini/settings.json:2` (W1.3과 같은 객체에 추가) | L1 (json valid) + L2 (smoke baseline에서 메모리 변경 0건) | 10분 |
| W2.5 | full baseline 1회 (1925/2032 회복 확인) | `node tests/run-all.js` | L2 baseline — pass count >= 1925, fail/skip 분포 v0.39.1과 동일 | 30-60분 |
| W2.6 | tc115 / tc113 / tc38 회귀 명시 PASS 확인 | run-all 결과 grep | L2 grep | 5분 |
| W2.7 | docs/01-plan/research + docs/03-analysis 본 cycle 산출물 확인 (참조 무결성) | path read | — | 5분 |

**AC**:
- `find` 결과: tc113 / tc107 파일 존재 또는 부재 명시 (부재 시 별도 부채로 등록)
- L3 실측: topic narration noisy line == 0 (W1.3 적용 후)
- Full baseline: pass >= 1925 (v0.39.1 baseline 회복)
- tc115 (trust env), tc113 (#25655 SessionStart) 모두 PASS

### Wave 3 (P2, ~1h) — 문서 갱신 + 버전 bump

| # | 작업 | 파일 (file:line) | 검증 | 예상 시간 |
|---|------|-----------------|------|---------|
| W3.1 | `GEMINI.md:1, 67` 헤더/footer bkit v2.0.6 → v2.0.7 | `GEMINI.md` | L1 grep | 5분 |
| W3.2 | README.md v0.40.0 testedVersions + 신규 안내 1단락 | `README.md` | L1 grep | 15분 |
| W3.3 | `gemini-cli-learning/SKILL.md`에 4-tier memory 1단락 + MCP resources 1단락 | `gemini-cli-learning/SKILL.md` | L1 read | 20분 |
| W3.4 | `gemini-cli-learning/SKILL.md`에 `/new` alias 1줄 | 동일 | L1 read | 5분 |
| W3.5 | `bkit.config.json` version `2.0.6` → `2.0.7` | `bkit.config.json` | L1 (json valid) | 1분 |
| W3.6 | 본 cycle Phase 4 Do PR 진입 준비 (commit message 초안) | — | — | 10분 |

**AC**:
- 모든 docs에 v0.40.0 테스트 완료 명시
- bkit v2.0.7 일관성 (GEMINI.md, README.md, bkit.config.json)
- PR commit message 초안 준비 완료

### Wave 4 (선택, 별도 cycle)

본 cycle에서 제외, v2.1.0 plan 갱신 cycle 또는 onboarding UX cycle에 위임:
- MCP resources export PoC (`bkit://philosophy/*`, `bkit://templates/*`)
- 4-tier namespace docs 명문화 (`bkit-system/philosophy/context-engineering.md`)
- `GEMINI_CLI_TRUSTED_FOLDERS_PATH` bootstrap 자동화
- v2.1.0 plan Section 4/6/9 본격 갱신
- gemini gemma 로컬 fallback 검토

---

## 4. 리스크 매트릭스

| ID | 리스크 | 가능성 | 영향 | 완화책 | 잔존 위험 |
|----|--------|-------|------|--------|----------|
| R1 | topic narration default-on 미차단 시 baseline noisy stdout 회귀 | MED | LOW (cosmetic, assertion 깨짐 잠재) | W1.3 1줄 + W2.2 L3 1회 실측 | LOW |
| R2 | 4-tier memory paths(`~/.gemini/tmp/<hash>/memory/`)를 가정한 bkit 코드 누락 발견 | LOW | LOW | Impact §1.2 grep 확인 0건 + Wave 2 baseline 회복 검증 | NEAR-ZERO |
| R3 | PR #25827 (Issue #25655) 머지 시점이 본 cycle 작업과 충돌 | LOW | LOW | tc113 카나리아 유지 + W2.1 파일 존재 실측 | LOW |
| R4 | v0.41.0-preview.0 다음 stable이 빨리 출시되어 본 cycle 무효화 | LOW | MED | 사용자 메모리에 HOLD 명시 — 출시 시 W1만 즉시 머지하고 W2/W3은 v0.41 cycle 흡수 | LOW |
| R5 | 누적 갭 hidden regression (v0.39.0 cycle 학습) — pass 1925/2032 미달 | LOW | LOW | W2.5 full baseline 1회 실측 + W2.6 카나리아 PASS 확인 | LOW |
| R6 | YOLO + dangerous heuristic 차단(PR #25341)이 bkit-permissions deny 우선순위와 충돌 | LOW | MED (보안) | W2.3 spot 검증. 충돌 발견 시 P3 부채 등록 후 본 cycle 진행 | LOW |
| R7 | tc113 / tc107 파일 부재 발견 (v0.39.0/v0.39.1 cycle 누락) | LOW | MED | W2.1 find 실측. 부재 시 별도 P1 부채 등록 — 본 cycle 진행 차단하지 않음 | LOW |
| R8 | `general.topicUpdateNarration` 키 위치가 `.gemini/settings.json` 적용 안 됨 (alias 우선순위 문제) | LOW | LOW | W2.2 L3 실측에서 자동 검출 + alias로 `experimental.topicUpdateNarration: false` 페어 추가 fallback | NEAR-ZERO |

**전체 리스크**: LOW (Critical 0건, MED 2건이 모두 spot 검증 1건씩으로 차단). v0.39.1 cycle (MEDIUM-HIGH)에 비해 크게 낮음.

### 4.1 롤백 전략

- **L1 rollback**: `git revert <commit-sha>` — bkit.config.json / .gemini/settings.json / lib/gemini/version.js 변경 모두 1줄~수줄로 atomic.
- **L2 rollback**: 사용자 환경 `~/.gemini/settings.json`에 `general.topicUpdateNarration: true` (또는 미설정)으로 복구 — bkit `.gemini/settings.json`은 project-scope이므로 user-scope override 가능.
- **L3 rollback**: `npx --yes @google/gemini-cli@0.39.1`로 CLI 자체 다운그레이드 — bkit testedVersions에 0.39.1 유지 보장.

---

## 5. 결정 항목 (Decisions)

### D1: 권장 전략

**옵션**:
- (a) Strategy A (Minimal, 0.5h)
- (b) Strategy B (Standard, 3-4h)
- (c) **Strategy B' (Standard + Spot Verification, 3.5-4.5h)** ← 권장
- (d) Strategy B'' (B + MCP resources Lite, 5-6h)
- (e) Strategy C (Full, 1-2d)

**권장**: (c) Strategy B'.

**근거**:
1. 가중 점수 7.65 — 1위.
2. v0.39.1 cycle Strategy B' 9th 적용 결과 검증된 패턴 (10번째 적용).
3. Critical 회귀 0건이지만 회귀 잠재 1건(topic narration) + 신뢰도 ⬛⬛⬛⬜⬜ 항목 3건(tc113/tc107 존재, YOLO+deny 우선순위, topic narration baseline 영향)이 모두 spot 30-60분으로 확정 가능 — v0.39.1 학습("외부 인터페이스는 PR 본문이 아닌 실측이 1차 권위")의 일관 적용.
4. Strategy A는 spot 검증 누락으로 v0.40.0 hidden regression 신호를 놓칠 위험. Strategy C는 본 cycle에서 v2.1.0 진입을 동시 시도해 회귀 차단 신호 분리도가 떨어짐.

### D2: MCP resources export — 본 cycle vs v2.1.0 별도 cycle

**옵션**:
- (a) 본 cycle Wave 4로 PoC 포함 (B''/C 채택)
- (b) **v2.1.0 plan 본격 갱신 cycle에서 단독 PoC** ← 권장
- (c) v2.0.x 패치 cycle로 분리 (예: v2.0.8 onboarding 강화 cycle과 묶기)

**권장**: (b).

**근거**:
1. v2.1.0 plan Section 4 (구체적 개선 항목)에 "MCP resources export PoC" 신규 후보 등록 — Impact §11 #1이 명시.
2. 본 cycle에 포함 시 회귀 차단(W1/W2)과 PoC(추가 1d)가 섞여 검증 신뢰도 저하.
3. v2.1.0 cycle은 bkit 자체 토큰 최적화(8,613 tokens/turn → -30% 목표)가 단독 KPI — MCP resources export는 그 cycle의 핵심 lever.
4. 본 cycle Wave 1.2의 `hasMcpResourcesTools` flag가 v2.1.0 cycle 진입 게이트로 작용 — 미리 깔아두는 효과 충분.

### D3: v2.1.0 plan 갱신 시점 — 본 cycle 포함 vs 별도 cycle

**옵션**:
- (a) 본 cycle Wave 3에 Section 4/5/6/9 갱신 포함 (Strategy C 채택)
- (b) **본 cycle은 v0.40.0 한정 — v2.1.0 plan 갱신은 별도 cycle (`v2.1.0 plan refresh cycle`)** ← 권장
- (c) v2.1.0 cycle 자체와 합치기 (Do/Check까지)

**권장**: (b).

**근거**:
1. Impact §9는 "트리거 발동" 명시이지 "본 cycle 처리" 강제가 아님. 트리거 발동 = "다음 cycle 진입점 확보" 의미로 해석.
2. v2.1.0 plan은 6개 Section + 로드맵 4개 Wave 규모 — Phase 3 plan-plus 분량이 v0.40.0 cycle 본 plan과 동등하거나 더 큼. 분리가 정상.
3. 본 cycle close 후 즉시 별도 cycle 진입 — 1주 이내 권장.

### D4: testedVersions 누적 정책

**옵션**:
- (a) `["0.34.0", ..., "0.39.0", "0.39.1", "0.40.0"]` 모두 누적
- (b) **최근 N개만 유지 (예: 최근 5개 = `["0.36.0", "0.37.2", "0.38.2", "0.39.1", "0.40.0"]`)** ← 검토 필요
- (c) 최신 stable 1개만 = `["0.40.0"]`
- (d) v0.39.1 cycle 정책 그대로 — 누적

**권장**: (d) 누적 유지 (현행 정책). 단 N=10 도달 시 D4 재검토.

**근거**:
1. 현재 testedVersions는 v0.34.0 이후 누적 — 사용자에게 "이 버전들에서 검증됨" 신호. 압축(b/c)은 "최신만 검증"으로 약화 가능.
2. JSON 한 줄 추가 비용 0 — 누적 정책 변경 명분 없음.
3. v0.39.1 cycle Decision 4 ("backward compat: keep `minGeminiCliVersion: "0.34.0"`, accumulate testedVersions")와 일관.

### D5: 사전 부채 83건 처리

**옵션**:
- (a) 본 cycle은 v0.40.0만 — 사전 부채 미처리 (현 방침)
- (b) 본 cycle Wave 4에 P0 부채 1-2건 흡수
- (c) 별도 부채 cycle (`bkit-baseline-stabilization cycle`) 진입

**권장**: (a) 본 cycle은 v0.40.0만 — Impact §10 결론 그대로. 단 Wave 2.5 baseline 1회 실측에서 v0.40.0 변화로 부채 항목이 자동 해소/악화되는지 보고만 (1줄).

---

## 6. AC (Acceptance Criteria) — 본 cycle 성공 기준

### 정량

1. **L1 unit**: tc04 / tc38 / smoke PASS (Wave 1).
2. **L2 baseline**: `node tests/run-all.js` pass >= 1925 (v0.39.1 baseline 회복) — Wave 2.5.
3. **L3 spot**: topic narration noisy line == 0 (W1.3 적용 후 npx 격리 실측) — Wave 2.2.
4. **회귀 카나리아**: tc115 (trust env) PASS + tc113 (#25655 SessionStart) PASS — Wave 2.6.
5. **bkit 버전**: GEMINI.md / README.md / bkit.config.json 모두 `bkit v2.0.7` 일관 — Wave 3.

### 정성

1. **YAGNI 준수**: Wave 4(MCP resources, v2.1.0 plan, namespace docs, gemma) 모두 별도 cycle 위임 — 본 cycle 분량 ~3.5-4.5h 유지.
2. **외부 인터페이스 실측**: tc113/tc107 파일 존재, topic narration L3 stdout, YOLO+deny 우선순위 — 모두 spot 실측 결과 명시.
3. **v0.39.1 cycle 학습 적용**: Strategy B' 10번째 적용. "gemini-researcher 보고는 1차 자료이지 권위 아님" 원칙 본 cycle도 유지.
4. **Decision 명문화**: D1~D5 본 plan에 모두 명시 — 향후 cycle 추적 가능.

---

## 7. 다음 단계 트리거

본 cycle (v0.40.0) close 후 즉시/조건부 진입할 별도 cycle:

| Cycle | 진입 조건 | 본 plan에서 위임된 항목 | 예상 시간 |
|-------|----------|------------------------|---------|
| **v2.1.0 plan refresh cycle** | 본 cycle close 직후 (1주 이내) | Section 4/5/6/9 갱신, MCP resources PoC 후보 등록, 4-tier namespace docs 명문화 | ~1d |
| **v2.1.0 implementation cycle** | v2.1.0 plan refresh cycle close 후 | MCP resources export PoC 본격 (bkit-server.js + philosophy/templates resource registration) | ~3-5d |
| **v0.41.0-preview / next stable cycle** | v0.41.0-preview 안정화 또는 다음 stable 출시 시 | Wave 1만 즉시 머지 + Wave 2/3 흡수 | ~3-4h |
| **bkit-baseline-stabilization cycle** | 사전 부채 83건 처리 의사 결정 시 | PDCA-* 35 + TC80-* 9 + COMP-* 7 + TC94/91/110/96/109/98/tc92 29건 | ~1-2주 |
| **onboarding UX cycle** | 신규 사용자 onboarding 강화 의사 결정 시 | `GEMINI_CLI_TRUSTED_FOLDERS_PATH` 활용 + bootstrap-trust.sh 자동화 (v0.39.1 Phase 3 잔존) | ~1-2d |

**우선순위 추천**: v2.1.0 plan refresh cycle > v0.41.0 stable cycle > 나머지.

---

## 8. 참고 자료 (Phase 1/2 산출물 + 이전 cycle)

- **Phase 1 Research**: `docs/01-plan/research/gemini-cli-v0.40.0-research.md` (Field Verification 정정 박스 포함, 2026-04-29)
- **Phase 2 Impact**: `docs/03-analysis/gemini-cli-v0.40.0-impact.analysis.md` (정정 후 회귀 0건 확정, 2026-04-29)
- **이전 cycle plan**:
  - `docs/01-plan/features/gemini-cli-v0.39.1-migration.plan.md` (Strategy B', 2.7h, 9th 적용)
  - `docs/01-plan/features/gemini-cli-v0.39.0-migration.plan.md` (Strategy B', 3.2h)
  - `docs/01-plan/features/gemini-cli-v0.38.2-migration.plan.md` (Strategy B', 2.5h)
- **이전 cycle report (확인 권장)**: `docs/04-report/` (v0.39.1, v0.39.0)
- **v2.1.0 plan**: `docs/01-plan/features/v2.1.0-context-optimization.plan.md` (Section 4/5/6/9 갱신 트리거 발동 cycle — 본 plan에서 별도 cycle로 위임)
- **bkit 철학**: `bkit-system/philosophy/{core-mission,ai-native-principles,context-engineering,workflow-philosophy}.md` (4대 원칙 — Impact §8에서 v0.40.0과 4 강화 / 4 유지 / 0 충돌 검증)
- **메모리 인덱스**: `.claude/agent-memory/migration-strategist/MEMORY.md` + `project_v0391_migration.md` (Strategy B' 패턴 검증 history)

---

## 9. 본 plan close 후 다음 액션 (메인 세션용 요약)

1. **D1 (전략) 사용자 확인** — Strategy B' 채택 여부.
2. **D2/D3 (MCP resources / v2.1.0 plan)** — 본 cycle 분리 vs 포함 사용자 확인.
3. **Phase 4 Do 진입** — `gemini-migration` SKILL.md Phase 4 절차에 따라 Wave 1 → Wave 2 → Wave 3 순차 실행.
4. **PR 생성** — 본 cycle 단일 PR (v0.39.1 cycle과 동일 패턴). commit message에 `feat(v2.0.7): Gemini CLI v0.40.0 migration + topic narration lock + spot verification` 포맷.
5. **v2.1.0 plan refresh cycle 진입 알림** — 본 cycle close 직후 메인 세션에서 트리거 검토.

---

*Phase 3 Plan-Plus 종료: 2026-04-29. Strategy B' 권장 (10th application). 작업 시간 ~3.5-4.5h, 위험도 LOW. v0.40.0 stable 영향 분석 + 회귀 사전 차단 + 의도 명문화 + spot 검증의 4축 균형. v2.1.0 plan 본격 갱신 + MCP resources PoC + namespace docs는 별도 cycle 위임.*
*migration-strategist agent*

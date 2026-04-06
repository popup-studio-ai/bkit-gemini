# Issue #20: Agent 호출 시 model 선택 이슈 — 원인 분석 및 대응계획

> 작성일: 2026-04-02
> 이슈: [#20](../../issues/20) — `/pdca analyze` 실행 시 gap-detector 에이전트 모델 매칭 오류
> 심각도: 🔴 Critical (에이전트 실행 차단)

---

## 1. 원인 분석 (Root Cause Analysis)

### 1.1 현상

```
Model "gemini-3.1-pro" was not found or is invalid.
```

`/pdca analyze` → `gap-detector` 에이전트 호출 시, Gemini CLI v0.36.0이 `gemini-3.1-pro` 모델을 인식하지 못해 실행이 중단됨.

### 1.2 근본 원인

| 구분 | 내용 |
|------|------|
| **직접 원인** | 에이전트 frontmatter에 `model: gemini-3.1-pro`로 하드코딩됨 |
| **실제 모델 ID** | `gemini-3.1-pro-preview` (docs/guides/model-selection.md:44 참조) |
| **중개 레이어 부재** | bkit에 모델명 정규화(normalization) 로직이 없음 |
| **플랜 의존** | Google One AI Pro 플랜에서는 preview 모델만 접근 가능할 수 있음 |

### 1.3 아키텍처 흐름

```
Agent Frontmatter (model: gemini-3.1-pro)  ← 잘못된 모델 ID
    ↓
spawn-agent-server.js → `gemini -e <agentPath>`
    ↓
Gemini CLI가 frontmatter 파싱 → model 필드 추출
    ↓
Gemini CLI가 모델 검증 → ❌ "gemini-3.1-pro" 없음
    ↓
에러 출력 + 대화형 모델 선택 프롬프트 (에이전트 모드에서 블로킹)
```

**핵심**: bkit은 모델명을 그대로 Gemini CLI에 전달하며, 모델 유효성 검증이나 폴백 로직이 없음.

### 1.4 영향 범위

**총 7개 에이전트가 `gemini-3.1-pro`를 사용** (모두 동일 이슈 발생 가능):

| 에이전트 | 파일 | 역할 |
|----------|------|------|
| **gap-detector** | agents/gap-detector.md:19 | 설계-구현 갭 분석 |
| **cto-lead** | agents/cto-lead.md:24 | CTO급 팀 오케스트레이션 |
| **pm-lead** | agents/pm-lead.md:15 | PM 팀 리드 |
| **pm-discovery** | agents/pm-discovery.md:19 | 기회 탐색/OST |
| **pm-strategy** | agents/pm-strategy.md:18 | 가치 제안/전략 |
| **pm-research** | agents/pm-research.md:18 | 시장 조사 |
| **pm-prd** | agents/pm-prd.md:18 | PRD 종합 |

**영향받는 워크플로우:**
- `/pdca analyze` — gap-detector 사용 불가
- `/pdca team` — cto-lead 사용 불가
- `/pdca pm` — PM 팀 전체 (5개 에이전트) 사용 불가

### 1.5 기존 인지 여부

이 문제는 이미 gap-analysis-synthesis.md에서 **AR-06**으로 식별되어 있었음:

> AR-06 | 에이전트 모델 하드코딩 | gemini-3.1-pro 고정 | 설정 외부화 | P2

---

## 2. 대응계획

### Phase 1: 긴급 수정 (Immediate Fix)

**목표**: 7개 에이전트의 모델명을 현재 Gemini CLI v0.36.0에서 유효한 ID로 수정

| 작업 | 변경 내용 | 파일 |
|------|-----------|------|
| 1-1 | `gemini-3.1-pro` → `gemini-3.1-pro-preview` | 7개 에이전트 frontmatter |
| 1-2 | VALID_MODELS 배열 업데이트 | tests/suites/tc93-skills-agents.js |
| 1-3 | model-selection.md 가이드 정합성 확인 | docs/guides/model-selection.md |

**검증**: 수정 후 `/pdca analyze` 실행하여 gap-detector 정상 호출 확인

### Phase 2: 모델 정규화 레이어 도입 (Short-term)

**목표**: 모델명 불일치 재발 방지를 위한 중개 레이어 구축

| 작업 | 설명 |
|------|------|
| 2-1 | `lib/gemini/model-resolver.js` 신규 생성 — 모델명 정규화 함수 |
| 2-2 | 별칭(alias) 매핑 테이블: `gemini-3.1-pro` → `gemini-3.1-pro-preview` |
| 2-3 | spawn-agent-server.js에서 에이전트 실행 전 모델명 검증/정규화 호출 |
| 2-4 | 존재하지 않는 모델명 감지 시 경고 로그 + 폴백 모델 사용 |

**모델 정규화 매핑 예시:**

```javascript
const MODEL_ALIASES = {
  'gemini-3.1-pro': 'gemini-3.1-pro-preview',
  'gemini-3.1-pro-customtools': 'gemini-3.1-pro-preview-customtools',
  // GA 출시 후에는 alias 제거하고 직접 매핑
};
```

### Phase 3: 설정 외부화 (Medium-term, AR-06 대응)

**목표**: 에이전트 모델을 하드코딩이 아닌 설정으로 관리

| 작업 | 설명 |
|------|------|
| 3-1 | `.gemini/settings.json`에 `agentModels` 섹션 추가 |
| 3-2 | 에이전트 frontmatter의 model을 설정 파일에서 오버라이드 가능하게 |
| 3-3 | CLI 버전별 모델 매핑 테이블을 version.js의 feature flags와 연동 |

**설정 예시:**

```json
{
  "agentModels": {
    "tier1": "gemini-3.1-pro-preview",
    "tier2": "gemini-3-pro",
    "tier3": "gemini-3-flash",
    "tier4": "gemini-3-flash-lite"
  }
}
```

---

## 3. 우선순위 및 일정

| Phase | 우선순위 | 의존성 | 상태 |
|-------|---------|--------|------|
| Phase 1: 긴급 수정 | 🔴 P0 | 없음 | **즉시 착수** |
| Phase 2: 정규화 레이어 | 🟠 P1 | Phase 1 완료 | 다음 릴리스 |
| Phase 3: 설정 외부화 | 🟡 P2 | Phase 2 완료 | v2.1.0 |

---

## 4. 위험 요소

| 위험 | 영향 | 완화 방안 |
|------|------|-----------|
| `gemini-3.1-pro-preview`도 플랜별 제한 가능 | 일부 사용자 여전히 에러 | 폴백 모델(`gemini-3-pro`) 설정 |
| `-preview` 접미사가 GA 출시 후 제거될 수 있음 | 재차 모델 ID 변경 필요 | Phase 2의 alias 매핑으로 대응 |
| 이슈 보고자의 임시 조치(`-preview` 수동 추가)와 충돌 | 없음 | 동일한 방향의 수정이므로 호환 |

---

## 5. 참고

- Issue #20: https://github.com/popup-studio-ai/bkit-gemini/issues/20
- docs/guides/model-selection.md:44 — 실제 모델 ID `gemini-3.1-pro-preview`
- docs/01-plan/research/gap-analysis-synthesis.md:118 — AR-06 기존 인지
- Gemini CLI v0.36.0 모델 목록에서 `gemini-3.1-pro`는 없고 `gemini-3.1-pro-preview`만 존재

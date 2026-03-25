# bkit-gemini v2.0.0 사용자 가이드

> **bkit** (Vibecoding Kit) - Gemini CLI Edition
> "Write your idea. bkit does the rest."
>
> 버전: 2.0.0 | 최종 업데이트: 2026-03-21
> 라이선스: Apache 2.0 | 개발: POPUP STUDIO PTE. LTD.

---

## 목차

1. [bkit이란?](#1-bkit이란)
2. [설치 및 시작하기](#2-설치-및-시작하기)
3. [프로젝트 레벨 시스템](#3-프로젝트-레벨-시스템)
4. [PDCA 워크플로우](#4-pdca-워크플로우)
5. [스킬 시스템](#5-스킬-시스템)
6. [에이전트 시스템](#6-에이전트-시스템)
7. [9단계 개발 파이프라인](#7-9단계-개발-파이프라인)
8. [자동화 레벨 (L0-L4)](#8-자동화-레벨)
9. [Hook 시스템](#9-hook-시스템)
10. [정책 엔진 (TOML)](#10-정책-엔진)
11. [컨텍스트 엔지니어링](#11-컨텍스트-엔지니어링)
12. [팀 오케스트레이션](#12-팀-오케스트레이션)
13. [메모리 시스템](#13-메모리-시스템)
14. [출력 스타일](#14-출력-스타일)
15. [MCP 서버](#15-mcp-서버)
16. [보안 시스템](#16-보안-시스템)
17. [체크포인트 & 롤백](#17-체크포인트--롤백)
18. [감사 로그](#18-감사-로그)
19. [BTW (개선 제안) 시스템](#19-btw-개선-제안-시스템)
20. [PM 에이전트 팀](#20-pm-에이전트-팀)
21. [bkend.ai BaaS 통합](#21-bkendai-baas-통합)
22. [템플릿 시스템](#22-템플릿-시스템)
23. [도구 레퍼런스](#23-도구-레퍼런스)
24. [명령어 전체 목록](#24-명령어-전체-목록)
25. [자주 묻는 질문 (FAQ)](#25-자주-묻는-질문)

---

## 1. bkit이란?

### 1.1 개요

bkit은 **Gemini CLI 위에서 동작하는 AI 네이티브 개발 키트**입니다. Context Engineering과 PDCA(Plan-Do-Check-Act) 방법론을 결합하여, 아이디어를 체계적으로 구현할 수 있도록 도와줍니다.

### 1.2 핵심 철학

| 원칙 | 설명 |
|------|------|
| **Automation First** | 반복 작업은 AI가 자동 처리합니다. 사용자는 의사결정에 집중합니다. |
| **No Guessing** | 추측하지 않습니다. 불확실하면 반드시 사용자에게 확인합니다. |
| **Docs = Code** | 문서와 코드는 항상 동기화됩니다. 설계 문서가 곧 구현 사양입니다. |
| **AI as Partner** | AI는 도구가 아니라 파트너입니다. Human-AI 역할 분담을 통해 최적의 결과를 만듭니다. |

### 1.3 무엇을 할 수 있나요?

- **체계적 기능 개발**: PDCA 사이클로 계획 → 설계 → 구현 → 검증 → 개선
- **자동 코드 품질 관리**: Gap 분석으로 설계-구현 일치도 90% 이상 유지
- **다국어 자동 감지**: 한국어, 영어, 일본어 등 8개 언어로 자연스럽게 대화
- **프로젝트 레벨별 최적화**: 초보자부터 엔터프라이즈까지 맞춤형 워크플로우
- **21개 전문 AI 에이전트**: CTO, PM, QA, 보안, 프론트엔드 등 전문 역할 자동 위임
- **35개 도메인 스킬**: 웹, 모바일, 데스크톱, BaaS 등 다양한 기술 스택 지원

### 1.4 구성 요소 한눈에 보기

```
bkit v2.0.0
├── 21개 AI 에이전트        - 전문 역할 기반 자율 작업
├── 35개 도메인 스킬        - 기술 도메인별 지식 베이스
├── 10개 훅 이벤트          - AI 라이프사이클 제어
├── 23개 빌트인 도구        - 파일, 실행, 검색, 추적
├── 4가지 출력 스타일       - 레벨별 맞춤 응답
├── 6단계 PDCA 사이클       - 체계적 개발 워크플로우
├── 3단계 프로젝트 레벨     - Starter / Dynamic / Enterprise
├── 5가지 팀 오케스트레이션  - Leader / Council / Swarm / Pipeline / Watchdog
└── 8개 언어 자동 감지      - EN, KO, JA, ZH, ES, FR, DE, IT
```

---

## 2. 설치 및 시작하기

### 2.1 사전 요구사항

- **Gemini CLI v0.34.0 이상** 설치 필요
- Node.js 18+ (훅 스크립트 실행용)

### 2.2 설치 방법

```bash
# 1. Gemini CLI 설치 (아직 없다면)
npm install -g @google/gemini-cli

# 2. bkit-gemini 클론
git clone https://github.com/popup-studio-ai/bkit-gemini.git

# 3. 프로젝트에 bkit 연결
cd your-project
# gemini-extension.json이 bkit을 가리키도록 설정
```

### 2.3 첫 실행

Gemini CLI를 실행하면 bkit이 자동으로 초기화됩니다:

```
$ gemini

┌─── Control Panel ─────────────────────────────────┐
│  Automation Level   L0 ● L4                       │
│  [Current: L1 Semi-Auto]                          │
│  No pending approvals                             │
│  Emergency stop: Ctrl+C                           │
└───────────────────────────────────────────────────┘

┌─── Workflow Map ──────────────────────────────────┐
│  No active PDCA feature.                          │
│  Start with /pdca plan {feature-name}             │
└───────────────────────────────────────────────────┘
```

### 2.4 처음 사용자를 위한 선택지

첫 메시지를 보내면 bkit이 4가지 선택지를 제공합니다:

| 선택 | 설명 | 추천 대상 |
|------|------|----------|
| **bkit 배우기** | `/development-pipeline`로 9단계 개발 과정 학습 | bkit 처음 사용자 |
| **Gemini CLI 배우기** | `/claude-code-learning`으로 CLI 기능 학습 | Gemini CLI 처음 사용자 |
| **새 프로젝트 시작** | 레벨 선택 후 `/starter`, `/dynamic`, `/enterprise` | 새 프로젝트 |
| **자유롭게 시작** | 일반 대화 모드 | 경험 있는 사용자 |

---

## 3. 프로젝트 레벨 시스템

bkit은 프로젝트의 복잡도에 따라 3가지 레벨을 제공합니다. 레벨에 따라 PDCA 워크플로우의 깊이, 사용 가능한 에이전트, 출력 스타일이 달라집니다.

### 3.1 Starter (초보자 / 정적 웹사이트)

**대상:** 코딩 입문자, 포트폴리오, 랜딩 페이지, HTML/CSS/JS 정적 사이트

```
시작 명령: /starter
초기화:    /starter init (또는 init starter)
```

**특징:**
- PDCA 간소화: Plan → Design → Do → Report (4단계만)
- Check/Act 단계 스킵 (과도한 검증 불필요)
- 상세한 설명과 단계별 가이드 (`bkit-learning` 출력 스타일)
- `starter-guide` 에이전트가 친절하게 안내

**자동 감지 키워드:**
```
static site, portfolio, landing page, 정적 웹, 포트폴리오,
beginner, first website, 초보자, 첫 웹사이트
```

**예시:**
```
사용자: 포트폴리오 웹사이트 만들고 싶어요
bkit:   → 자동으로 Starter 레벨 감지
        → /starter 스킬 활성화
        → 단계별 가이드 시작
```

### 3.2 Dynamic (풀스택 / BaaS)

**대상:** 로그인/회원가입이 있는 웹앱, 데이터베이스 필요, SaaS MVP

```
시작 명령: /dynamic
초기화:    /dynamic init (또는 init dynamic)
```

**특징:**
- PDCA 6단계 중 5단계 사용 (Act은 선택)
- bkend.ai BaaS 플랫폼 통합 (인증, DB, 파일 저장)
- `bkit-pdca-guide` 출력 스타일
- `bkend-expert` 에이전트로 백엔드 자동 구성

**자동 감지 키워드:**
```
fullstack, login, signup, authentication, database,
풀스택, 로그인, 회원가입, 데이터베이스
```

**자동 감지 조건 (디렉토리/파일 기반):**
```
디렉토리: lib/bkend, supabase, api, backend, server, prisma
파일:     .mcp.json, docker-compose.yml, prisma/schema.prisma
패키지:   bkend, @supabase, firebase, prisma, express, nest
```

### 3.3 Enterprise (마이크로서비스 / 인프라)

**대상:** 대규모 시스템, Kubernetes, Terraform, 마이크로서비스, 모노레포

```
시작 명령: /enterprise
초기화:    /enterprise init (또는 init enterprise)
```

**특징:**
- PDCA 6단계 전체 + 9단계 파이프라인 전체 필수
- CTO 에이전트 팀 오케스트레이션
- `bkit-enterprise` 또는 `bkit-pdca-enterprise` 출력 스타일
- 보안 아키텍트, 인프라 아키텍트 등 전문 에이전트 투입

**자동 감지 키워드:**
```
microservices, kubernetes, terraform, k8s, AWS, monorepo,
마이크로서비스, 모노레포
```

**자동 감지 조건:**
```
디렉토리: kubernetes, terraform, k8s, infra, helm, charts
파일:     docker-compose.prod.yml, Makefile.prod
패키지:   @kubernetes, @terraform, @pulumi
```

### 3.4 레벨 비교표

| 항목 | Starter | Dynamic | Enterprise |
|------|---------|---------|-----------|
| PDCA 단계 | 4단계 | 5단계 | 6단계 전체 |
| Gap 분석 | 스킵 | 필수 | 필수 |
| 자동 개선 (Act) | 스킵 | 선택 | 필수 |
| 보안 검토 | 스킵 | 선택 | 필수 |
| 코드 리뷰 | 스킵 | 선택 | 필수 |
| 팀 오케스트레이션 | 없음 | 기본 | CTO 에이전트 팀 |
| 출력 스타일 | bkit-learning | bkit-pdca-guide | bkit-enterprise |
| 자동화 기본값 | manual | semi-auto | semi-auto |

### 3.5 수동 레벨 설정

자동 감지를 무시하고 레벨을 직접 지정할 수 있습니다:

```bash
# 환경 변수로 설정
export BKIT_PROJECT_LEVEL=Enterprise

# 또는 gemini-extension.json의 settings에서 설정
```

---

## 4. PDCA 워크플로우

PDCA는 bkit의 핵심 워크플로우입니다. 모든 기능 개발은 이 사이클을 따릅니다.

### 4.1 PDCA 사이클 개요

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  1. Plan │ ──→ │ 2.Design │ ──→ │   3. Do  │
│  계획    │     │   설계   │     │   구현   │
└──────────┘     └──────────┘     └──────────┘
                                       │
                                       ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 6.Report │ ←── │  5. Act  │ ←── │ 4. Check │
│  보고서  │     │   개선   │     │   검증   │
└──────────┘     └──────────┘     └──────────┘
                      ↑               │
                      └───────────────┘
                      Gap < 90%이면 반복
                      (최대 5회)
```

### 4.2 Phase 1: Plan (계획)

**명령어:** `/pdca plan {기능명}`

**역할:** 기능의 목적, 범위, 목표를 정의하는 계획 문서를 생성합니다.

**생성 문서:** `docs/01-plan/features/{기능명}.plan.md`

**사용 예시:**
```
사용자: /pdca plan user-authentication
bkit:   → Plan 문서 생성
        → 문제 정의, 솔루션, 목표, 메트릭스 포함
        → 사용자 확인 후 다음 단계 안내
```

**Plan 문서에 포함되는 내용:**
- 문제 정의 (Problem Statement)
- 솔루션 개요 (Solution Overview)
- 목표 및 성공 기준 (Goals & Success Criteria)
- 범위 (In-Scope / Out-of-Scope)
- 기술 스택 선택
- 예상 위험 및 대응 방안

**고급 기능 - Plan Plus:**
```
/plan-plus {기능명}
```
일반 Plan보다 깊은 브레인스토밍을 수행합니다:
- 의도 탐색 (Intent Discovery)
- 대안 비교 (최소 3가지 접근법)
- YAGNI 리뷰 (과잉 설계 제거)

### 4.3 Phase 2: Design (설계)

**명령어:** `/pdca design {기능명}`

**역할:** 구체적인 기술 설계 사양을 작성합니다.

**생성 문서:** `docs/02-design/features/{기능명}.design.md`

**Design 문서에 포함되는 내용:**
- 아키텍처 다이어그램
- 데이터 모델 (테이블, 관계)
- API 엔드포인트 설계
- 컴포넌트 구조
- 상태 관리 설계
- 에러 처리 전략

**레벨별 Design 템플릿:**
- **Starter:** 간소화 버전 (페이지 구조, 스타일 가이드 중심)
- **Dynamic:** 표준 버전 (API, DB, 인증 포함)
- **Enterprise:** 상세 버전 (마이크로서비스, 인프라, 보안 포함)

### 4.4 Phase 3: Do (구현)

**명령어:** `/pdca do {기능명}`

**역할:** Design 문서를 기반으로 실제 코드를 구현합니다.

**특징:**
- Design 문서를 참조하며 구현 (Docs = Code 원칙)
- 구현 중 모든 도구 사용 가능 (write_file, replace, run_shell_command 등)
- 자동으로 진행 상황 추적

**사용 팁:**
```
사용자: /pdca do user-authentication
bkit:   → Design 문서 로드
        → 구현 순서 제안
        → 파일 생성/수정 시작
        → 구현 완료 후 Check 단계 안내
```

### 4.5 Phase 4: Check (검증)

**명령어:** `/pdca analyze {기능명}`

**역할:** Design 문서와 실제 구현 코드 사이의 일치도를 분석합니다.

**생성 문서:** `docs/03-analysis/{기능명}.analysis.md`

**핵심 메트릭: Match Rate (일치율)**

```
Match Rate = (구현된 항목 / 설계된 항목) x 100%

≥ 90%  →  합격! Report 단계로 진행
< 90%  →  Act 단계에서 자동 개선
```

**분석 결과 예시:**
```
┌─ Gap Analysis ────────────────────────┐
│  Match Rate: 87%                      │
│  Total Items: 23                      │
│  Matched: 20                          │
│  Gaps: 3                              │
│                                       │
│  Gap #1: API 에러 핸들링 누락         │
│  Gap #2: 입력 유효성 검사 미구현      │
│  Gap #3: 로딩 상태 UI 누락            │
└───────────────────────────────────────┘
```

**자동 트리거:**
"검증해줘", "verify", "확인해", "맞아?" 등의 키워드를 입력하면 gap-detector 에이전트가 자동으로 실행됩니다.

### 4.6 Phase 5: Act (개선)

**명령어:** `/pdca iterate {기능명}`

**역할:** Check 단계에서 발견된 Gap을 자동으로 수정합니다.

**동작 방식:**
1. Gap 목록 로드
2. 각 Gap에 대해 코드 수정
3. 수정 후 다시 Gap 분석 (Check)
4. Match Rate ≥ 90% 될 때까지 반복
5. **최대 5회** 반복 제한

```
[반복 1] Gap 3건 발견 → 수정 → Match Rate 87% → 92%
[반복 2] Gap 1건 발견 → 수정 → Match Rate 92% → 95%
→ 완료! Report 단계로 진행
```

**자동 트리거:**
"개선해줘", "improve", "고쳐줘", "fix this" 등의 키워드로 자동 실행됩니다.

### 4.7 Phase 6: Report (보고서)

**명령어:** `/pdca report {기능명}`

**역할:** PDCA 사이클 전체를 요약하는 완성 보고서를 생성합니다.

**생성 문서:** `docs/04-report/features/{기능명}.report.md`

**보고서에 포함되는 내용:**
- Executive Summary (요약)
- Value Delivered (4가지 관점)
- 변경된 파일 목록
- 최종 Match Rate
- 반복 횟수 및 개선 이력
- 학습 포인트

### 4.8 추가 PDCA 명령어

| 명령어 | 기능 |
|--------|------|
| `/pdca status` | 현재 PDCA 상태 확인 (활성 기능, 현재 페이즈, Match Rate) |
| `/pdca next` | 다음 단계 자동 안내 |
| `/pdca archive {기능명}` | 완료된 PDCA 문서 보관 |

### 4.9 PDCA 상태 관리

모든 PDCA 상태는 `.bkit/state/pdca-status.json`에 저장됩니다:

```json
{
  "primaryFeature": "user-authentication",
  "features": {
    "user-authentication": {
      "phase": "check",
      "matchRate": 87,
      "iterations": 1,
      "documents": {
        "plan": "docs/01-plan/features/user-authentication.plan.md",
        "design": "docs/02-design/features/user-authentication.design.md"
      }
    }
  }
}
```

### 4.10 병렬 PDCA (Batch)

여러 기능을 동시에 관리할 수 있습니다 (최대 3개 동시 진행):

```
/pdca batch               → 모든 활성 기능 상태 확인
/pdca plan feature-a      → 첫 번째 기능 시작
/pdca plan feature-b      → 두 번째 기능 동시 진행
```

---

## 5. 스킬 시스템

스킬은 특정 도메인의 전문 지식을 제공하는 지식 모듈입니다. 슬래시 명령어(`/스킬명`)로 호출하거나, 키워드를 통해 자동으로 활성화됩니다.

### 5.1 스킬 분류

bkit v2.0.0은 **35개 스킬**을 제공하며, 3가지로 분류됩니다:

| 분류 | 설명 | 개수 |
|------|------|------|
| **Workflow (W)** | PDCA 워크플로우를 관리하는 스킬 | 9개 |
| **Capability (C)** | 특정 기술 도메인의 지식을 제공하는 스킬 | 18개 |
| **Hybrid (H)** | 워크플로우 + 지식을 모두 포함하는 스킬 | 8개 |

### 5.2 PDCA 관련 스킬

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| pdca | `/pdca {서브커맨드}` | 통합 PDCA 관리 (plan/design/do/analyze/iterate/report/status/next) |
| pdca-batch | `/pdca batch` | 다중 기능 병렬 PDCA |
| plan-plus | `/plan-plus {기능명}` | 브레인스토밍 강화 플래닝 |
| bkit-templates | `/bkit-templates` | PDCA 문서 템플릿 제공 |
| bkit-rules | `/bkit-rules` | 핵심 규칙 표시 |

### 5.3 프로젝트 레벨 스킬

| 스킬 | 명령어 | 대상 레벨 | 설명 |
|------|--------|----------|------|
| starter | `/starter` | Starter | 정적 웹사이트 가이드 |
| dynamic | `/dynamic` | Dynamic | 풀스택 + BaaS 가이드 |
| enterprise | `/enterprise` | Enterprise | 마이크로서비스 가이드 |

### 5.4 개발 파이프라인 스킬

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| development-pipeline | `/development-pipeline` | 9단계 파이프라인 전체 가이드 |
| phase-1-schema | `/phase-1-schema` | 용어 및 데이터 구조 정의 |
| phase-2-convention | `/phase-2-convention` | 코딩 규칙 및 컨벤션 |
| phase-3-mockup | `/phase-3-mockup` | UI/UX 목업 프로토타입 |
| phase-4-api | `/phase-4-api` | API 설계 및 구현 |
| phase-5-design-system | `/phase-5-design-system` | 디자인 시스템 구축 |
| phase-6-ui-integration | `/phase-6-ui-integration` | UI-API 통합 구현 |
| phase-7-seo-security | `/phase-7-seo-security` | SEO 및 보안 강화 |
| phase-8-review | `/phase-8-review` | 코드 리뷰 및 Gap 분석 |
| phase-9-deployment | `/phase-9-deployment` | 배포 전략 및 CI/CD |

### 5.5 도구 스킬

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| code-review | `/code-review` | 코드 품질 분석, 버그 검출, 보안 검사 |
| zero-script-qa | `/zero-script-qa` | 테스트 스크립트 없이 Docker 로그 기반 QA |
| simplify | `/simplify` | 코드 리팩토링 및 품질 개선 |
| gemini-migration | `/gemini-migration {버전}` | Gemini CLI 버전 마이그레이션 |

### 5.6 플랫폼 스킬

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| mobile-app | `/mobile-app` | React Native / Flutter / Expo 가이드 |
| desktop-app | `/desktop-app` | Electron / Tauri 가이드 |

### 5.7 bkend.ai BaaS 스킬

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| bkend-quickstart | `/bkend-quickstart` | bkend.ai 시작 가이드, MCP 연결 |
| bkend-auth | `/bkend-auth` | 인증 (회원가입, 로그인, JWT, RBAC) |
| bkend-data | `/bkend-data` | 데이터베이스 CRUD, 스키마, 인덱스 |
| bkend-storage | `/bkend-storage` | 파일 업로드/다운로드, Presigned URL |
| bkend-cookbook | `/bkend-cookbook` | 실전 프로젝트 튜토리얼 (10개 예제) |

### 5.8 기타 스킬

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| claude-code-learning | `/claude-code-learning` | Gemini CLI 사용법 학습 |
| output-style-setup | `/output-style-setup` | 출력 스타일 설치 |
| skill-create | `/skill-create` | 커스텀 스킬 생성 |
| skill-status | `/skill-status` | 로드된 스킬 목록 확인 |
| btw | `/btw` | 작업 중 개선 아이디어 기록 |
| control | `/control` | 자동화 레벨 및 시스템 상태 제어 |
| audit | `/audit` | 감사 로그 조회 |
| rollback | `/rollback` | 체크포인트 관리 및 롤백 |
| pm-discovery | `/pdca pm {기능명}` | PM 에이전트 팀 분석 |
| bkit | `/bkit` | bkit 전체 기능 도움말 |

### 5.9 스킬 자동 트리거

스킬은 키워드를 통해 자동으로 활성화됩니다 (8개 언어 지원):

```
사용자: 로그인 기능 만들어줘
bkit:   → "로그인" 키워드 감지
        → /dynamic 스킬 자동 트리거
        → 풀스택 개발 가이드 시작

사용자: I need a portfolio website
bkit:   → "portfolio website" 감지
        → /starter 스킬 자동 트리거
```

---

## 6. 에이전트 시스템

에이전트는 특정 역할을 수행하는 자율 AI 전문가입니다. 필요에 따라 자동으로 호출되거나, 명시적으로 요청할 수 있습니다.

### 6.1 PDCA 핵심 에이전트

| 에이전트 | 역할 | 모델 | 자동 트리거 |
|---------|------|------|-----------|
| **cto-lead** | CTO급 팀 오케스트레이션, PDCA 전체 관리 | gemini-3.1-pro | "팀 구성", "프로젝트 리드" |
| **gap-detector** | 설계-구현 Gap 분석 (Check 단계) | gemini-3.1-pro | "검증", "verify", "확인" |
| **pdca-iterator** | 자동 반복 개선 (Act 단계, 최대 5회) | gemini-3-pro | "개선", "improve", "고쳐" |
| **report-generator** | PDCA 완성 보고서 생성 | gemini-3-flash | "보고서", "report", "요약" |
| **design-validator** | 설계 문서 완전성/일관성 검증 | gemini-3.1-pro | "설계 검증", "스펙 확인" |

### 6.2 코드 품질 에이전트

| 에이전트 | 역할 | 자동 트리거 |
|---------|------|-----------|
| **code-analyzer** | 코드 품질, 보안, 성능 분석 | "분석", "analyze", "이상해" |
| **qa-strategist** | QA 전략 수립, 테스트 계획 | "테스트 전략", "QA 계획" |
| **qa-monitor** | Docker 로그 실시간 모니터링 | "로그 분석", "docker logs" |

### 6.3 아키텍처 에이전트

| 에이전트 | 역할 | 자동 트리거 |
|---------|------|-----------|
| **frontend-architect** | UI/UX, React, Next.js, 디자인 시스템 | "프론트엔드", "컴포넌트", "UI" |
| **security-architect** | 보안 취약점, OWASP, 인증 설계 | "보안", "CSRF", "XSS" |
| **infra-architect** | AWS, Kubernetes, Terraform, CI/CD | "인프라", "K8s", "AWS" |
| **enterprise-expert** | 엔터프라이즈 아키텍처, AI 네이티브 | "마이크로서비스", "CTO" |

### 6.4 PM 에이전트 팀 (5개)

| 에이전트 | 역할 | Phase |
|---------|------|-------|
| **pm-lead** | PM 팀 조율, 4단계 오케스트레이션 | 전체 |
| **pm-discovery** | Opportunity Solution Tree 분석 | Phase 1 |
| **pm-strategy** | JTBD + Lean Canvas | Phase 2 |
| **pm-research** | 페르소나, 경쟁사, 시장 조사 | Phase 3 |
| **pm-prd** | PRD 8섹션 + GTM 전략 | Phase 4 |

**사용법:**
```
/pdca pm {기능명}
→ 5개 PM 에이전트가 병렬로 분석
→ 종합 PRD (Product Requirements Document) 생성
→ PDCA Plan 단계 이전에 사용 추천
```

### 6.5 특화 에이전트

| 에이전트 | 역할 | 자동 트리거 |
|---------|------|-----------|
| **bkend-expert** | bkend.ai BaaS 전문가 | "bkend", "BaaS", "백엔드 서비스" |
| **starter-guide** | 초보자 친화적 안내 | "도움", "help", "모르겠어" |
| **pipeline-guide** | 9단계 파이프라인 안내 | "뭐부터", "어디서부터" |
| **product-manager** | 요구사항 분석, 우선순위 | "요구사항", "기능 정의" |

### 6.6 에이전트 자동 트리거 (8개 언어)

에이전트는 키워드를 통해 자동으로 호출됩니다:

| 키워드 (한국어) | 키워드 (영어) | 에이전트 |
|---------------|-------------|---------|
| 검증, 확인, 맞아? | verify, check, is this right? | gap-detector |
| 개선, 고쳐, 더 좋게 | improve, fix, make it better | pdca-iterator |
| 분석, 이상해, 품질 | analyze, something wrong | code-analyzer |
| 보고서, 요약 | report, summary | report-generator |
| 도움, 어려워, 모르겠어 | help, confused | starter-guide |
| 뭐부터, 어디서부터 | where to start | pipeline-guide |

---

## 7. 9단계 개발 파이프라인

bkit은 프로젝트를 9단계로 나누어 체계적으로 개발할 수 있도록 안내합니다.

### 7.1 파이프라인 개요

```
Phase 1: Schema         → 용어, 데이터 구조 정의
Phase 2: Convention      → 코딩 규칙, 컨벤션 설정
Phase 3: Mockup          → UI/UX 프로토타입
Phase 4: API             → 백엔드 API 설계/구현
Phase 5: Design System   → 디자인 시스템 구축
Phase 6: UI Integration  → 프론트엔드-백엔드 통합
Phase 7: SEO & Security  → 검색 최적화, 보안 강화
Phase 8: Review          → 코드 리뷰, Gap 분석
Phase 9: Deployment      → 배포, CI/CD 설정
```

### 7.2 레벨별 필수 단계

| Phase | Starter | Dynamic | Enterprise |
|-------|---------|---------|-----------|
| 1. Schema | 필수 | 필수 | 필수 |
| 2. Convention | 필수 | 필수 | 필수 |
| 3. Mockup | 필수 | 필수 | 필수 |
| 4. API | - | 필수 | 필수 |
| 5. Design System | - | 선택 | 필수 |
| 6. UI Integration | 필수 | 필수 | 필수 |
| 7. SEO & Security | - | 선택 | 필수 |
| 8. Review | - | 선택 | 필수 |
| 9. Deployment | 필수 | 필수 | 필수 |

### 7.3 파이프라인 사용법

```
# 전체 파이프라인 시작
/development-pipeline start

# 현재 진행 상황 확인
/development-pipeline status

# 다음 단계로 이동
/development-pipeline next

# 특정 단계 직접 실행
/phase-1-schema
/phase-4-api
/phase-9-deployment
```

---

## 8. 자동화 레벨

bkit은 AI의 자율성 수준을 조절할 수 있는 자동화 레벨을 제공합니다.

### 8.1 레벨 정의

| 레벨 | 이름 | 설명 | 동작 |
|------|------|------|------|
| **L0** | Manual | 모든 작업에 사용자 승인 필요 | 매번 확인 질문 |
| **L1** | Semi-Auto | PDCA 전환은 자동, 구현은 승인 필요 | Plan→Design 자동 |
| **L2** | Auto | 읽기 작업 자동, 쓰기 작업은 승인 | 분석 자동, 수정 확인 |
| **L3** | Full-Auto | 대부분 자동, 위험 작업만 승인 | 위험 명령만 차단 |
| **L4** | Autonomous | 완전 자율 (위험 명령 제외) | 최소 개입 |

### 8.2 레벨 변경 방법

```
# /control 스킬로 변경
/control level L2

# 환경 변수로 설정
export BKIT_PDCA_AUTOMATION=full-auto
```

### 8.3 레벨별 기본값

| 프로젝트 레벨 | 기본 자동화 |
|-------------|-----------|
| Starter | L0 (Manual) |
| Dynamic | L1 (Semi-Auto) |
| Enterprise | L1 (Semi-Auto) |

### 8.4 비상 정지

```
# 즉시 정지
Ctrl+C

# 또는 명령어로
/control stop
```

---

## 9. Hook 시스템

Hook은 Gemini CLI의 라이프사이클 이벤트에 연결되어 bkit의 동작을 제어합니다.

### 9.1 10개 Hook 이벤트

| Hook | 시점 | 역할 |
|------|------|------|
| **SessionStart** | 세션 시작 시 | 프로젝트 레벨 감지, 정책 생성, 출력 스타일 로드 |
| **BeforeAgent** | 에이전트 호출 전 | 8언어 의도 감지, 에이전트/스킬 자동 트리거 |
| **BeforeModel** | 모델 호출 전 | PDCA 페이즈별 프롬프트 증강 |
| **AfterModel** | 모델 응답 후 | 응답 추적, 메트릭 수집 |
| **BeforeToolSelection** | 도구 선택 전 | 페이즈별 도구 필터링 (Plan: 읽기 전용) |
| **BeforeTool** | 도구 실행 전 | 권한 관리, 위험 명령 차단 |
| **AfterTool** | 도구 실행 후 | PDCA 페이즈 자동 전환 감지 |
| **AfterAgent** | 에이전트 완료 후 | 정리, 페이즈 완료 감지 |
| **PreCompress** | 컨텍스트 압축 전 | 컨텍스트 포크 스냅샷 저장 |
| **SessionEnd** | 세션 종료 시 | 세션 정리, 메모리 저장 |

### 9.2 페이즈별 도구 필터링

Hook을 통해 PDCA 페이즈에 따라 사용 가능한 도구가 자동으로 제한됩니다:

**Plan / Check 페이즈 (읽기 전용):**
```
허용: read_file, grep_search, glob, list_directory, web_search
차단: write_file, replace, run_shell_command
```

**Do / Act 페이즈 (전체 사용 가능):**
```
허용: 모든 도구
차단: 위험 명령만 (rm -rf, git reset --hard 등)
```

---

## 10. 정책 엔진

bkit은 Gemini CLI v0.30.0+의 TOML 정책 엔진을 활용하여 도구 사용 권한을 세밀하게 관리합니다.

### 10.1 정책 파일 위치

```
.gemini/policies/
├── bkit-permissions.toml          # 기본 권한 정책
├── bkit-starter-policy.toml       # Starter 레벨 정책
├── bkit-dynamic-policy.toml       # Dynamic 레벨 정책
└── bkit-enterprise-policy.toml    # Enterprise 레벨 정책
```

### 10.2 정책 구조 (TOML 형식)

```toml
# 기본 거부 규칙
[deny]
rules = [
  "run_shell_command: rm -rf",
  "run_shell_command: git reset --hard",
  "run_shell_command: git push --force",
]

# 읽기 전용 도구 (Plan/Check 페이즈)
[readonly]
rules = [
  "read_file",
  "grep_search",
  "glob",
  "list_directory",
]
```

### 10.3 서브에이전트 정책 (v0.34.0+)

에이전트별로 별도의 정책을 적용할 수 있습니다:

```toml
# gap-detector는 읽기 전용
[deny]
subagent = "gap-detector"
rules = ["write_file", "replace", "run_shell_command"]

# starter-guide는 코드 수정 불가
[deny]
subagent = "starter-guide"
rules = ["write_file", "replace"]
```

### 10.4 정책 자동 생성

`session-start.js` Hook이 프로젝트 레벨에 따라 정책 파일을 자동으로 생성합니다. 수동 수정도 가능하며, 수동 수정한 정책은 자동 생성으로 덮어쓰지 않습니다.

---

## 11. 컨텍스트 엔지니어링

bkit의 핵심 기술인 컨텍스트 엔지니어링은 AI에게 제공하는 정보를 최적화합니다.

### 11.1 GEMINI.md와 @import 모듈

`GEMINI.md`는 bkit의 전역 컨텍스트 파일입니다. 7개의 모듈을 `@import`로 로드합니다:

| 모듈 | 파일 | 내용 |
|------|------|------|
| pdca-rules.md | PDCA 워크플로우 규칙 | 페이즈 전환 조건, 자동화 규칙 |
| commands.md | 명령어 레퍼런스 | 사용 가능한 슬래시 명령어 |
| core-rules.md | 핵심 규칙 | 코드 품질, 보안, 파일 관리 |
| agent-triggers.md | 에이전트 트리거 | 21개 에이전트 자동 호출 조건 |
| skill-triggers.md | 스킬 트리거 | 35개 스킬 자동 활성화 조건 |
| tool-reference-v2.md | 도구 레퍼런스 | 23개 빌트인 도구 사양 |
| feature-report.md | Feature Usage 리포트 | 응답 끝 리포트 형식 |

### 11.2 페이즈별 컨텍스트 로딩 (71% 토큰 절감)

모든 모듈을 항상 로드하지 않고, 현재 PDCA 페이즈에 필요한 모듈만 선택적으로 로드합니다:

```
Plan 페이즈:   core-rules + pdca-rules + agent-triggers    (3개)
Design 페이즈: core-rules + pdca-rules + agent-triggers    (3개)
Do 페이즈:     core-rules + tool-reference-v2              (2개)
Check 페이즈:  core-rules + pdca-rules                     (2개)

→ 전체 로드 대비 71% 토큰 절감
```

### 11.3 컨텍스트 포크 (PreCompress Hook)

컨텍스트 압축 전에 현재 상태를 스냅샷으로 저장합니다:

```
.bkit/snapshots/
├── context-fork-2026-03-21T10-00-00.json
├── context-fork-2026-03-21T11-30-00.json
└── ...
```

장시간 세션에서 이전 컨텍스트를 잃지 않도록 보호합니다.

### 11.4 컨텍스트 계층 구조

```
Plugin Level    → bkit 기본 설정
    ↓
User Level      → ~/.gemini/ 사용자 설정
    ↓
Project Level   → .gemini/ 프로젝트 설정
    ↓
Session Level   → 현재 세션 상태

→ 깊은 병합 (Deep Merge): 하위 레벨이 상위를 오버라이드
```

---

## 12. 팀 오케스트레이션

Enterprise 레벨에서는 여러 에이전트가 팀으로 협업합니다. cto-lead 에이전트가 팀을 조율합니다.

### 12.1 5가지 오케스트레이션 패턴

| 패턴 | 사용 시기 | 동작 방식 |
|------|----------|----------|
| **Leader** | Plan, Design 페이즈 | 단일 리더(CTO)가 작업을 위임하고 결과를 수집 |
| **Council** | 아키텍처 결정 | 다수 에이전트가 독립 분석 후 합의 도출 |
| **Swarm** | 대규모 코드 리뷰 | 병렬 실행, 최소 조율 |
| **Pipeline** | PDCA 자동 진행 | 순차 단계별 처리 (Plan→Design→Do→...) |
| **Watchdog** | QA/보안 검증 | 모니터링 에이전트가 연속 감시 |

### 12.2 팀 구성 예시

```
사용자: /pdca team user-authentication

CTO Lead (cto-lead):
├── Plan 팀 (Leader 패턴)
│   ├── product-manager    → 요구사항 분석
│   └── security-architect → 보안 요구사항
│
├── Design 팀 (Council 패턴)
│   ├── frontend-architect → UI 설계
│   ├── bkend-expert       → API 설계
│   └── security-architect → 인증 설계
│
├── Check 팀 (Watchdog 패턴)
│   ├── gap-detector       → Gap 분석
│   ├── code-analyzer      → 코드 품질
│   └── qa-monitor         → 로그 모니터링
│
└── Report (Pipeline 패턴)
    └── report-generator   → 최종 보고서
```

---

## 13. 메모리 시스템

bkit은 3단계 메모리로 대화 간 정보를 유지합니다.

### 13.1 메모리 범위

| 범위 | 저장 위치 | 지속성 | 용도 |
|------|----------|--------|------|
| **Session** | 메모리 (휘발) | 현재 세션만 | 임시 상태, 중간 결과 |
| **Project** | `.bkit/state/` | 프로젝트 영구 | PDCA 상태, 의사결정 기록 |
| **User** | `~/.bkit/` | 전체 프로젝트 공유 | 사용자 선호도, 학습 이력 |

### 13.2 에이전트별 메모리 범위

대부분의 에이전트는 Project 범위를 사용하지만, 일부는 User 범위를 사용합니다:

```
User 범위 (프로젝트 간 공유):
  - starter-guide    → 사용자 학습 이력 공유
  - pipeline-guide   → 개발 패턴 선호도 공유

Project 범위 (프로젝트 내):
  - 나머지 19개 에이전트
```

### 13.3 메모리 활용

```
사용자: 이전에 어떤 결정을 내렸었지?
bkit:   → .bkit/decisions/ 조회
        → 과거 의사결정 이력 표시

사용자: 지난 세션에서 뭐 했어?
bkit:   → .bkit/state/session-metadata.json 조회
        → 이전 세션 활동 요약
```

---

## 14. 출력 스타일

bkit은 4가지 출력 스타일을 제공하여 사용자 경험을 최적화합니다.

### 14.1 스타일 목록

| 스타일 | 대상 레벨 | 특징 |
|--------|----------|------|
| **bkit-learning** | Starter (기본) | 초보자 친화적, 모든 단계 상세 설명, "왜?" 섹션, 코드 코멘트, 팁/노트 |
| **bkit-pdca-guide** | Dynamic (기본) | PDCA 중심, `[Phase: Plan]` 표시, 현재→액션→결과→다음, 체크리스트 |
| **bkit-enterprise** | Enterprise (기본) | 효율성 우선, 최소 설명, 명령어 제안, 기술 용어 사용 |
| **bkit-pdca-enterprise** | Enterprise (옵션) | PDCA + Enterprise 결합, 페이즈 표시 + 효율적 응답 |

### 14.2 스타일 변경

```
# 1. /output-style-setup으로 설치
/output-style-setup

# 2. 환경 변수로 변경
export BKIT_OUTPUT_STYLE=bkit-pdca-guide
```

### 14.3 스타일 비교 예시

동일한 질문 "파일 구조를 만들어줘"에 대한 응답 차이:

**bkit-learning (Starter):**
```
## 파일 구조 만들기

### 왜 파일 구조가 중요한가요?
잘 정리된 파일 구조는 코드를 찾기 쉽게 만들어줍니다.
마치 서랍에 물건을 정리하는 것과 같아요.

### 단계 1: 폴더 만들기
먼저 src 폴더를 만들겠습니다...

💡 팁: src는 "source"의 줄임말로, 소스 코드를 넣는 곳입니다.
```

**bkit-enterprise (Enterprise):**
```
src/
├── components/
├── pages/
├── hooks/
├── utils/
└── types/

구조 생성 완료. `/phase-2-convention`으로 코딩 규칙 설정 추천.
```

---

## 15. MCP 서버

bkit은 MCP(Model Context Protocol) 서버를 통해 에이전트 스포닝과 팀 관리 기능을 제공합니다.

### 15.1 spawn-agent-server

**파일:** `mcp/spawn-agent-server.js`

**제공 도구:**

| 도구 | 설명 |
|------|------|
| `spawn-agent` | 새 에이전트 프로세스 생성 |
| `list-agents` | 실행 중인 에이전트 목록 |
| `get-agent-info` | 에이전트 상세 정보 조회 |
| `team_create` | 에이전트 팀 생성 |
| `team_assign` | 팀에 에이전트 할당 |
| `team_status` | 팀 상태 조회 |

### 15.2 에이전트 스포닝 동작

```
CTO Lead가 "보안 검토 필요"라고 판단
    ↓
spawn-agent 호출: security-architect 스포닝
    ↓
독립 프로세스에서 보안 분석 수행
    ↓
결과를 CTO Lead에게 반환
    ↓
CTO Lead가 결과 종합
```

---

## 16. 보안 시스템

bkit v2.0.0은 8개의 보안 이슈를 해결하고 다층 방어 체계를 구축했습니다.

### 16.1 위험 명령 차단

다음 패턴은 자동으로 차단됩니다 (exit code 2):

```
rm -rf                    # 재귀 삭제
git reset --hard          # 하드 리셋
git push --force          # 강제 푸시
> /dev/null               # 출력 리다이렉트
역셸 패턴                  # 원격 코드 실행 시도
```

### 16.2 에이전트 권한 분류

| 등급 | 에이전트 | 허용 도구 |
|------|---------|----------|
| **READONLY** | gap-detector, design-validator | 읽기 전용 도구만 |
| **DOCWRITE** | report-generator, pm-prd | 읽기 + docs/ 디렉토리만 쓰기 |
| **FULL** | cto-lead, pdca-iterator | 모든 도구 (위험 명령 제외) |

### 16.3 Plan Mode 제한

Starter 레벨에서 Plan Mode가 활성화되면 코드 쓰기가 자동으로 차단됩니다. 초보자가 실수로 중요 파일을 수정하는 것을 방지합니다.

### 16.4 보안 감사 로그

모든 보안 관련 이벤트는 `.gemini/security-audit.log`에 기록됩니다:
```
[2026-03-21T10:00:00] BLOCKED: run_shell_command "rm -rf /"
[2026-03-21T10:01:00] ALLOWED: read_file "src/index.js"
```

---

## 17. 체크포인트 & 롤백

PDCA 페이즈 전환 시 자동으로 체크포인트가 생성되며, 문제 발생 시 이전 상태로 롤백할 수 있습니다.

### 17.1 체크포인트 자동 생성

```
Plan 완료 → 체크포인트 #1 저장
Design 완료 → 체크포인트 #2 저장
Do 완료 → 체크포인트 #3 저장
Check 실패 → 체크포인트 #3로 롤백 가능
```

### 17.2 롤백 명령어

```
# 체크포인트 목록 확인
/rollback list

# 특정 체크포인트로 롤백
/rollback restore {checkpoint-id}

# 초기 상태로 리셋
/rollback reset {기능명}
```

### 17.3 저장 위치

```
.bkit/checkpoints/
├── cp-user-auth-plan-2026-03-21.json
├── cp-user-auth-design-2026-03-21.json
└── cp-user-auth-do-2026-03-21.json
```

---

## 18. 감사 로그

bkit의 모든 AI 의사결정과 작업은 감사 로그에 기록됩니다.

### 18.1 감사 로그 조회

```
# 최근 감사 로그 조회
/audit

# 특정 기능의 감사 로그
/audit {기능명}

# 의사결정 이력 조회
/audit decisions
```

### 18.2 기록 내용

| 항목 | 설명 |
|------|------|
| **의사결정** | AI가 내린 결정과 근거 |
| **도구 사용** | 호출된 도구, 매개변수, 결과 |
| **페이즈 전환** | PDCA 페이즈 변경 이력 |
| **에이전트 활동** | 에이전트 호출/완료/결과 |
| **보안 이벤트** | 차단된 명령, 권한 변경 |

### 18.3 저장 위치

```
.bkit/audit/
├── session-2026-03-21.log
├── decisions/
│   └── decision-2026-03-21-001.json
└── security/
    └── security-2026-03-21.log
```

---

## 19. BTW (개선 제안) 시스템

작업 중 떠오른 개선 아이디어를 즉시 기록하고 관리할 수 있습니다.

### 19.1 사용법

```
# 아이디어 즉시 기록
/btw 이 API 응답 시간이 느린데 캐싱 추가하면 좋겠다

# 기록된 아이디어 목록
/btw list

# 아이디어 분석 (실행 가능성 평가)
/btw analyze

# 아이디어를 PDCA 기능으로 승격
/btw promote {id}

# 통계 조회
/btw stats
```

### 19.2 장점

- 작업 흐름을 중단하지 않고 아이디어 기록
- 나중에 모아서 검토 가능
- 우선순위 자동 분류
- PDCA 기능으로 바로 승격 가능

---

## 20. PM 에이전트 팀

PDCA Plan 단계 이전에 제품 분석을 수행하는 5개 PM 에이전트 팀입니다.

### 20.1 시작 방법

```
/pdca pm {기능명}
```

### 20.2 4단계 분석 프로세스

```
Phase 1: Discovery (pm-discovery)
    → Opportunity Solution Tree 분석
    → 고객 니즈 & 페인포인트 발굴

Phase 2: Strategy (pm-strategy)
    → JTBD (Jobs To Be Done) 6-Part 분석
    → Lean Canvas 비즈니스 모델

Phase 3: Research (pm-research)
    → 사용자 페르소나 정의
    → 경쟁사 분석
    → 시장 규모 (TAM/SAM/SOM)

Phase 4: PRD (pm-prd)
    → 종합 PRD 8섹션 작성
    → Beachhead Segment 정의
    → GTM 전략 수립
```

### 20.3 결과물

5개 에이전트가 병렬로 분석하여 **종합 PRD(Product Requirements Document)**를 생성합니다. 이 PRD를 기반으로 PDCA Plan 단계를 시작하면 더 정확한 계획이 수립됩니다.

---

## 21. bkend.ai BaaS 통합

bkit은 bkend.ai BaaS(Backend as a Service) 플랫폼과 긴밀하게 통합됩니다.

### 21.1 개요

bkend.ai는 서버 관리 없이 백엔드 기능을 제공하는 플랫폼입니다:

| 기능 | 설명 |
|------|------|
| **인증** | 이메일, 소셜 로그인 (Google, GitHub), 매직 링크 |
| **데이터베이스** | 테이블 CRUD, 7가지 컬럼 타입, 인덱스, 관계 |
| **파일 저장소** | 업로드/다운로드, Presigned URL, CDN |
| **권한 관리** | RBAC (admin/user/self/guest), RLS 정책 |

### 21.2 MCP 연동

bkend.ai는 MCP 서버를 통해 Gemini CLI에서 직접 사용할 수 있습니다:

```
# MCP 도구로 테이블 생성
backend_table_create: users 테이블, email/password/name 컬럼

# 스키마 조회
backend_table_list: 모든 테이블 목록

# 인덱스 관리
backend_index_manage: email 필드에 유니크 인덱스
```

### 21.3 관련 스킬

```
/bkend-quickstart    → 처음 시작, MCP 연결
/bkend-auth          → 인증 구현
/bkend-data          → 데이터베이스 CRUD
/bkend-storage       → 파일 업로드/다운로드
/bkend-cookbook       → 실전 튜토리얼 (10개 프로젝트)
```

### 21.4 쿡북 프로젝트 목록

| 프로젝트 | 난이도 | 주요 학습 |
|---------|--------|----------|
| Todo App | 초급 | 기본 CRUD |
| Blog | 중급 | 인증 + CRUD + 파일 |
| Recipe App | 중급 | 관계형 데이터 |
| Shopping Mall | 고급 | 결제, 장바구니, 재고 |
| Social Network | 고급 | 팔로우, 피드, 알림 |

---

## 22. 템플릿 시스템

### 22.1 PDCA 문서 템플릿

| 템플릿 | 용도 | 레벨 변형 |
|--------|------|----------|
| plan.template.md | Plan 문서 | 공통 |
| design.template.md | Design 문서 | Starter / 공통 / Enterprise |
| analysis.template.md | Gap 분석 문서 | 공통 |
| report.template.md | 완성 보고서 | 공통 |
| do.template.md | Do 가이드 | 공통 |
| iteration-report.template.md | 반복 리포트 | 공통 |

### 22.2 파이프라인 템플릿

9단계 개발 파이프라인 각 단계별 템플릿이 제공됩니다:
```
templates/pipeline/
├── phase-1-schema.template.md
├── phase-2-convention.template.md
├── ...
└── phase-9-deployment.template.md
```

### 22.3 기타 템플릿

| 템플릿 | 용도 |
|--------|------|
| schema.template.md | 데이터 스키마 정의 |
| convention.template.md | 코딩 컨벤션 문서 |
| GEMINI.template.md | 새 프로젝트 컨텍스트 |

---

## 23. 도구 레퍼런스

Gemini CLI에서 bkit이 사용하는 23개 빌트인 도구입니다.

### 23.1 파일 관리 (7개)

| 도구 | 설명 | 주요 매개변수 |
|------|------|-------------|
| `read_file` | 파일 읽기 | file_path, start_line, end_line (1-based) |
| `read_many_files` | 여러 파일 동시 읽기 | file_paths (배열) |
| `write_file` | 파일 생성/덮어쓰기 | file_path, content |
| `replace` | 파일 내용 부분 수정 | file_path, old_text, new_text, allow_multiple |
| `glob` | 파일 패턴 검색 | pattern (예: `**/*.js`) |
| `grep_search` | 파일 내용 검색 | pattern, include_pattern |
| `list_directory` | 디렉토리 나열 | directory_path |

### 23.2 실행 (1개)

| 도구 | 설명 | 주요 매개변수 |
|------|------|-------------|
| `run_shell_command` | 셸 명령 실행 | command, working_directory |

### 23.3 정보 검색 (2개)

| 도구 | 설명 | 주요 매개변수 |
|------|------|-------------|
| `google_web_search` | 웹 검색 | query |
| `web_fetch` | URL 내용 가져오기 | url |

### 23.4 에이전트 조율 (5개)

| 도구 | 설명 |
|------|------|
| `ask_user` | 사용자에게 질문 |
| `activate_skill` | 스킬 활성화 |
| `save_memory` | 메모리 저장 |
| `write_todos` | TODO 목록 관리 |
| `get_internal_docs` | 확장 문서 조회 |

### 23.5 계획 모드 (2개)

| 도구 | 설명 |
|------|------|
| `enter_plan_mode` | Plan Mode 진입 (읽기 전용) |
| `exit_plan_mode` | Plan Mode 종료 |

### 23.6 Task Tracker (6개, v0.32.0+)

| 도구 | 설명 |
|------|------|
| `tracker_create_task` | 작업 생성 |
| `tracker_update_task` | 작업 상태 수정 |
| `tracker_get_task` | 작업 조회 |
| `tracker_list_tasks` | 작업 목록 |
| `tracker_add_dependency` | 의존성 추가 |
| `tracker_visualize` | 작업 그래프 시각화 |

---

## 24. 명령어 전체 목록

### 24.1 PDCA 명령어

| 명령어 | 인자 | 설명 |
|--------|------|------|
| `/pdca plan` | {feature} | Plan 문서 생성 |
| `/pdca design` | {feature} | Design 문서 생성 |
| `/pdca do` | {feature} | Do 페이즈 시작 |
| `/pdca analyze` | {feature} | Gap 분석 (Check) |
| `/pdca iterate` | {feature} | 자동 개선 (Act) |
| `/pdca report` | {feature} | 완성 보고서 |
| `/pdca archive` | {feature} | 문서 보관 |
| `/pdca status` | - | 현재 상태 |
| `/pdca next` | - | 다음 단계 안내 |
| `/pdca pm` | {feature} | PM 에이전트 팀 분석 |
| `/pdca batch` | - | 병렬 PDCA 관리 |

### 24.2 프로젝트 레벨 명령어

| 명령어 | 설명 |
|--------|------|
| `/starter` | Starter 레벨 가이드 |
| `/starter init` | Starter 프로젝트 초기화 |
| `/dynamic` | Dynamic 레벨 가이드 |
| `/dynamic init` | Dynamic 프로젝트 초기화 |
| `/enterprise` | Enterprise 레벨 가이드 |
| `/enterprise init` | Enterprise 프로젝트 초기화 |

### 24.3 파이프라인 명령어

| 명령어 | 설명 |
|--------|------|
| `/development-pipeline` | 9단계 파이프라인 전체 가이드 |
| `/development-pipeline start` | 파이프라인 시작 |
| `/development-pipeline next` | 다음 단계 |
| `/development-pipeline status` | 진행 상황 |
| `/phase-1-schema` ~ `/phase-9-deployment` | 각 단계 직접 실행 |

### 24.4 도구 명령어

| 명령어 | 설명 |
|--------|------|
| `/code-review` | 코드 품질 리뷰 |
| `/simplify` | 코드 간소화/리팩토링 |
| `/zero-script-qa` | Docker 로그 기반 QA |
| `/plan-plus` | 브레인스토밍 강화 플래닝 |

### 24.5 시스템 명령어

| 명령어 | 설명 |
|--------|------|
| `/control` | 자동화 레벨 제어 |
| `/control level L2` | 레벨 변경 |
| `/control stop` | 비상 정지 |
| `/audit` | 감사 로그 조회 |
| `/rollback` | 체크포인트 관리 |
| `/rollback list` | 체크포인트 목록 |
| `/rollback restore {id}` | 롤백 실행 |
| `/btw {메모}` | 개선 아이디어 기록 |
| `/btw list` | 아이디어 목록 |
| `/skill-status` | 로드된 스킬 확인 |
| `/skill-create` | 커스텀 스킬 생성 |
| `/output-style-setup` | 출력 스타일 설치 |
| `/bkit` | bkit 도움말 |

### 24.6 학습 명령어

| 명령어 | 설명 |
|--------|------|
| `/claude-code-learning` | Gemini CLI 학습 |
| `/bkend-quickstart` | bkend.ai 시작 가이드 |
| `/bkend-cookbook` | bkend.ai 튜토리얼 |

### 24.7 플랫폼 명령어

| 명령어 | 설명 |
|--------|------|
| `/mobile-app` | 모바일 앱 (React Native, Flutter) |
| `/desktop-app` | 데스크톱 앱 (Electron, Tauri) |

---

## 25. 자주 묻는 질문

### Q1. bkit을 사용하려면 반드시 PDCA를 따라야 하나요?

**아니요.** PDCA는 권장 워크플로우이지만 강제는 아닙니다. "자유롭게 시작"을 선택하면 일반적인 Gemini CLI 사용과 동일하게 작업할 수 있습니다. 다만, 체계적인 개발을 원한다면 PDCA를 추천합니다.

### Q2. 프로젝트 레벨을 잘못 감지하면 어떻게 하나요?

환경 변수로 직접 지정할 수 있습니다:
```bash
export BKIT_PROJECT_LEVEL=Dynamic
```

### Q3. Gap 분석에서 90%를 넘기지 못하면 어떻게 되나요?

pdca-iterator 에이전트가 최대 5회까지 자동으로 수정을 시도합니다. 5회 반복 후에도 90% 미만이면 사용자에게 수동 개입을 요청합니다.

### Q4. 여러 기능을 동시에 개발할 수 있나요?

네, 최대 3개까지 동시 PDCA 사이클을 운영할 수 있습니다:
```
/pdca plan feature-a
/pdca plan feature-b
/pdca batch   # 전체 상태 확인
```

### Q5. 이전 세션의 작업을 이어서 할 수 있나요?

네, PDCA 상태는 `.bkit/state/`에 영구 저장됩니다. 새 세션을 시작하면 자동으로 이전 상태를 로드합니다:
```
┌─── Workflow Map ──────────────────────┐
│  Feature: user-auth                   │
│  Phase: Do (3/6)                      │
│  Match Rate: --                       │
└───────────────────────────────────────┘
```

### Q6. 커스텀 스킬을 만들 수 있나요?

네, `/skill-create` 명령어로 프로젝트 전용 스킬을 생성할 수 있습니다:
```
/skill-create
→ 스킬 이름, 설명, 트리거 키워드 입력
→ SKILL.md 파일 자동 생성
→ 즉시 사용 가능 (Hot Reload)
```

### Q7. bkit은 어떤 언어를 지원하나요?

bkit 자체는 언어에 구애받지 않습니다. JavaScript, TypeScript, Python, Go, Rust 등 모든 프로그래밍 언어에서 사용할 수 있습니다. 단, bkend.ai BaaS 통합은 REST API 기반이므로 모든 언어에서 사용 가능합니다.

사용자 대화는 **8개 언어**를 자동 감지합니다: 영어, 한국어, 일본어, 중국어, 스페인어, 프랑스어, 독일어, 이탈리아어.

### Q8. 출력 스타일을 중간에 바꿀 수 있나요?

네, 언제든지 변경 가능합니다:
```bash
export BKIT_OUTPUT_STYLE=bkit-enterprise
```
변경 즉시 다음 응답부터 적용됩니다.

### Q9. bkit을 팀 프로젝트에서 사용할 수 있나요?

네, `.bkit/` 디렉토리와 `docs/` 디렉토리를 git에 커밋하면 팀원 모두가 동일한 PDCA 상태와 문서를 공유할 수 있습니다. PDCA 문서는 코드 리뷰 시 설계 의도를 전달하는 데 유용합니다.

### Q10. 비상 상황에서 AI를 즉시 멈추려면?

```
Ctrl+C          # 즉시 정지
/control stop   # 명령어로 정지
```

bkit은 정지 시 자동으로 체크포인트를 저장하므로, 작업 손실 없이 안전하게 중단됩니다.

---

## 부록: 프로젝트 구조 전체도

```
bkit-gemini/
├── .bkit/                        # 상태 관리
│   ├── audit/                    #   감사 로그
│   ├── checkpoints/              #   체크포인트
│   ├── decisions/                #   의사결정 기록
│   ├── runtime/                  #   런타임 상태
│   ├── snapshots/                #   컨텍스트 스냅샷
│   ├── state/                    #   PDCA 상태, 메모리
│   └── workflows/                #   워크플로우 추적
├── .gemini/
│   ├── context/                  # @import 컨텍스트 모듈 (7개)
│   └── policies/                 # TOML 정책 파일
├── agents/                       # 21개 AI 에이전트
├── commands/                     # 명령어 확장
├── docs/                         # PDCA 문서
│   ├── 01-plan/                  #   계획 문서
│   ├── 02-design/                #   설계 문서
│   ├── 03-analysis/              #   분석 문서
│   ├── 04-report/                #   보고서
│   └── guides/                   #   가이드 문서
├── hooks/                        # 라이프사이클 훅
│   ├── hooks.json                #   훅 정의
│   └── scripts/                  #   훅 스크립트 (17개)
├── lib/                          # 핵심 라이브러리 (9,186 LOC)
│   ├── core/                     #   코어 모듈
│   ├── gemini/                   #   Gemini CLI 어댑터
│   ├── intent/                   #   의도 감지
│   ├── pdca/                     #   PDCA 상태 관리
│   ├── task/                     #   작업 관리
│   └── team/                     #   팀 오케스트레이션
├── mcp/                          # MCP 서버
├── output-styles/                # 출력 스타일 (4가지)
├── policies/                     # 정책 템플릿
├── skills/                       # 35개 도메인 스킬
├── templates/                    # PDCA 및 파이프라인 템플릿
├── tests/                        # 테스트 (78 스위트, 972 TC)
├── GEMINI.md                     # 전역 컨텍스트
├── gemini-extension.json         # 확장 매니페스트
├── bkit.config.json              # 중앙 설정 (12개 섹션)
└── README.md                     # 프로젝트 가이드
```

---

> **bkit v2.0.0** - AI와 함께하는 체계적 개발의 시작
>
> 문의: https://github.com/popup-studio-ai/bkit-gemini
> 라이선스: Apache 2.0

# PDCA Plan: bkend-docs-sync v2.0

> **Feature**: bkit-gemini bkend.ai 공식 문서 동기화 및 코드베이스 대규모 업데이트
> **Created**: 2026-02-14
> **Author**: CTO Team (5-agent parallel analysis)
> **Source**: https://github.com/popup-studio-ai/bkend-docs (v0.0.10)
> **Target**: bkit-gemini v1.5.2
> **Status**: Plan

---

## 1. Executive Summary

bkend.ai 공식 문서 저장소(109건의 문서, 5개 예제 앱)를 CTO팀 5명의 전문 에이전트가 병렬 분석한 결과, 현재 bkit-gemini 코드베이스의 bkend 관련 컨텐츠에 **심각한 격차**가 발견되었습니다.

### 핵심 발견 사항

| 항목 | 공식 문서 | 현재 bkit | 커버리지 |
|------|----------|----------|---------|
| Authentication | 21개 문서 (MFA, 계정연동, 초대, 이메일템플릿 등) | 기본 JWT 패턴만 | ~15% |
| Database | 13개 문서 (7 컬럼타입, Relations, CRUD 패턴) | 간단한 쿼리 패턴 | ~20% |
| Storage | 10개 문서 (Presigned URL, Multipart, 4 visibility) | 미포함 | ~0% |
| MCP Tools | 9개 문서 (28 MCP 도구 + 4 Resources) | "MCP 연동" 언급만 | ~5% |
| AI Tools | 9개 문서 (Claude Code, Cursor, OAuth 설정) | 미포함 | ~0% |
| Security | 8개 문서 (RLS, API Keys, 암호화) | 미포함 | ~0% |
| Console | 12개 문서 (프로젝트, 환경, 팀, 스키마) | 미포함 | ~0% |
| Guides | 11개 문서 (마이그레이션, 성능, Webhooks 등) | 미포함 | ~0% |
| Getting Started | 7개 문서 (퀵스타트, 핵심개념) | 일부 | ~25% |
| Troubleshooting | 5개 문서 (에러, 연결, 인증, 성능, FAQ) | 4행 테이블 | ~10% |
| Cookbooks | 4 프로젝트 (Blog, Recipe, Shopping, Social) | 목록만 | ~10% |
| Examples | 5 앱 (3 Next.js + 2 Flutter) | 미포함 | ~0% |

### Critical 오류 발견

1. **`skills/dynamic/SKILL.md`**: "Managed PostgreSQL" 기술 → **실제는 MongoDB Atlas 기반** (보안 문서에서 "MongoDB Atlas Encryption at Rest" 확인)
2. **`agents/bkend-expert.md`**: MongoDB 맞지만 REST API 패턴/헤더 정보 부재
3. **`skills/dynamic/SKILL.md`**: `@bkend/sdk` 임포트 → **실제는 REST API 직접 호출** (SDK 존재하지 않음)
4. **MCP 도구 체계 미반영**: 공식 20+ MCP 도구가 bkit에 전혀 등록되지 않음

---

## 2. Analysis Sources

### 2.1 CTO Team Composition

| Agent | 역할 | 분석 범위 | 문서 수 |
|-------|------|----------|---------|
| auth-security-expert | 인증/보안 전문가 | Authentication + Security | 29건 |
| mcp-ai-expert | MCP 통합 전문가 | MCP Tools + AI Tools | 18건 |
| db-storage-expert | DB/스토리지 전문가 | Database + Storage | 23건 |
| platform-devops-expert | 플랫폼 전문가 | Guides + Troubleshooting + Console + Getting Started | 35건 |
| fullstack-app-expert | 풀스택 앱 전문가 | Cookbooks + Examples | 4 프로젝트 + 5 앱 |

### 2.2 bkend-docs Repository Structure (v0.0.10)

```
bkend-docs/
├── en/                          # English docs (primary reference)
│   ├── getting-started/ (7)     # 시작하기
│   ├── ai-tools/ (9)           # AI 도구 연동
│   ├── mcp/ (9)                # MCP 도구
│   ├── console/ (12)           # 콘솔 관리
│   ├── authentication/ (21)    # 인증
│   ├── database/ (13)          # 데이터베이스
│   ├── storage/ (10)           # 스토리지
│   ├── security/ (8)           # 보안
│   ├── guides/ (11)            # 가이드
│   └── troubleshooting/ (5)    # 문제해결
├── ko/                          # Korean docs (mirror)
├── cookbooks/ (4 projects)      # 실전 프로젝트
│   ├── blog/
│   ├── recipe-app/
│   ├── shopping-mall/
│   └── social-network/
└── examples/ (5 apps)           # 예제 앱
    ├── blog-web/ (Next.js)
    ├── recipe-web/ (Next.js)
    ├── recipe-app/ (Flutter)
    ├── shopping-mall-web/ (Next.js)
    └── social-network-app/ (Flutter)
```

---

## 3. Gap Analysis Detail

### 3.1 Authentication (21 docs → 현재 커버리지 ~15%)

| # | 문서 | 핵심 내용 | bkit 상태 | 우선순위 |
|---|------|----------|----------|---------|
| 01 | overview | 인증 방식, JWT 토큰, 필수 헤더 | 부분 반영 | Critical |
| 02 | email-signup | POST /auth/email/signup, 요청/응답 스키마 | 언급만 | Critical |
| 03 | email-signin | POST /auth/email/signin, 에러 코드 | 언급만 | Critical |
| 04 | magic-link | magiclink method, 콜백 처리 | 언급만 | High |
| 05 | social-overview | OAuth 흐름, 콘솔 설정 | 언급만 | High |
| 06 | social-google | Google OAuth 전체 설정 가이드 | 미포함 | High |
| 07 | social-github | GitHub OAuth 전체 설정 가이드 | 미포함 | High |
| 08 | password-management | 비밀번호 재설정/변경 API | 미포함 | High |
| 09 | email-verification | 이메일 인증 흐름 | 미포함 | Medium |
| 10 | session-management | 세션/토큰 관리, 자동 갱신 | 부분 반영 | Critical |
| 11 | mfa | 다중 인증 설정/검증 | **완전 미포함** | High |
| 12 | account-linking | 소셜 계정 연동/해제 | **완전 미포함** | Medium |
| 13 | invitation | 초대 시스템 | **완전 미포함** | Medium |
| 14 | user-profile | 프로필/아바타 관리 | 미포함 | High |
| 15 | user-management | 사용자 목록/검색/관리 | 미포함 | High |
| 16 | account-deletion | 회원 탈퇴 | 미포함 | Medium |
| 17 | provider-config | 인증 제공자 콘솔 설정 | 미포함 | Medium |
| 18 | email-templates | 이메일 템플릿 커스터마이징 | **완전 미포함** | Low |
| 19 | api-reference | Auth REST API 전체 레퍼런스 | **완전 미포함** | Critical |
| 20 | token-management | 토큰 저장/갱신 패턴 (프론트엔드) | 부분 반영 | Critical |
| 21 | auth-form-patterns | 인증 폼 구현 패턴 (React/Next.js) | 미포함 | High |

### 3.2 Database (13 docs → 현재 커버리지 ~20%)

| # | 문서 | 핵심 내용 | bkit 상태 | 우선순위 |
|---|------|----------|----------|---------|
| 01 | overview | DB 구조, 역할, 시스템 필드, API 구조 | 부분 반영 | Critical |
| 02 | data-model | 7 컬럼타입, 제약조건, 인덱스 | 부분 반영 | Critical |
| 03 | insert | POST /v1/data/:table, 배치 삽입 | 미포함 | Critical |
| 04 | select | GET /v1/data/:table/:id | 미포함 | Critical |
| 05 | list | GET /v1/data/:table, 필터/정렬/페이지네이션 | 미포함 | Critical |
| 06 | update | PUT /v1/data/:table/:id | 미포함 | Critical |
| 07 | delete | DELETE /v1/data/:table/:id | 미포함 | Critical |
| 08 | filtering | AND/OR 조합, 8개 연산자 | 부분 반영 | High |
| 09 | sorting-pagination | 정렬, 커서 기반 페이지네이션 | 부분 반영 | High |
| 10 | table-spec | 테이블 스키마 조회 API | 미포함 | Medium |
| 11 | api-reference | Database REST API 전체 레퍼런스 | **완전 미포함** | Critical |
| 12 | crud-app-patterns | 프론트엔드 CRUD 통합 패턴 | 미포함 | High |
| 13 | relations | 테이블 관계(1:N, N:M), join 쿼리 | 미포함 | High |

### 3.3 Storage (10 docs → 현재 커버리지 ~0%)

| # | 문서 | 핵심 내용 | bkit 상태 | 우선순위 |
|---|------|----------|----------|---------|
| 01 | overview | Presigned URL 패턴, 핵심 기능 | 미포함 | Critical |
| 02 | upload-single | 단일 파일 업로드 3단계 | 미포함 | Critical |
| 03 | upload-multipart | 대용량 멀티파트 업로드 | 미포함 | High |
| 04 | file-metadata | 파일 메타데이터 CRUD | 미포함 | High |
| 05 | file-list | 파일 목록 조회/필터 | 미포함 | Medium |
| 06 | download | CDN vs Presigned 다운로드 | 미포함 | High |
| 07 | file-delete | 파일 삭제 | 미포함 | Medium |
| 08 | permissions | 4 visibility (public/private/protected/shared) | 미포함 | High |
| 09 | api-reference | Storage REST API 전체 레퍼런스 | 미포함 | Critical |
| 10 | upload-app-patterns | 프론트엔드 업로드 통합 패턴 | 미포함 | High |

### 3.4 MCP Tools (9 docs → 현재 커버리지 ~5%)

| # | 문서 | 핵심 내용 | bkit 상태 | 우선순위 |
|---|------|----------|----------|---------|
| 01 | overview | 도구 분류, Fixed/API/Resource 구조 | 미포함 | Critical |
| 02 | context | get_context, search_docs 도구 | 미포함 | Critical |
| 03 | project-tools | 6개 프로젝트 관리 도구 | 미포함 | Critical |
| 04 | table-tools | 9개 테이블 관리 도구 | 미포함 | Critical |
| 05 | data-tools | 5개 데이터 CRUD 도구 | 미포함 | Critical |
| 06 | auth-tools | Auth REST API 생성 가이드 (MCP 도구 없음) | 미포함 | High |
| 07 | storage-tools | Storage REST API 생성 가이드 (MCP 도구 없음) | 미포함 | High |
| 08 | resources | bkend:// URI 스키마, 4개 리소스 | 미포함 | High |
| 09 | api-reference | MCP 도구 전체 레퍼런스 | 미포함 | Critical |

### 3.5 AI Tools (9 docs → 현재 커버리지 ~0%)

| # | 문서 | 핵심 내용 | bkit 상태 | 우선순위 |
|---|------|----------|----------|---------|
| 01 | overview | AI 도구 연동 개요 | 미포함 | High |
| 02 | mcp-protocol | MCP 프로토콜 이해 | 미포함 | High |
| 03 | oauth-setup | OAuth 2.1 인증 설정 | **완전 미포함** | Critical |
| 04 | claude-code-setup | Claude Code MCP 설정 | 미포함 | Critical |
| 05 | claude-code-usage | Claude Code 사용법 | 미포함 | High |
| 06 | cursor-setup | Cursor MCP 설정 | 미포함 | High |
| 07 | cursor-usage | Cursor 사용법 | 미포함 | Medium |
| 08 | antigravity-setup | Antigravity 설정 | 미포함 | Low |
| 09 | other-tools | 기타 AI 도구 | 미포함 | Low |

### 3.6 Security (8 docs → 현재 커버리지 ~0%)

| # | 문서 | 핵심 내용 | bkit 상태 | 우선순위 |
|---|------|----------|----------|---------|
| 01 | overview | 다층 보안 모델, 보안 레이어 | 미포함 | Critical |
| 02 | api-keys | API 키 이해 | 미포함 | Critical |
| 03 | public-vs-secret | Public Key vs Secret Key | 미포함 | Critical |
| 04 | rls-overview | Row Level Security 개요 | 미포함 | Critical |
| 05 | rls-policies | RLS 정책 작성법 | 미포함 | Critical |
| 06 | data-encryption | AES-256-GCM, Argon2id, TLS | 미포함 | High |
| 07 | best-practices | 보안 모범 사례 | 미포함 | High |
| 08 | api-reference | Security REST API 레퍼런스 | 미포함 | High |

### 3.7 Console (12 docs), Guides (11 docs), Getting Started (7 docs), Troubleshooting (5 docs)

이 섹션들은 현재 bkit에 거의 반영되지 않았으며, 운영 지식으로 에이전트/스킬에 포함 필요.

### 3.8 Cookbooks & Examples

| 프로젝트 | 타입 | 기술 스택 | 가이드 | 예제 앱 |
|---------|------|----------|--------|---------|
| Blog | 웹 | Next.js + bkend | Quick Start + Full Guide (8편) | blog-web |
| Recipe | 웹+모바일 | Next.js + Flutter + bkend | Quick Start + Full Guide (8편) | recipe-web, recipe-app |
| Shopping Mall | 웹 | Next.js + bkend | Quick Start + Full Guide (8편) | shopping-mall-web |
| Social Network | 모바일 | Flutter + bkend | Quick Start + Full Guide (8편) | social-network-app |

---

## 4. Modification Plan

### 4.1 Phase 1: Critical Fixes (Day 1)

즉시 수정해야 할 오류 수정.

#### 4.1.1 `agents/bkend-expert.md` - Major Overhaul

**현재 문제**:
- REST API 헤더 패턴 누락 (`X-Project-Id`, `X-Environment`)
- `useAuth` 훅 등 존재하지 않는 SDK 패턴 사용
- TanStack Query 패턴은 유효하나 API 호출 방식 수정 필요
- 트러블슈팅 4행만 존재 → 공식 문서 기반 확장 필요

**수정 내용**:
```
1. Core Concepts 섹션 전면 재작성:
   - "MongoDB-based database" → "MongoDB Atlas 기반, REST API로 조작"
   - MCP 도구 체계 정확히 반영 (Fixed 3 + Project 6 + Table 9 + Data CRUD 5)
   - Auth/Storage는 MCP 도구 없이 REST API 사용

2. 필수 헤더 패턴 추가:
   - X-Project-Id, X-Environment, Authorization

3. 4개 역할 체계 반영:
   - admin, user, guest, self

4. Authentication 패턴 전면 재작성:
   - REST API 엔드포인트 기반 (POST /auth/email/signup 등)
   - 토큰 관리 패턴 (Access 1h, Refresh 7d)
   - MFA, 소셜 로그인, 매직링크 패턴 추가

5. Database 패턴 업데이트:
   - REST API CRUD 패턴 (/v1/data/:tableName)
   - 7 컬럼타입, 시스템 필드, 필터링 연산자

6. Storage 패턴 추가:
   - Presigned URL 3단계 패턴
   - 4 visibility 레벨

7. Security 섹션 추가:
   - API Keys (Public vs Secret)
   - RLS 정책 패턴

8. Troubleshooting 확장:
   - 공식 문서 기반 완전한 트러블슈팅 가이드
```

#### 4.1.2 `skills/dynamic/SKILL.md` - Critical Fix

**현재 문제**:
- "Managed PostgreSQL" → **틀림** (MongoDB Atlas 기반)
- `@bkend/sdk` 임포트 → **존재하지 않는 SDK**
- REST API 직접 호출 방식으로 수정 필요

**수정 내용**:
```
1. bkend.ai Features 섹션 수정:
   - "Database: Managed PostgreSQL" → "Database: MongoDB Atlas (REST API)"
   - "API: Auto-generated REST & GraphQL" → "API: REST API (no GraphQL)"

2. Authentication Example 전면 재작성:
   - SDK 임포트 제거
   - REST API 호출 패턴으로 변경:
     fetch('/auth/email/signup', { headers: { 'X-Project-Id': '...' } })

3. 새로운 bkend-* 스킬 imports 추가
4. MCP 설정 가이드 추가
```

### 4.2 Phase 2: New Skills Creation (Day 2-3)

bkend-docs의 각 섹션을 Gemini 스킬로 변환.

#### 4.2.1 `skills/bkend-quickstart/SKILL.md` (NEW)

```yaml
name: bkend-quickstart
description: bkend.ai 플랫폼 온보딩 및 핵심 개념 가이드
source: en/getting-started/ (7 docs) + en/console/ (12 docs)
content:
  - What is bkend (BaaS 개요, 핵심 기능)
  - Quick Start Guide (계정 생성 → 프로젝트 → 테이블 → API 호출)
  - Core Concepts (Org > Project > Environment 계층)
  - Tenant vs User 이해
  - App Integration 가이드 (REST API 연동)
  - Framework Quick Start (Next.js, Flutter 초기 설정)
  - Console 운영 (12개 문서 요약)
triggers: bkend setup, 처음, 시작, 온보딩, quickstart
```

#### 4.2.2 `skills/bkend-auth/SKILL.md` (NEW)

```yaml
name: bkend-auth
description: bkend.ai 인증 및 사용자 관리 전문 스킬
source: en/authentication/ (21 docs)
content:
  - 이메일 회원가입/로그인 (REST API 전체 스키마)
  - 매직링크 인증
  - 소셜 로그인 (Google, GitHub) 설정 및 구현
  - 비밀번호 재설정/변경
  - 이메일 인증
  - 세션 & 토큰 관리 (JWT, Access/Refresh)
  - 다중 인증 (MFA) 설정/검증
  - 소셜 계정 연동/해제
  - 초대 시스템
  - 사용자 프로필 & 아바타
  - 사용자 관리 (목록, 검색, 역할)
  - 회원 탈퇴
  - 인증 제공자 설정
  - 이메일 템플릿 커스터마이징
  - Auth REST API 전체 레퍼런스
  - 토큰 저장/갱신 프론트엔드 패턴
  - 인증 폼 구현 패턴 (React/Next.js)
triggers: auth, login, signup, 인증, 로그인, 회원가입
```

#### 4.2.3 `skills/bkend-data/SKILL.md` (NEW)

```yaml
name: bkend-data
description: bkend.ai 데이터베이스 CRUD 전문 스킬
source: en/database/ (13 docs)
content:
  - Database 개요 (프로젝트별 격리, 스키마 검증)
  - 데이터 모델 (7 컬럼타입, 제약조건, 인덱스)
  - CRUD 전체 REST API:
    - POST /v1/data/:table (생성, 배치)
    - GET /v1/data/:table/:id (단건 조회)
    - GET /v1/data/:table (목록, 필터, 정렬, 페이지네이션)
    - PUT /v1/data/:table/:id (수정)
    - DELETE /v1/data/:table/:id (삭제)
  - 필터링 (AND/OR, 8개 연산자)
  - 정렬 & 커서 기반 페이지네이션
  - 테이블 스키마 조회 API
  - Database REST API 전체 레퍼런스
  - CRUD 앱 패턴 (프론트엔드 통합)
  - 테이블 관계 (1:N, N:M, join)
  - 시스템 필드 (id, createdBy, createdAt, updatedAt)
  - 4개 역할 (admin, user, guest, self)
triggers: table, database, CRUD, 테이블, 데이터
```

#### 4.2.4 `skills/bkend-storage/SKILL.md` (NEW)

```yaml
name: bkend-storage
description: bkend.ai 파일 스토리지 전문 스킬
source: en/storage/ (10 docs)
content:
  - Storage 개요 (S3 Presigned URL 패턴)
  - 단일 파일 업로드 3단계:
    1. Presigned URL 요청
    2. S3 직접 업로드
    3. 메타데이터 등록
  - 대용량 멀티파트 업로드
  - 파일 메타데이터 CRUD
  - 파일 목록 조회/필터
  - 파일 다운로드 (CDN vs Presigned)
  - 파일 삭제
  - 접근 권한 (4 visibility: public/private/protected/shared)
  - Storage REST API 전체 레퍼런스
  - 업로드 앱 패턴 (프론트엔드 통합)
triggers: file, upload, storage, 파일, 업로드, 스토리지
```

#### 4.2.5 `skills/bkend-mcp/SKILL.md` (NEW)

```yaml
name: bkend-mcp
description: bkend.ai MCP 도구 및 AI 도구 연동 스킬
source: en/mcp/ (9 docs) + en/ai-tools/ (9 docs)
content:
  - MCP 도구 개요 및 분류:
    - Fixed Tools (3): get_context, search_docs, get_operation_schema
    - Project Tools (6): backend_org_list, backend_project_*, backend_env_*
    - Table Tools (9): backend_table_*, backend_field_manage, backend_index_manage
    - Data Tools (5): backend_data_list/get/create/update/delete
  - MCP Context (get_context 사용법)
  - MCP Resources (bkend:// URI 스키마)
  - Auth/Storage MCP 대안 (search_docs → REST API 코드 생성)
  - AI 도구 연동:
    - OAuth 2.1 인증 설정
    - Claude Code MCP 설정 (mcp.json)
    - Claude Code 사용법
    - Cursor MCP 설정
    - Cursor 사용법
    - Antigravity 설정
  - MCP 도구 전체 레퍼런스
triggers: mcp, ai tool, claude code setup, cursor setup, MCP 도구
```

#### 4.2.6 `skills/bkend-security/SKILL.md` (NEW)

```yaml
name: bkend-security
description: bkend.ai 보안 아키텍처 및 정책 스킬
source: en/security/ (8 docs)
content:
  - 다층 보안 모델 (인증 → 인가 → 암호화)
  - API 키 이해 (생성, 관리, 보안)
  - Public Key vs Secret Key (사용 시나리오, 위험)
  - Row Level Security 개요 (admin/user/guest/self)
  - RLS 정책 작성법 (테이블별 설정)
  - 데이터 암호화 (TLS 1.2+, AES-256-GCM, Argon2id)
  - 보안 모범 사례
  - Security REST API 레퍼런스
triggers: security, RLS, api key, 보안, 보안정책
```

#### 4.2.7 `skills/bkend-cookbook/SKILL.md` (NEW)

```yaml
name: bkend-cookbook
description: bkend.ai 실전 프로젝트 쿡북 스킬
source: cookbooks/ (4 projects) + examples/ (5 apps)
content:
  - 4 프로젝트 Quick Start:
    - Blog (5분 만에 시작)
    - Recipe App (10분)
    - Shopping Mall (10분)
    - Social Network (10분)
  - 4 프로젝트 Full Guide:
    - 각 프로젝트별 6-7편의 단계별 가이드
    - AI 프롬프트 모음 포함
    - 트러블슈팅 포함
  - 예제 앱 아키텍처 패턴:
    - Next.js 앱 구조 (infrastructure/api/client.ts, hooks/queries/, stores/)
    - Flutter 앱 구조 (features/, core/, shared/)
    - DTO 패턴, Mock 데이터, TanStack Query 패턴
triggers: cookbook, tutorial, 블로그, 쇼핑몰, 레시피, 소셜네트워크
```

#### 4.2.8 `skills/bkend-guides/SKILL.md` (NEW)

```yaml
name: bkend-guides
description: bkend.ai 운영 가이드 및 트러블슈팅 스킬
source: en/guides/ (11 docs) + en/troubleshooting/ (5 docs)
content:
  - 타 플랫폼 비교 (Firebase, Supabase)
  - Firebase 마이그레이션 가이드
  - Supabase 마이그레이션 가이드
  - 성능 최적화
  - 확장 가이드
  - 테스트 전략
  - CI/CD 파이프라인
  - Webhooks (준비 중)
  - 실시간 데이터
  - 커스텀 도메인
  - 에러 처리 가이드
  - 트러블슈팅:
    - 일반 에러 (에러 코드별 해결)
    - 연결 문제
    - 인증 문제
    - 성능 문제
    - FAQ
triggers: migration, firebase, supabase, 마이그레이션, troubleshooting, 에러
```

### 4.3 Phase 3: New Commands (Day 3)

각 새 스킬에 대한 명령어 생성.

#### 새로운 Command 파일 (8개)

| 파일 | 명령어 | 설명 |
|------|--------|------|
| `commands/bkend-quickstart.toml` | `/bkend-quickstart` | 온보딩 가이드 |
| `commands/bkend-auth.toml` | `/bkend-auth` | 인증 구현 가이드 |
| `commands/bkend-data.toml` | `/bkend-data` | DB CRUD 가이드 |
| `commands/bkend-storage.toml` | `/bkend-storage` | 스토리지 가이드 |
| `commands/bkend-mcp.toml` | `/bkend-mcp` | MCP 설정 가이드 |
| `commands/bkend-security.toml` | `/bkend-security` | 보안 설정 가이드 |
| `commands/bkend-cookbook.toml` | `/bkend-cookbook` | 쿡북 프로젝트 |
| `commands/bkend-guides.toml` | `/bkend-guides` | 운영 가이드 |

### 4.4 Phase 4: Context & Config Updates (Day 3-4)

#### 4.4.1 `.gemini/context/agent-triggers.md`

```diff
- | bkend, auth, login, database, 인증, 로그인, 認証, ログイン, 身份验证 | `bkend-expert` | bkend.ai BaaS integration |
+ | bkend, BaaS, backend, 백엔드, バックエンド, 后端 | `bkend-expert` | bkend.ai BaaS 플랫폼 전체 |
```

#### 4.4.2 `.gemini/context/skill-triggers.md`

새로운 bkend 스킬 트리거 8개 추가:

```markdown
| bkend setup, quickstart, 시작, 온보딩 | `bkend-quickstart` | bkend 온보딩 |
| auth, login, signup, 인증, 로그인 | `bkend-auth` | 인증 구현 |
| table, data, CRUD, 데이터 | `bkend-data` | DB CRUD |
| file, upload, storage, 파일 | `bkend-storage` | 스토리지 |
| mcp, ai tool, mcp setup | `bkend-mcp` | MCP 설정 |
| security, RLS, api key, 보안 | `bkend-security` | 보안 |
| cookbook, tutorial, 쿡북 | `bkend-cookbook` | 쿡북 |
| migration, troubleshoot, 마이그레이션 | `bkend-guides` | 가이드 |
```

#### 4.4.3 `.gemini/context/commands.md`

새 명령어 8개 추가.

#### 4.4.4 `bkit.config.json`

```diff
  "levelDetection": {
    "dynamic": {
-     "packagePatterns": ["bkend", "@supabase", "firebase"]
+     "packagePatterns": ["bkend", "@supabase", "firebase"],
+     "headerPatterns": ["X-Project-Id", "X-Environment"]
    }
  }
```

#### 4.4.5 `GEMINI.md`

bkend 스킬 수 반영: 21 → 29 스킬.

#### 4.4.6 `gemini-extension.json`

버전 업데이트: v1.5.1 → v1.5.2.

### 4.5 Phase 5: Test Updates (Day 4)

#### 4.5.1 기존 테스트 수정

```
tests/suites/tc03-agents.js
  - bkend-expert 에이전트 내용 검증 강화

tests/verify-components.js
  - 새 스킬 8개 파일 존재 검증 추가
  - 새 커맨드 8개 파일 존재 검증 추가
```

#### 4.5.2 새 테스트 추가

```
tests/suites/tc-bkend-skills.js (NEW)
  - 8개 bkend 스킬 파일 존재 검증
  - 각 스킬 frontmatter 필수 필드 검증
  - 각 스킬 트리거 키워드 검증
  - REST API 엔드포인트 정확성 검증
```

### 4.6 Phase 6: Documentation (Day 4)

#### 4.6.1 `README.md`

```
- 스킬 수: 21 → 29
- 새 bkend-* 스킬 8개 테이블에 추가
- 새 명령어 8개 테이블에 추가
- bkend.ai 섹션 상세 설명 추가
```

#### 4.6.2 `CHANGELOG.md`

v1.5.2 엔트리 추가.

---

## 5. File Change Summary

### 5.1 수정 파일 (10개)

| 파일 | 변경 종류 | 예상 규모 |
|------|----------|----------|
| `agents/bkend-expert.md` | **전면 재작성** | ~400행 (현재 146행) |
| `skills/dynamic/SKILL.md` | Critical Fix + 확장 | ~200행 (현재 128행) |
| `.gemini/context/agent-triggers.md` | 트리거 수정 | 소규모 |
| `.gemini/context/skill-triggers.md` | 8개 트리거 추가 | 중규모 |
| `.gemini/context/commands.md` | 8개 명령어 추가 | 중규모 |
| `bkit.config.json` | 레벨 감지 패턴 추가 | 소규모 |
| `GEMINI.md` | 수치 업데이트 | 소규모 |
| `gemini-extension.json` | 버전 업데이트 | 소규모 |
| `README.md` | 컴포넌트 수 및 테이블 업데이트 | 중규모 |
| `tests/verify-components.js` | 새 컴포넌트 검증 추가 | 소규모 |

### 5.2 신규 파일 (17개)

| 파일 | 카테고리 | 예상 규모 |
|------|----------|----------|
| `skills/bkend-quickstart/SKILL.md` | Skill | ~300행 |
| `skills/bkend-auth/SKILL.md` | Skill | ~500행 |
| `skills/bkend-data/SKILL.md` | Skill | ~400행 |
| `skills/bkend-storage/SKILL.md` | Skill | ~350행 |
| `skills/bkend-mcp/SKILL.md` | Skill | ~400행 |
| `skills/bkend-security/SKILL.md` | Skill | ~300행 |
| `skills/bkend-cookbook/SKILL.md` | Skill | ~500행 |
| `skills/bkend-guides/SKILL.md` | Skill | ~350행 |
| `commands/bkend-quickstart.toml` | Command | ~15행 |
| `commands/bkend-auth.toml` | Command | ~15행 |
| `commands/bkend-data.toml` | Command | ~15행 |
| `commands/bkend-storage.toml` | Command | ~15행 |
| `commands/bkend-mcp.toml` | Command | ~15행 |
| `commands/bkend-security.toml` | Command | ~15행 |
| `commands/bkend-cookbook.toml` | Command | ~15행 |
| `commands/bkend-guides.toml` | Command | ~15행 |
| `tests/suites/tc-bkend-skills.js` | Test | ~100행 |

### 5.3 총 변경 규모

- **수정**: 10 파일
- **신규**: 17 파일
- **예상 총 코드량**: ~3,500행 추가
- **버전**: v1.5.1 → v1.5.2

---

## 6. Implementation Priority

| 우선순위 | Phase | 작업 | 영향도 |
|---------|-------|------|--------|
| P0 (Critical) | 1 | bkend-expert.md 전면 재작성 | MongoDB 오류, API 패턴 부재 |
| P0 (Critical) | 1 | dynamic/SKILL.md PostgreSQL→MongoDB, SDK→REST 수정 | 잘못된 정보 제공 중 |
| P1 (High) | 2 | bkend-auth 스킬 생성 | 21개 문서 커버 필요 |
| P1 (High) | 2 | bkend-data 스킬 생성 | 13개 문서 커버 필요 |
| P1 (High) | 2 | bkend-mcp 스킬 생성 | MCP 도구 체계 전달 필수 |
| P1 (High) | 2 | bkend-storage 스킬 생성 | 10개 문서 커버 필요 |
| P2 (Medium) | 2 | bkend-security 스킬 생성 | 보안 패턴 전달 |
| P2 (Medium) | 2 | bkend-quickstart 스킬 생성 | 온보딩 가이드 |
| P2 (Medium) | 2 | bkend-cookbook 스킬 생성 | 실전 프로젝트 |
| P3 (Low) | 2 | bkend-guides 스킬 생성 | 운영 가이드 |
| P1 (High) | 3 | 커맨드 8개 생성 | 스킬 접근성 |
| P1 (High) | 4 | Context/Config 업데이트 | 자동 트리거 |
| P2 (Medium) | 5 | 테스트 업데이트 | 품질 보증 |
| P2 (Medium) | 6 | 문서 업데이트 | README, CHANGELOG |

---

## 7. Risk Assessment

| 위험 | 영향 | 대응 |
|------|------|------|
| 스킬 파일 크기 과대 | Gemini CLI 컨텍스트 제한 초과 | Progressive disclosure: 핵심만 스킬에, 상세는 참조 링크 |
| 공식 문서 업데이트 | 스킬 내용 outdated | bkend-docs VERSION 모니터링, 정기 동기화 |
| API 엔드포인트 변경 | 코드 생성 오류 | 스킬에 버전 정보 포함, API reference 중앙화 |
| Webhook/Realtime 미완성 | 불완전한 가이드 | "준비 중" 명시, placeholder 스킬 |

---

## 8. Success Criteria

| 지표 | 현재 | 목표 |
|------|------|------|
| bkend 문서 커버리지 | ~10% | 95%+ |
| Critical 오류 | 3건 | 0건 |
| 스킬 수 (bkend 관련) | 1 (dynamic) | 9 (dynamic + 8 new) |
| 커맨드 수 (bkend 관련) | 1 (/dynamic) | 9 (/dynamic + 8 new) |
| API 엔드포인트 정확도 | ~20% | 100% |
| MCP 도구 커버리지 | 0% | 100% |

---

## 9. Dependencies

- bkend-docs v0.0.10 (현재 최신)
- bkit-gemini v1.5.1 (현재 버전)
- Gemini CLI v0.28.0+ 호환성 유지

---

## 10. Appendix: bkend.ai Key Technical Facts

### Required Headers (모든 API 공통)
```
X-Project-Id: {project_id}     # 프로젝트 ID (필수)
X-Environment: dev|staging|prod # 환경 (필수)
Authorization: Bearer {token}   # 인증 토큰 (조건부)
```

### MCP Tool Catalog
```
Fixed Tools (3):
  - get_context          # 세션 컨텍스트 조회
  - search_docs          # 문서 검색
  - get_operation_schema # 도구 스키마 조회

Project Management (6):
  - backend_org_list
  - backend_project_list / create / get
  - backend_env_list / create

Table Management (9):
  - backend_table_list / create / get / update / delete
  - backend_field_manage
  - backend_index_manage
  - backend_schema_version_list / get

Data CRUD (5):
  - backend_data_list / get / create / update / delete

Auth & Storage: NO MCP Tools (REST API only)
```

### Database Column Types (7)
```
string, number, boolean, date, json, array, reference
```

### Auth Methods
```
email+password, magic-link, google-oauth, github-oauth
```

### Storage Visibility Levels (4)
```
public, private, protected, shared
```

### Security Layers
```
API Keys → JWT → RLS (admin/user/guest/self) → TLS 1.2+ → AES-256-GCM
Password: Argon2id (64 MiB, 3 iter, 4 threads) | API Keys: SHA-256 one-way hash
```

---

## 11. Agent Analysis Results Summary (5-Agent Parallel)

### 11.1 auth-security-expert 분석 결과

- **분석 완료**: Auth 21건 + Security 8건 = 29건
- **총 엔드포인트**: 64개 (Auth 45 + User 19)
- **현재 bkit 커버 엔드포인트**: ~5개 (92% 갭)
- **완전 미포함 토픽**: 14/23개
- **에러 코드**: 30+ 미반영
- **Critical 패턴**: `bkendFetch` 래퍼 (모든 API 호출 기반), Auth Form 패턴, RLS 정책 JSON

### 11.2 mcp-ai-expert 분석 결과

- **분석 완료**: MCP 9건 + AI Tools 9건 = 18건
- **MCP 도구 총 수**: 28개 도구 + 4개 리소스
  - Fixed (3) + Project (6) + Environment (3) + Table (4) + Field/Index (2) + Schema Version (5) + Data CRUD (5)
- **MCP 서버 URL**: `https://api.bkend.ai/mcp`
- **REST API Base URL**: `https://api-client.bkend.ai`
- **프로토콜**: MCP 2025-03-26, Streamable HTTP, OAuth 2.1 + PKCE
- **현재 커버리지**: ~5%

### 11.3 db-storage-expert 분석 결과

- **분석 완료**: Database 13건 + Storage 10건 = 23건
- **DB 엔드포인트**: 6개 (CRUD 5 + Spec 1)
- **Storage 엔드포인트**: 11개 (Upload 5 + CRUD 4 + Download 1 + Abort 1)
- **에러 코드**: 25개 (DB 9 + Storage 16)
- **신규 엔드포인트**: `GET /v1/data/:tableName/spec`, `POST /v1/files/multipart/abort`
- **신규 필터 연산자**: `$regex`, `$exists` (기존 8 → 10개)
- **신규 쿼리 파라미터**: `search`, `searchType`
- **DB 컬럼 타입**: string, int, double, bool, date, object, array (7개 - number→int/double 분리)

### 11.4 platform-devops-expert 분석 결과

- **분석 완료**: Getting Started 7건 + Console 12건 + Guides 11건 + Troubleshooting 5건 = 35건
- **P0 Critical 문서**: 16건
- **핵심 설정값**:
  - Token Lifetime: Access=1hr, Refresh=30d (bkit에 7d로 잘못 기재)
  - Default Indexes: `_id_`, `idx_createdAt_desc`, `idx_updatedAt_desc`, `idx_createdBy`
  - Max Query Limit: 100
  - Password: 8-128 chars
- **에러 코드**: 20+ (VALIDATION_ERROR, TOKEN_EXPIRED, PERMISSION_DENIED 등)
- **준비 중 문서**: Webhooks, Realtime, CI/CD, Firebase/Supabase Migration, Custom Domain
- **용어집**: 15개 핵심 용어 정의

### 11.5 fullstack-app-expert 분석 결과

- **분석 완료**: 4 Cookbook 프로젝트 (각 9건) + 5 Example Apps
- **Cookbook 프로젝트 요약**:
  - Blog: 3 테이블, Beginner, 5분 Quick Start
  - Recipe App: 5 테이블, Intermediate, 10분 Quick Start
  - Shopping Mall: 4 테이블, Intermediate, 주문 상태 머신 패턴
  - Social Network: 5 테이블, Beginner, 피드 알고리즘 패턴
- **Next.js 공통 아키텍처**: app/(app|auth), application/dto, infrastructure/api/client.ts, hooks/queries, stores (Zustand)
- **Flutter 공통 아키텍처**: features/{data,models,presentation,providers}, core/network/DioClient
- **핵심 신규 패턴**: 15개
  - bkendFetch 래퍼, Mock 모드, DTO 레이어, Query Key Factory, Counter Cache, Order State Machine
- **주요 의존성**: Next.js 16+, React 19+, TanStack Query 5, Zustand, Radix UI, Tailwind CSS 4

---

## 12. Refined Critical Facts (에이전트 분석으로 보정)

### Refresh Token Lifetime 수정
```
현재 bkit (bkend-auth 스킬): Refresh 7d ← 틀림!
공식 문서 (troubleshooting/03): Refresh 30d ← 정확
OAuth Token: Access 1h, Refresh 30d, Auth Code 10min (single-use)
```

### DB Column Types 수정
```
현재 bkit: string, number, boolean, date, json, array, reference
공식 문서: string, int, double, bool, date, object, array
→ number→int/double 분리, json→object, reference는 schema 내 패턴
```

### Filter Operators 수정
```
현재 bkit: 8개 ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin)
공식 문서: 10개 + $regex, $exists 추가
+ search/searchType 파라미터 (부분 일치 검색)
```

### API Key Format
```
접두사: ak_ + 64자 hex
저장: SHA-256 one-way hash (평문 저장 안 함)
타입: BEARER_TOKEN
생성 시 1회만 표시!
```

### Console 전용 기능 (REST API 불가)
```
- 테이블 생성/삭제: Console 또는 MCP만 가능 (REST API X)
- 환경 생성: Console 또는 MCP만 가능
- API 키 발급: Console만 가능
- RLS 정책 설정: Console만 가능
```

# Gemini CLI 최신 업데이트 심층 조사 보고서

> 작성일: 2026-03-11 | 조사 대상: Gemini CLI v0.32.x ~ v0.34.x

## 1. 버전 변경 이력 요약

| 버전 | 릴리즈일 | 유형 | 주요 변경 |
|------|---------|------|----------|
| v0.32.1 | 2026-03-04 | 안정(Stable) | 도구 스키마 업데이트, 버그 수정 |
| v0.33.0-preview.4 | 2026-03-06 | 프리뷰 | MCP v2 준비, 서브에이전트 개선 |
| v0.34.0-nightly | 2026-03-10 | 나이틀리 | 실험적 기능, 성능 최적화 |

### v0.32.x 주요 변경사항
- 도구(Tool) 스키마 파라미터 변경
- Extension 설정 파일 새 필드 추가
- 서브에이전트 시스템 강화
- Context window 관리 개선

### v0.33.x (프리뷰) 주요 변경사항
- MCP Version 2 프로토콜 준비
- 에이전트 네이티브 지원 (.gemini/agents/*.md)
- Plan 모드 개선
- 테마 시스템 추가

---

## 2. 주요 아키텍처 변경사항

### 2.1 도구(Tool) 시스템 변경

#### read_file 도구
- **라인번호 체계**: 0-기반 → **1-기반** 변경
- offset/limit 파라미터의 기본 동작 변경
- 최대 읽기 라인 수 조정

#### replace 도구
- **`allow_multiple` 파라미터 추가**: 다중 매칭 시 명시적 허용 필요
- 기존 `replace_all`과의 동작 차이 명확화

#### grep_search 도구
- **`include_pattern`으로 이름 변경**: 기존 glob 파라미터 대체
- 검색 결과 포맷 변경

### 2.2 Extension 시스템 확장

gemini-extension.json에 새 필드 추가:
- **`plan.directory`**: Plan 모드 출력 디렉토리 지정
- **`excludeTools`**: 특정 도구 비활성화
- **`themes`**: UI 테마 커스터마이징
- **`agents`**: 서브에이전트 설정

### 2.3 서브에이전트 네이티브 지원

- `.gemini/agents/*.md` 파일 기반 에이전트 정의
- 에이전트별 도구 권한, 모델 선택, 컨텍스트 설정
- `transferToAgent` / `delegateToAgent` 내장 기능

---

## 3. 새로운 기능 및 개선사항

### 3.1 Plan 모드 고도화
- Plan 디렉토리 커스텀 설정 가능
- Plan 문서 자동 생성 및 추적
- Plan-to-Execution 자동 전환

### 3.2 Memory 시스템
- GEMINI.md 기반 프로젝트 메모리
- 세션 간 컨텍스트 유지 개선
- 자동 메모리 정리 (compaction)

### 3.3 MCP 서버 연동 강화
- MCP 서버 인라인 정의 지원
- OAuth 2.1 + PKCE 인증 플로우
- 리소스 및 프롬프트 지원 확대

### 3.4 성능 최적화
- 토큰 사용량 모니터링 개선
- Context window 자동 관리
- 도구 호출 배치 처리

---

## 4. Context Engineering 변화

### 4.1 시스템 프롬프트 구조
- GEMINI.md: 프로젝트 레벨 시스템 프롬프트
- .gemini/settings.json: 전역 설정
- gemini-extension.json: 확장 설정

### 4.2 컨텍스트 주입 방식
- **SessionStart**: 세션 시작 시 초기 컨텍스트 로드
- **RuntimeHook**: 실행 중 동적 컨텍스트 주입
- **PreToolUse/PostToolUse**: 도구 사용 전후 컨텍스트 수정

### 4.3 컨텍스트 관리 변화
- 자동 컴팩션(compaction) 전략 개선
- 중요 컨텍스트 보존 우선순위
- 멀티턴 대화에서의 컨텍스트 연속성

---

## 5. Extension/Plugin 시스템 변경

### 5.1 gemini-extension.json 스키마 변화

```json
{
  "name": "extension-name",
  "version": "1.0.0",
  "description": "...",
  "tools": [...],
  "plan": {
    "directory": "docs/plans"  // NEW
  },
  "excludeTools": ["tool-name"],  // NEW
  "themes": {                      // NEW
    "default": "dark"
  },
  "agents": {                      // NEW
    "directory": "agents"
  }
}
```

### 5.2 Hook 시스템
- 기존 hook 이벤트 유지
- 새로운 이벤트 추가 가능성 (v0.33+)
- Hook 스크립트 실행 안정성 개선

### 5.3 도구 정의 방식
- JSON Schema 기반 도구 정의 유지
- 도구 파라미터 검증 강화
- 도구 설명(description) 최적화 권장

---

## 6. Breaking Changes 및 마이그레이션 필요 사항

### 🔴 즉시 대응 필요 (v0.32.x)

| 변경사항 | 영향도 | 대응 방안 |
|---------|:------:|----------|
| `read_file` 1-기반 라인번호 | 높음 | 에이전트/스킬 내 라인 참조 로직 업데이트 |
| `replace`의 `allow_multiple` | 높음 | replace 도구 사용하는 모든 에이전트 업데이트 |
| `grep_search` → `include_pattern` | 중간 | 에이전트 도구 호출 파라미터 수정 |

### 🟡 준비 필요 (v0.33.x 예정)

| 변경사항 | 영향도 | 대응 방안 |
|---------|:------:|----------|
| MCP Version 2 마이그레이션 | 높음 | MCP 서버 구성 검토 및 v2 호환성 테스트 |
| 서브에이전트 네이티브 전환 | 중간 | .gemini/agents/*.md 형식 마이그레이션 검토 |
| Plan 모드 디렉토리 설정 | 낮음 | gemini-extension.json에 plan.directory 추가 |

### 🟢 기회 영역 (선택적)

| 변경사항 | 활용 방안 |
|---------|----------|
| themes 지원 | bkit 출력 스타일과 연동 |
| excludeTools | 레벨별 도구 제한으로 안전성 강화 |
| agents 설정 | bkit 에이전트를 네이티브 형식으로 통합 |

---

## 7. bkit-gemini에 대한 영향도 분석

### 7.1 긴급 대응 (v0.32.x 호환성)

1. **도구 스키마 업데이트**: read_file, replace, grep_search 도구의 파라미터 변경에 맞게 에이전트 프롬프트 및 도구 정의 수정 필요
2. **기존 에이전트 호환성 테스트**: 16개 에이전트의 도구 사용 패턴 점검

### 7.2 중기 대응 (v0.33.x 준비)

1. **MCP v2 마이그레이션 계획**: 현재 MCP 서버 구성을 v2 스펙에 맞게 준비
2. **서브에이전트 네이티브 전환**: .gemini/agents/*.md 형식으로 에이전트 정의 마이그레이션
3. **Plan 모드 활용**: PDCA Plan 단계와 Gemini Plan 모드 통합

### 7.3 고도화 기회

1. **gemini-extension.json 확장**: 새 필드 활용으로 기능 강화
2. **테마 시스템 연동**: bkit output-styles와 Gemini themes 통합
3. **도구 제한 기능**: 레벨별 excludeTools로 초보자 보호
4. **네이티브 에이전트 통합**: bkit 에이전트 시스템을 Gemini 네이티브와 하이브리드 운영

---

> 본 보고서는 Gemini CLI 공식 GitHub 리포지토리, Google 기술 블로그, 공식 문서를 기반으로 작성되었습니다.
> 최신 나이틀리(v0.34.0) 기능은 실험적이며 변경될 수 있습니다.

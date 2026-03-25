# Gemini CLI v0.35.0 Stable + v0.36.0-preview.0 bkit 영향 분석 보고서

> 분석일: 2026-03-21 (초판) -> 2026-03-23 (2차) -> **2026-03-23 (3차 최종갱신)**
> 분석 범위: bkit v2.0.0 전체 코드베이스 (179 JS, 284 MD, 40 JSON, 9 TOML)
> 분석자: bkit-impact-analyzer agent
> 기반 Research: docs/01-plan/research/gemini-cli-v035-research.md (2026-03-23 3차 최종갱신판)

---

## Executive Summary

| 항목 | 수치 |
|------|------|
| 분석 대상 파일 | 512개 (JS 179 + MD 284 + JSON 40 + TOML 9) |
| 영향 받는 파일 | 27개 (+3) |
| Critical | 3건 (+1) |
| High | 6건 (+1) |
| Medium | 8건 |
| Low | 6건 |
| 기능 개선 기회 | 10건 (+2) |

### Critical 요약

1. ~~**version.js Feature Gate 누락**~~ -> ✅ **해결됨** (2026-03-21): 7개 v0.35.0 플래그 등록 완료
2. ~~**bkit.config.json 호환성 설정 미업데이트**~~ -> ✅ **해결됨** (2026-03-21): `testedVersions: ["0.34.0", "0.35.0"]`
3. **[P0] `modes` 값 불일치**: `policy.js` 332행의 `modes: ['plan_mode']`가 공식 문서 유효값 (`default`/`autoEdit`/`plan`/`yolo`)과 불일치. **6개 규칙 + 1 TOML 파일 + 다수 테스트 수정 필요.** (아래 Section 2 상세)
4. **[신규 P0-선행] v0.36.0 `toolName` 필수화 대비**: bkit `policy.js` TOML 생성 로직 및 기존 TOML 파일 전수 검사 완료. 현재 코드는 **모든 규칙에 `toolName` 포함** -- v0.36.0 호환. 단, `SUBAGENT_POLICY_GROUPS` 생성 시 `subagent`만 있고 `toolName` 없는 규칙 생성 가능성 **없음** 확인. (아래 Section 3 상세)

### High 요약

1. GEMINI.md `@` import 패턴과 JIT Context Loading 호환성 검증 필요
2. ~~import-resolver.js의 eager 로딩 가정~~ -> ✅ **해결됨**: JIT 캐시 TTL 30s 대응 완료
3. Hook 스크립트 프로세스 스포닝과 SandboxManager 통합 영향
4. ~~policy.js `deny_message` 미지원~~ -> ✅ **해결됨**: Starter 템플릿 활용 중. `mcpName`, `interactive` 필드는 미지원
5. BeforeAgent/AfterAgent Hook 수정사항 (#18514, #20439) 정합성 검증 필요
6. MCP FQN validation 수정 (#22069)과 bkit MCP 서버 정합성 확인
7. **[신규]** preview.3 `normalizeCommandName` 전체 경로 보존이 "allow always" `auto-saved.toml`에 미치는 영향

---

## 1. v0.35.0 Stable 영향 갱신 (preview.3~5 추가분)

### 1.1 preview.3: `normalizeCommandName` 전체 경로 보존 (PR #23558)

| 변경사항 | 영향 파일 | 영향도 | 대응 방안 |
|----------|-----------|--------|-----------|
| `normalizeCommandName`이 바이너리명만 추출하던 것에서 전체 경로 보존으로 변경. `auto-saved.toml`에 `/usr/bin/rm` 형태로 저장 | `lib/gemini/policy.js` (간접) | **High** | 아래 상세 분석 참조 |
| "allow always" 정책에 전체 경로가 저장되면 bkit `commandPrefix` 매칭 패턴과 불일치 가능 | `.gemini/policies/*.toml` | Medium | `commandPrefix` 패턴이 전체 경로와 호환되는지 검증 |
| bkit Hook 스크립트(`node ${extensionPath}/hooks/scripts/*.js`)가 경로 포함 명령으로 실행될 때 | `hooks/hooks.json` | Low | Hook은 `type: "command"`로 실행되므로 `auto-saved.toml`과 무관 |

**상세 분석**:

- **이전 동작**: 사용자가 "allow always"를 선택하면 `normalizeCommandName('rm -rf /tmp/test')` -> `'rm'`만 추출하여 `auto-saved.toml`에 `commandPrefix = "rm"` 저장
- **이후 동작**: `normalizeCommandName('/usr/bin/rm -rf /tmp/test')` -> `'/usr/bin/rm'` 전체 경로 보존하여 저장
- **bkit 영향 분석**:
  1. bkit `policy.js`의 `parsePermissionKey()`는 bkit.config.json의 `permissions` 키를 파싱하여 TOML을 **생성**하는 역할. `auto-saved.toml`을 **읽지 않음**. 따라서 bkit이 생성하는 TOML의 `commandPrefix`(예: `"rm -rf"`, `"git push --force"`)는 이 변경의 직접 영향을 받지 않음.
  2. 사용자가 "allow always"로 승인한 명령이 `auto-saved.toml`에 전체 경로로 저장되면, bkit의 `commandPrefix = "rm -rf"` deny 규칙과 **경로 부분이 일치하지 않을 수 있음**. 그러나 Gemini CLI의 정책 평가 로직은 `commandPrefix`를 명령 문자열의 **접두어**로 매칭하므로, `/usr/bin/rm -rf`는 `commandPrefix = "rm -rf"`와 직접 매칭되지 않음.
  3. **위험 시나리오**: bkit deny 규칙 `commandPrefix = "rm -rf"`가 `/usr/bin/rm -rf`를 차단하지 못할 가능성. 그러나 이는 Gemini CLI 내부의 정책 평가 엔진이 경로를 정규화한 후 매칭하는지에 따라 달라짐.

- **수정 방안**:
  1. **검증 필요**: v0.35.0 환경에서 `commandPrefix = "rm -rf"`가 `/usr/bin/rm -rf /tmp`도 차단하는지 실제 테스트
  2. **방어적 대응**: `commandPrefix`에 전체 경로 패턴도 추가 (예: `/usr/bin/rm`, `/bin/rm`)
  3. **장기 대응**: `commandRegex` 지원이 Gemini CLI에 도입되면 정규식 기반 매칭으로 전환

- **난이도**: 중간 (실제 테스트 필요)
- **예상 공수**: 2h (테스트 1h + 대응 1h)

### 1.2 preview.4: 온보딩 텔레메트리, VS Code User-Agent, 확장 자동 삭제 복구

| 변경사항 | 영향 파일 | 영향도 | 대응 방안 |
|----------|-----------|--------|-----------|
| 온보딩 텔레메트리 설정 추가 (#23118) | 없음 | Low | 자동 적용. 프라이버시 정책만 인지 필요 |
| VS Code User-Agent 통합 (#23256) | 없음 | Low | IDE 통합 시 참고용. bkit은 CLI 직접 실행 기반 |
| 확장 자동 삭제 복구 (#23317) | 없음 | Low | bkit 확장 안정성 향상. 로드 실패 시 삭제되지 않고 skip-and-log |

### 1.3 preview.5: 충돌 해결 cherry-pick

- **영향도**: Low
- bkit 직접 영향 없음. preview.4 패치의 충돌 해결.

---

## 2. P0 `modes` 값 불일치 상세 분석

### 2.1 현재 코드에서 `modes` 사용 위치 전수 목록

**policy.js 소스 코드 (6개소)**:

| # | 파일 | 행 | 현재 값 | 컨텍스트 |
|---|------|----|---------|----------|
| 1 | `lib/gemini/policy.js` | 332 | `modes: ['plan_mode']` | Starter.rules - write_file deny |
| 2 | `lib/gemini/policy.js` | 333 | `modes: ['plan_mode']` | Starter.rules - replace deny |
| 3 | `lib/gemini/policy.js` | 334 | `modes: ['plan_mode']` | Starter.rules - run_shell_command deny |
| 4 | `lib/gemini/policy.js` | 348 | `modes: ['plan_mode']` | Dynamic.rules - write_file ask_user |
| 5 | `lib/gemini/policy.js` | 349 | `modes: ['plan_mode']` | Dynamic.rules - replace ask_user |
| 6 | `lib/gemini/policy.js` | 350 | `modes: ['plan_mode']` | Dynamic.rules - run_shell_command ask_user |

**생성된 TOML 파일 (3개소)**:

| # | 파일 | 행 | 현재 값 |
|---|------|----|---------|
| 7 | `.gemini/policies/bkit-starter-policy.toml` | 64 | `modes = ["plan_mode"]` |
| 8 | `.gemini/policies/bkit-starter-policy.toml` | 70 | `modes = ["plan_mode"]` |
| 9 | `.gemini/policies/bkit-starter-policy.toml` | 76 | `modes = ["plan_mode"]` |

**테스트 코드 (참조하는 파일)**:

| # | 파일 | 참조 유형 |
|---|------|-----------|
| 10 | `tests/suites/tc80-security-v200.js` | 약 20개 `plan_mode` 문자열 매칭 (TC80-67~75) |
| 11 | `tests/suites/tc91-security-v200.js` | 약 15개 `plan_mode` 문자열 매칭 (TC91-66~75) |
| 12 | `tests/suites/tc84-gemini-policy.js` | 3개 `plan_mode` 참조 (TC84-11, TC84-12) |
| 13 | `tests/suites/tc94-config-context-eng.js` | 1개 `plan_mode` 참조 (TC94-56) |
| 14 | `tests/suites/tc80-architecture-v200.js` | 1개 `plan_mode` 참조 (SEC-07) |

**문서 (참조하는 파일)**:

| # | 파일 | 내용 |
|---|------|------|
| 15 | 다수 design/plan/report 문서 | `plan_mode` 값을 기술하는 설계/분석 문서 |

### 2.2 공식 유효값 대조 결과

| bkit 현재 값 | Gemini CLI 공식 유효값 | 매칭 여부 |
|-------------|----------------------|----------|
| `plan_mode` | `default` | X |
| `plan_mode` | `autoEdit` | X |
| `plan_mode` | `plan` | **X (유사하나 불일치)** |
| `plan_mode` | `yolo` | X |

**결론**: bkit이 사용하는 `plan_mode`는 공식 유효값 어디에도 포함되지 않음. 올바른 값은 `plan`.

**위험도 분석**:
- Gemini CLI v0.34.0까지: `modes` 필드의 값에 대한 strict validation이 없었을 가능성 있음 (undocumented 동작)
- Gemini CLI v0.35.0+: `modes` 필드가 공식 문서화되면서 validation이 추가되었을 가능성 높음
- **최악의 경우**: `plan_mode`가 인식되지 않아 해당 규칙이 **모든 모드에 적용**되거나 **어떤 모드에서도 적용되지 않음** -> Starter 레벨의 Plan Mode 보안 정책 무효화

### 2.3 수정 방안 (코드 diff 수준)

**Step 1: `lib/gemini/policy.js` - 6개소 수정**

```diff
// Line 332-334 (Starter template)
-      { toolName: 'write_file', modes: ['plan_mode'], decision: 'deny', priority: 110, deny_message: 'Writing code is not allowed in Plan Mode.' },
-      { toolName: 'replace', modes: ['plan_mode'], decision: 'deny', priority: 110, deny_message: 'Modifying code is not allowed in Plan Mode.' },
-      { toolName: 'run_shell_command', modes: ['plan_mode'], decision: 'deny', priority: 110, deny_message: 'Running shell commands is not allowed in Plan Mode.' }
+      { toolName: 'write_file', modes: ['plan'], decision: 'deny', priority: 110, deny_message: 'Writing code is not allowed in Plan Mode.' },
+      { toolName: 'replace', modes: ['plan'], decision: 'deny', priority: 110, deny_message: 'Modifying code is not allowed in Plan Mode.' },
+      { toolName: 'run_shell_command', modes: ['plan'], decision: 'deny', priority: 110, deny_message: 'Running shell commands is not allowed in Plan Mode.' }

// Line 348-350 (Dynamic template)
-      { toolName: 'write_file', modes: ['plan_mode'], decision: 'ask_user', priority: 60 },
-      { toolName: 'replace', modes: ['plan_mode'], decision: 'ask_user', priority: 60 },
-      { toolName: 'run_shell_command', modes: ['plan_mode'], decision: 'ask_user', priority: 60 }
+      { toolName: 'write_file', modes: ['plan'], decision: 'ask_user', priority: 60 },
+      { toolName: 'replace', modes: ['plan'], decision: 'ask_user', priority: 60 },
+      { toolName: 'run_shell_command', modes: ['plan'], decision: 'ask_user', priority: 60 }
```

**Step 2: `.gemini/policies/bkit-starter-policy.toml` - 3개소 수정 (재생성)**

```diff
 # --- Plan Mode Restrictions (v2.0.0, SEC-08) ---
-# During plan_mode, code writing is denied for Starter level
+# During plan mode, code writing is denied for Starter level

 [[rule]]
 toolName = "write_file"
-modes = ["plan_mode"]
+modes = ["plan"]
 decision = "deny"
 priority = 110

 [[rule]]
 toolName = "replace"
-modes = ["plan_mode"]
+modes = ["plan"]
 decision = "deny"
 priority = 110

 [[rule]]
 toolName = "run_shell_command"
-modes = ["plan_mode"]
+modes = ["plan"]
 decision = "deny"
 priority = 110
```

**Step 3: 테스트 코드 - 전체 `plan_mode` -> `plan` 치환**

| 파일 | 변경 수 | 방법 |
|------|---------|------|
| `tests/suites/tc80-security-v200.js` | ~20개소 | `plan_mode` -> `plan` (문자열 리터럴) |
| `tests/suites/tc91-security-v200.js` | ~15개소 | `plan_mode` -> `plan` (문자열 리터럴) |
| `tests/suites/tc84-gemini-policy.js` | ~3개소 | `plan_mode` -> `plan` (문자열 리터럴) |
| `tests/suites/tc94-config-context-eng.js` | ~1개소 | `plan_mode` -> `plan` |
| `tests/suites/tc80-architecture-v200.js` | ~1개소 | `plan_mode` -> `plan` |

**난이도**: 낮음 (기계적 치환)
**예상 공수**: 1h (코드 수정 20분 + TOML 재생성 10분 + 테스트 수정 30분)

**주의**: `enter_plan_mode`, `exit_plan_mode`는 **도구 이름**이므로 수정 대상이 아님. `modes` 필드의 **값**으로 사용되는 `plan_mode`만 `plan`으로 변경.

---

## 3. v0.36.0 `toolName` 필수화 선행 분석

### 3.1 Breaking Change 요약

| 항목 | 내용 |
|------|------|
| PR | [#23330](https://github.com/google-gemini/gemini-cli/pull/23330) |
| 이전 동작 | `toolName` 생략 시 모든 도구에 암묵적 적용 |
| 이후 동작 | `toolName` 명시 필수. 전체 매칭은 `toolName = "*"` 사용 |
| 적용 버전 | v0.36.0-preview.0 |

### 3.2 policy.js의 `toolName` 포함 여부 전수 검사

#### 3.2.1 `convertToToml()` (Line 100-183) -- 동적 생성

`parsePermissionKey(key)` -> `{ tool, pattern }` -> `rule.toolName = tool`

- Line 122: `const rule = { toolName: tool, decision, priority };` -- **항상 `toolName` 포함**
- Line 138, 157, 173: `lines.push(\`toolName = "${escapeTomlString(rule.toolName)}"\`);` -- **3개 분기 모두 출력**

**결론**: `convertToToml()`에서 생성되는 모든 규칙은 `toolName`을 반드시 포함. v0.36.0 호환.

#### 3.2.2 `LEVEL_POLICY_TEMPLATES` (Line 317-364) -- 정적 템플릿

| 레벨 | 규칙 수 | toolName 포함 여부 |
|------|---------|-------------------|
| Starter | 13개 | 13/13 모두 `toolName` 명시 |
| Dynamic | 10개 | 10/10 모두 `toolName` 명시 |
| Enterprise | 5개 | 5/5 모두 `toolName` 명시 |

**결론**: 모든 정적 템플릿이 `toolName`을 명시적으로 포함. v0.36.0 호환.

#### 3.2.3 `generateLevelPolicy()` (Line 374-443) -- 레벨 정책 생성

- Line 411: `lines.push(\`toolName = "${escapeTomlString(rule.toolName)}"\`);` -- **항상 출력**

**결론**: v0.36.0 호환.

#### 3.2.4 `SUBAGENT_POLICY_GROUPS` (Line 277-311) -- 서브에이전트 정책

| Tier | 규칙 | toolName 포함 여부 |
|------|------|-------------------|
| readonly | 3개 (`run_shell_command`, `write_file`, `replace`) | 3/3 모두 `toolName` 명시 |
| docwrite | 1개 (`run_shell_command`) | 1/1 `toolName` 명시 |
| full | 2개 (`run_shell_command` x2) | 2/2 모두 `toolName` 명시 |

**결론**: 서브에이전트 정책도 모두 `toolName` 포함. v0.36.0 호환.

#### 3.2.5 `generateSubagentRules()` (Line 449-466) -- 서브에이전트 TOML 생성

- Line 458: `lines.push(\`toolName = "${escapeTomlString(rule.toolName)}"\`);` -- **항상 출력**
- `subagent` 필드와 함께 `toolName`도 항상 포함

**결론**: v0.36.0 호환.

#### 3.2.6 `generateExtensionPolicy()` (Line 475-541) -- 확장 정책 (하드코딩)

```
Line 498: 'toolName = "run_shell_command"'  -- 포함
Line 504: 'toolName = "run_shell_command"'  -- 포함
Line 510: 'toolName = "run_shell_command"'  -- 포함
Line 516: 'toolName = "run_shell_command"'  -- 포함
```

**결론**: 확장 정책의 4개 하드코딩 규칙 모두 `toolName` 포함. v0.36.0 호환.

### 3.3 생성된 TOML 파일 전수 검사

| 파일 | `[[rule]]` 수 | `toolName` 수 | 일치 여부 |
|------|-------------|-------------|----------|
| `policies/bkit-extension-policy.toml` | 4 | 4 | 일치 |
| `.gemini/policies/bkit-starter-policy.toml` | 13 | 13 | 일치 |
| `.gemini/policies/bkit-permissions.toml` | 19 | 19 | 일치 |
| **합계** | **36** | **36** | **100% 일치** |

### 3.4 v0.36.0 대비 종합 판정

| 검증 항목 | 상태 | 비고 |
|-----------|------|------|
| `convertToToml()` 동적 생성 | **v0.36.0 호환** | `toolName` 항상 포함 |
| `LEVEL_POLICY_TEMPLATES` 정적 템플릿 | **v0.36.0 호환** | 28개 규칙 모두 포함 |
| `SUBAGENT_POLICY_GROUPS` 정적 정의 | **v0.36.0 호환** | 6개 규칙 모두 포함 |
| `generateExtensionPolicy()` 하드코딩 | **v0.36.0 호환** | 4개 규칙 모두 포함 |
| `generateSubagentRules()` 생성기 | **v0.36.0 호환** | 생성 루프에서 항상 출력 |
| 기존 TOML 파일 | **v0.36.0 호환** | 36/36 규칙 모두 포함 |

**종합 결론**: bkit의 현재 policy.js 코드와 생성된 TOML 파일은 **v0.36.0 `toolName` 필수화에 대해 100% 호환**됩니다. `toolName`이 누락된 규칙은 코드베이스 전체에서 단 하나도 발견되지 않았습니다.

**향후 대비 권장사항**:
1. `validateTomlStructure()` (Line 24-43)에 `toolName` 필수 검증 추가 -- v0.36.0에서의 validation 실패를 사전 방지
2. 와일드카드 매칭이 필요한 경우를 대비하여 `toolName = "*"` 패턴 지원 추가 고려

```javascript
// validateTomlStructure() 에 추가 권장
// v0.36.0+ toolName 필수 검증
const rules = tomlContent.match(/\[\[rule\]\]/g);
const toolNames = tomlContent.match(/toolName\s*=/g);
if (rules && toolNames && rules.length !== toolNames.length) {
  return false; // toolName 누락된 규칙 존재
}
```

---

## 4. 전체 영향도 매트릭스 (2026-03-23 3차 갱신)

### 4.1 v0.35.0 Breaking Changes 영향

| # | 이슈 | 영향도 | 상태 | 대응 |
|---|------|--------|------|------|
| BC-1 | JIT Context Loading 기본화 (#22736) | High | 일부 완료 | import-resolver TTL 30s 완료. `@import` 통합 테스트 미완 |
| BC-2 | SandboxManager 통합 (#22231) | Medium | 미착수 | macOS 영향 미미. Linux 환경 테스트 필요 |
| BC-3 | CoreToolScheduler 제거 (#21955) | Low | 대응 불필요 | 내부 변경, bkit 비의존 |
| BC-4 | **[신규]** `normalizeCommandName` 전체 경로 보존 (#23558) | **High** | 미착수 | `commandPrefix` 패턴과 전체 경로 매칭 검증 필요 |
| BC-5 | **[신규]** 확장 자동 삭제 복구 (#23317) | Low | 대응 불필요 | bkit 확장 안정성 향상 |

### 4.2 P0 이슈

| # | 이슈 | 영향도 | 상태 | 영향 파일 수 | 대응 |
|---|------|--------|------|------------|------|
| P0-1 | `modes` 값 불일치 (`plan_mode` -> `plan`) | **Critical** | 미착수 | **JS 6 + TOML 3 + 테스트 ~40 + 문서 ~10 = ~59개소** | Section 2 참조 |
| P0-2 | v0.36.0 `toolName` 필수화 대비 | **Critical (선행)** | **검증 완료** | 0 (호환 확인) | 현재 코드 100% 호환. 방어적 validation 추가 권장 |

### 4.3 lib/gemini/ 모듈별 영향

| 파일 | 영향 항목 | 영향도 | 상태 |
|------|-----------|--------|------|
| `version.js` | ~~Feature Gate 추가~~ | ~~Critical~~ | ✅ 완료 |
| `import-resolver.js` | ~~JIT 캐시 TTL 대응~~ | ~~High~~ | ✅ 완료 |
| `policy.js` | `modes` 값 수정 + `normalizeCommandName` 영향 검증 | **Critical + High** | 미착수 |
| `hooks.js` | BeforeAgent/AfterAgent 수정사항 | High | 미착수 |
| `tools.js` | v0.35.0 새 도구 확인 | Medium | 미착수 |
| `context-fork.js` | JIT 환경 snapshot 타이밍 | Medium | 미착수 |
| `tracker.js` | 영향 없음 | Low | 확인 완료 |
| `platform.js` | 영향 없음 | Low | 확인 완료 |

### 4.4 설정/정책 파일

| 파일 | 영향 항목 | 영향도 | 상태 |
|------|-----------|--------|------|
| `bkit.config.json` | ~~호환성 업데이트~~ | ~~Critical~~ | ✅ 완료 |
| `.gemini/policies/bkit-starter-policy.toml` | `modes = ["plan_mode"]` -> `["plan"]` | **Critical** | 미착수 (P0-1 연동) |
| `.gemini/policies/bkit-permissions.toml` | `deny_message` 추가 기회 | Medium | 미착수 |
| `policies/bkit-extension-policy.toml` | `deny_message` 추가 기회 | Medium | 미착수 |

### 4.5 스크립트/Hook

| 파일 | 영향 항목 | 영향도 |
|------|-----------|--------|
| `session-start.js` | JIT 환경 Phase-Aware Context | Medium |
| `before-agent.js` | v0.35.0 event 구조 | Medium |
| `before-tool-selection.js` | 도구 격리 상호작용 | Medium |
| `before-tool.js` | SandboxManager + `normalizeCommandName` | Medium |
| `after-agent.js` | AfterAgent lifecycle | Medium |
| `pre-compress.js` | JIT 스냅샷 | Medium |

---

## 5. 스킬 영향 분석

| 스킬 | 영향 항목 | 영향도 | 대응 방안 |
|------|-----------|--------|-----------|
| `gemini-cli-learning` | SKILL.md의 Hook/Extension 가이드가 v0.34.0 기준 | Low | v0.35.0 JIT Context, SandboxManager, 키바인딩 내용 추가 |
| `pdca` | Phase-Aware Context Loading이 JIT와 상호작용 | Medium | session-start hook의 phase context 주입이 JIT 환경에서 정상 동작하는지 검증 |
| `starter` | 영향 없음 | Low | - |
| `dynamic` | 영향 없음 | Low | - |
| `enterprise` | `disableAlwaysAllow` 설정을 활용한 보안 강화 가능 | Low | v0.35.0 Enterprise 보안 설정 가이드 추가 기회 |
| `code-review` | 병렬 도구 스케줄러로 성능 개선 가능 | Low | 자동 적용 (CLI 내부) |
| `zero-script-qa` | 영향 없음 | Low | - |
| 기타 28개 스킬 | 직접 영향 없음 | Low | - |

---

## 6. 에이전트 영향 분석

| 에이전트 | 영향 항목 | 영향도 | 대응 방안 |
|----------|-----------|--------|-----------|
| 전체 21개 에이전트 | 서브에이전트 도구 격리 (v0.35.0 신규) | Medium | MCP spawn-agent-server가 도구 격리 환경에서 정상 동작하는지 검증 |
| `cto-lead` | CTO orchestrator가 spawn하는 서브에이전트에 도구 격리 적용 | Medium | spawn-agent-server의 approval mode 로직이 격리 환경에서도 유효한지 확인 |
| `gap-detector` | read-only tier (READONLY) 에이전트가 격리 환경에서 읽기 도구 정상 사용 | Low | SAFETY_TIERS.READONLY 에이전트는 읽기 도구만 사용하므로 격리 영향 최소 |
| `pdca-iterator` | full-access tier (FULL) 에이전트가 격리 환경에서 쓰기 도구 접근 | Medium | SAFETY_TIERS.FULL 에이전트의 도구 접근 검증 필요 |
| `report-generator` | DOCWRITE tier 에이전트 | Low | 문서 쓰기만 수행하므로 영향 미미 |

---

## 7. 철학 정합성 검증 결과

| 원칙 | 문서 | 정합 | 비고 |
|------|------|------|------|
| **Automation First** | core-mission.md | 유지 | JIT Context Loading은 bkit 자동 PDCA에 영향 없음. preview.3 경로 보존도 자동화에 영향 없음 |
| **No Guessing** | core-mission.md | 유지 | P0 `modes` 값 불일치는 "추측"이 아닌 "공식 문서 대조"로 발견. 불확실 항목은 "검증 필요" 표시 |
| **Docs = Code** | core-mission.md | **주의** | `modes: ['plan_mode']`가 공식 문서와 불일치하는 상태가 코드/TOML 양쪽에 존재. 수정 시 양쪽 동기화 필수 |
| **AI as Partner** | ai-native-principles.md | 유지 | v0.35.0 병렬 스케줄러 + CJK 개선은 AI 파트너 역할 강화 |
| **Context Engineering** | context-engineering.md | **주의** | JIT Context Loading이 6-Layer L1 로딩 타이밍에 영향. preview.3 경로 보존이 정책(L2) 매칭에 간접 영향 |
| **PDCA Methodology** | pdca-methodology.md | 유지 | PDCA 사이클 핵심 기능에 영향 없음 |

---

## 8. 기능 개선 기회

| # | 새 CLI 기능 | bkit 활용 방안 | 예상 효과 | 우선순위 | 난이도 |
|---|-------------|---------------|----------|---------|--------|
| 1 | **JIT Context Loading** | Phase-Aware Context를 GEMINI.md `@` import로 분리하여 JIT 활용 | 초기 세션 시작 속도 20-30% 개선 예상 | P1 | 중간 |
| 2 | **서브에이전트 도구 격리** | spawn-agent-server의 SAFETY_TIERS를 CLI 네이티브 도구 격리로 보강 | 보안 심층 방어 (Defense in Depth) | P2 | 중간 |
| 3 | **`deny_message` TOML 필드** | bkit 정책 거부 시 한국어/영어 커스텀 메시지 제공 | 사용자 경험 대폭 개선, 특히 Starter 레벨 | P1 | 낮음 |
| 4 | **`--admin-policy` 플래그** | Enterprise 레벨에서 조직 전체 보안 정책을 bkit 확장과 별도로 관리 | Enterprise 채택 촉진 | P2 | 중간 |
| 5 | **`disableAlwaysAllow` 설정** | Starter 레벨 기본 활성화로 초보자 보호 | Starter 안전성 강화 | P1 | 낮음 |
| 6 | **병렬 도구 스케줄러** | bkit의 batch skill과 결합하여 다중 파일 분석 병렬 실행 | 분석 에이전트 속도 2-5배 개선 가능 | P2 | 낮음 (자동 적용) |
| 7 | **커스텀 키바인딩** | bkit 전용 단축키 번들 제공 | 파워 유저 UX 향상 | P3 | 낮음 |
| 8 | **CJK 입력 지원 개선** | 한국어 사용자를 위한 8-language trigger 패턴의 안정성 향상 | 한국어 사용자 경험 안정화 | P1 | 없음 (CLI 자동 적용) |
| 9 | **[신규] `commandPrefix` 경로 패턴 확장** | preview.3 전체 경로 보존에 대응하여, deny 규칙에 경로 변형 패턴 추가 | 보안 정책 우회 방지 | P1 | 중간 |
| 10 | **[신규] `toolName` 필수 사전 validation** | v0.36.0 대비 `validateTomlStructure()`에 toolName 필수 검증 추가 | v0.36.0 마이그레이션 비용 제로화 | P2 | 낮음 |

---

## 9. 구현 우선순위 매트릭스 (2026-03-23 3차 갱신)

| 우선순위 | 항목 | 이유 | 예상 공수 | 상태 |
|---------|------|------|----------|------|
| ~~P0~~ | ~~version.js Feature Gate 추가~~ | ~~전제 조건~~ | ~~0.5h~~ | ✅ 완료 |
| ~~P0~~ | ~~bkit.config.json 호환성 업데이트~~ | ~~Docs = Code~~ | ~~0.5h~~ | ✅ 완료 |
| **P0** | **`modes` 값 수정 (`plan_mode` -> `plan`)** | 정책 무효화 위험 (SEC-08) | 1h | 미착수 |
| **P0** | **v0.36.0 `toolName` 필수화 검증** | 선행 대비 | 0h | ✅ 검증 완료 (호환) |
| **P1** | `normalizeCommandName` 전체 경로 영향 테스트 (#23558) | commandPrefix 보안 정책 우회 위험 | 2h | 미착수 |
| **P1** | GEMINI.md `@` import JIT 호환성 검증 | 컨텍스트 로딩의 핵심 경로 | 2h | 미착수 |
| ~~P1~~ | ~~import-resolver.js JIT 모드 대응~~ | ~~캐시 전략~~ | ~~2h~~ | ✅ 완료 |
| ~~P1~~ | ~~policy.js `deny_message` 지원~~ | ~~UX 개선~~ | ~~1h~~ | ✅ 완료 |
| **P1** | hooks.js BeforeAgent/AfterAgent 검증 (#18514, #20439) | Hook 라이프사이클 일관성 | 2h | 미착수 |
| **P1** | context-fork.js JIT 환경 동작 검증 | 컨텍스트 포크 일관성 | 1h | 미착수 |
| **P2** | policy.js `mcpName` 필드 지원 추가 | 공식 권장 (FQN 대체) | 2h | 미착수 |
| **P2** | policy.js `interactive` 필드 지원 | CI/CD 정책 분리 | 1h | 미착수 |
| **P2** | `validateTomlStructure()` toolName 필수 검증 추가 | v0.36.0 사전 대비 | 0.5h | 미착수 |
| **P2** | spawn-agent-server SandboxManager 대응 | 서브에이전트 실행 안정성 | 2h | 미착수 |
| **P2** | 테스트 스위트 tc82/tc84 확장 | v0.35.0 회귀 방지 | 4h | 미착수 |
| **P3** | `disableAlwaysAllow` Starter 기본 정책 | 초보자 보호 | 1h | 미착수 |
| **P3** | 커스텀 키바인딩 번들 생성 | 파워 유저 UX | 1h | 미착수 |
| **P3** | pre-compress.js JIT 스냅샷 검증 | context preservation | 1h | 미착수 |

### 총 예상 공수 (3차 갱신)

| 분류 | 항목 수 | 완료 | 잔여 공수 |
|------|---------|------|----------|
| P0 (즉시) | 4건 | 3건 ✅ | **1h** |
| P1 (v0.35.0 Stable 대비) | 6건 | 2건 ✅ | **7h** |
| P2 (기능 고도화) | 5건 | 0건 | **9.5h** |
| P3 (개선 기회) | 3건 | 0건 | **3h** |
| **합계** | **18건** | **5건 ✅** | **20.5h** |

---

## 10. bkit 코드베이스 준비도 (3차 갱신)

| 항목 | 상태 | 완료율 | 비고 |
|------|------|--------|------|
| version.js Feature Gate | ✅ 완료 | 100% | 7개 v0.35.0 플래그 등록 |
| bkit.config.json 호환성 | ✅ 완료 | 100% | testedVersions 갱신 |
| import-resolver.js JIT 대응 | ✅ 완료 | 100% | 캐시 TTL 30s 분기 |
| policy.js deny_message | ✅ 완료 | 100% | Starter 템플릿 활용 |
| **policy.js modes 값 수정** | 미착수 | **0%** | **P0 - 즉시 수정 필요** |
| v0.36.0 toolName 필수화 | ✅ 검증 완료 | **100%** | 현재 코드 호환 확인 |
| normalizeCommandName 영향 | 미착수 | 0% | P1 - 테스트 필요 |
| Hook lifecycle 검증 | 미착수 | 0% | P1 - 실제 테스트 필요 |
| JIT Context 통합 테스트 | 미착수 | 0% | P1 - 실제 테스트 필요 |
| mcpName / interactive 지원 | 미착수 | 0% | P2 |
| 테스트 스위트 확장 | 미착수 | 0% | P2 |

### 종합 준비도: **5/11 항목 완료 (45%)**

---

## 11. 마이그레이션 타임라인 제안 (3차 갱신)

```
2026-03-21 (완료)  : Wave 1 - version.js, bkit.config.json
2026-03-22 (완료)  : Wave 2 일부 - import-resolver.js, policy.js deny_message
2026-03-23 (완료)  : 영향 분석 3차 갱신 + v0.36.0 toolName 검증
2026-03-24 (예정)  : v0.35.0 Stable 릴리스
2026-03-24~25      : Wave 3 - P0 modes 수정 (1h) + TOML 재생성 + 테스트 수정
2026-03-25~26      : Wave 4 - normalizeCommandName 영향 테스트, JIT 통합 테스트
2026-03-27~28      : Wave 5 - Hook lifecycle 검증, mcpName/interactive
2026-03-29         : Wave 6 - SandboxManager, 테스트 스위트 확장
2026-03-30         : P3 + 전체 회귀 테스트
2026-03-31         : v0.35.0 호환 완료, CHANGELOG 업데이트
```

---

## 12. 알려진 이슈 (3차 갱신)

| # | 이슈 | 심각도 | bkit 영향 | 상태 |
|---|------|--------|-----------|------|
| 1 | surrogate pair 처리 수정 (#22754) | 중간 | CJK 문자열 truncation | v0.35.0에서 수정됨 |
| 2 | MCP FQN validation 수정 (#22069) | 높음 | bkit MCP 서버 연동 안정성 | v0.35.0에서 수정됨, 검증 필요 |
| 3 | AfterAgent stopHookActive 전파 (#20439) | 높음 | bkit Hook 재시도 로직 | v0.35.0에서 수정됨, 검증 필요 |
| 4 | JIT Context git root traversal (#23074) | 높음 | 비-root 위치 bkit 프로젝트 | v0.35.0-preview.2에서 수정됨 |
| 5 | **[신규]** normalizeCommandName 경로 보존 (#23558) | 중간 | commandPrefix 매칭 동작 변경 | v0.35.0-preview.3에서 변경. 영향 테스트 필요 |
| 6 | **[신규]** v0.36.0 toolName 필수화 (#23330) | **높음 (선행)** | 현재 코드 호환 확인됨 | v0.36.0-preview.0. 방어적 validation 추가 권장 |

---

## Appendix A: 분석 대상 파일 전체 목록

### 영향 받는 파일 (27개, +3)

| # | 파일 | 영향도 | 영향 항목 |
|---|------|--------|-----------|
| 1 | ~~`lib/gemini/version.js`~~ | ~~Critical~~ | ✅ 완료 |
| 2 | ~~`bkit.config.json`~~ | ~~Critical~~ | ✅ 완료 |
| 3 | `lib/gemini/policy.js` | **Critical** | `modes` 값 수정 (6개소) |
| 4 | `.gemini/policies/bkit-starter-policy.toml` | **Critical** | `modes` 값 수정 (3개소) |
| 5 | `GEMINI.md` | High | `@` import JIT 호환성 |
| 6 | `lib/gemini/import-resolver.js` | ~~High~~ | ✅ 완료 |
| 7 | `lib/gemini/hooks.js` | High | BeforeAgent/AfterAgent 수정 |
| 8 | `hooks/scripts/before-agent.js` | Medium | event 구조 변경 가능 |
| 9 | `hooks/scripts/session-start.js` | Medium | JIT 환경 Phase-Aware Context |
| 10 | `hooks/scripts/before-tool-selection.js` | Medium | 도구 격리 상호작용 |
| 11 | `hooks/scripts/before-tool.js` | Medium | SandboxManager + normalizeCommandName 영향 |
| 12 | `hooks/scripts/after-agent.js` | Medium | AfterAgent lifecycle |
| 13 | `hooks/scripts/pre-compress.js` | Medium | JIT 스냅샷 |
| 14 | `mcp/spawn-agent-server.js` | Medium | SandboxManager, 도구 격리 |
| 15 | `lib/gemini/context-fork.js` | Medium | JIT 타이밍 |
| 16 | `lib/gemini/tools.js` | Medium | 새 도구 추가 확인 |
| 17 | `policies/bkit-extension-policy.toml` | Medium | `deny_message` 추가 |
| 18 | `.gemini/policies/bkit-permissions.toml` | Medium | 신규 필드 재생성 |
| 19 | `tests/suites/tc82-gemini-version.js` | High | v0.35.0 TC 추가 |
| 20 | `tests/suites/tc84-gemini-policy.js` | Medium | `plan_mode` -> `plan` + 신규 필드 TC |
| 21 | `tests/suites/tc80-security-v200.js` | High | `plan_mode` -> `plan` (~20개소) |
| 22 | `tests/suites/tc91-security-v200.js` | High | `plan_mode` -> `plan` (~15개소) |
| 23 | `tests/suites/tc94-config-context-eng.js` | Medium | `plan_mode` -> `plan` (1개소) |
| 24 | `tests/suites/tc80-architecture-v200.js` | Medium | `plan_mode` -> `plan` (1개소) |
| 25 | `skills/gemini-cli-learning/SKILL.md` | Low | 콘텐츠 업데이트 |
| 26 | `.gemini/context/tool-reference-v2.md` | Low | v0.35.0 도구 변경 반영 |
| 27 | `README.md` | Low | 지원 버전 뱃지 업데이트 |

### 영향 없음 확인 파일

- `lib/gemini/platform.js`: 환경변수/경로 감지만 수행, CLI 내부 변경 무관
- `lib/gemini/tracker.js`: Task Tracker API 변경 없음
- `hooks/hooks.json`: 구조적 변경 없음 (hook event 이름 동일)
- `gemini-extension.json`: 매니페스트 스키마 변경 없음
- `agents/*.md` (21개): 선언적 정의, CLI API 비의존
- `skills/*/SKILL.md` (33개, gemini-cli-learning 제외): 선언적 정의
- `lib/core/*`, `lib/pdca/*`, `lib/intent/*`, `lib/task/*`, `lib/team/*`: Gemini CLI 비의존 순수 로직

---

*bkit-impact-analyzer agent | 2026-03-23 (3차 최종갱신)*
*Analysis based on gemini-cli-v035-research.md (3차 최종갱신판) and full codebase scan*
*v0.36.0-preview.0 선행 분석 포함*

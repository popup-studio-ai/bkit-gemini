# bkit v1.5.7 Documentation Synchronization Design Document

> **Summary**: bkit v1.5.7 릴리즈 후 문서 동기화 작업의 상세 설계
>
> **Project**: bkit-gemini (Vibecoding Kit - Gemini CLI Edition)
> **Version**: v1.5.7
> **Author**: Claude Opus 4.6
> **Date**: 2026-03-04
> **Status**: Final
> **Plan Reference**: `docs/01-plan/features/bkit-v157-doc-sync.plan.md`

---

## 1. Design Overview

### 1.1 Scope Summary

v1.5.7 구현 및 테스트 완료 후 문서 동기화 작업. 코드 변경 없이 **문서/설정/상태 파일만 수정**.

### 1.2 Design Principles

1. **Zero Code Change**: 코드 파일(.js)은 수정하지 않음 (이미 완료)
2. **Grep-Driven Audit**: 모든 불일치를 grep으로 체계적 탐색
3. **Archive Before Update**: PDCA 상태 변경 전 완료 피처 아카이브
4. **Cross-Reference Verify**: 동일 수치가 여러 문서에 나올 때 교차 검증

---

## 2. DS-01: PDCA 상태 정리

### 2.1 Current State

```json
// .pdca-status.json (현재)
{
  "primaryFeature": "bkit-v157-comprehensive-test",
  "activeFeatures": {
    "bkit-v157-comprehensive-test": { "phase": "design", "matchRate": null },
    "gemini-cli-032-migration": { "phase": "completed", "matchRate": 100 },
    "bkit-gemini-comprehensive-test": { "phase": "completed", "matchRate": 100 }
  }
}
```

### 2.2 Target State

```json
// .pdca-status.json (목표)
{
  "primaryFeature": "bkit-v157-doc-sync",
  "activeFeatures": {
    "bkit-v157-doc-sync": {
      "phase": "design",
      "matchRate": null,
      "lastUpdated": "2026-03-04T00:00:00Z",
      "documents": {
        "plan": "docs/01-plan/features/bkit-v157-doc-sync.plan.md",
        "design": "docs/02-design/features/bkit-v157-doc-sync.design.md"
      }
    },
    "bkit-v157-comprehensive-test": {
      "phase": "completed",
      "matchRate": 100,
      "lastUpdated": "2026-03-04T00:00:00Z",
      "completedAt": "2026-03-04T00:00:00Z",
      "documents": {
        "plan": "docs/01-plan/features/bkit-v157-comprehensive-test.plan.md",
        "design": "docs/02-design/features/bkit-v157-comprehensive-test.design.md",
        "report": "docs/04-report/features/bkit-v157-comprehensive-test.report.md"
      }
    }
  },
  "archivedFeatures": {
    "gemini-cli-032-migration": {
      "phase": "archived",
      "matchRate": 100,
      "archivedAt": "2026-03-04T00:00:00Z",
      "archivedTo": "docs/archive/2026-03/gemini-cli-032-migration/"
    },
    "bkit-gemini-comprehensive-test": {
      "phase": "archived",
      "matchRate": 100,
      "archivedAt": "2026-03-04T00:00:00Z",
      "archivedTo": "docs/archive/2026-02/bkit-gemini-comprehensive-test/"
    },
    // ... 기존 archivedFeatures 유지
  }
}
```

### 2.3 Action Items

1. `bkit-v157-comprehensive-test` → phase: "completed", Report 문서 생성 후 상태 갱신
2. `gemini-cli-032-migration` → archivedFeatures로 이동, docs/archive/2026-03/ 아래 아카이브
3. `bkit-gemini-comprehensive-test` → archivedFeatures로 이동 (이미 완료 상태)
4. `bkit-v157-doc-sync` → 신규 activeFeature 등록
5. `primaryFeature` → "bkit-v157-doc-sync"로 변경

---

## 3. DS-02: 테스트 Report 생성

### 3.1 Target File

`docs/04-report/features/bkit-v157-comprehensive-test.report.md`

### 3.2 Report Structure

```markdown
# bkit v1.5.7 Comprehensive Test Report

## 1. Overview
- Test Date: 2026-03-04
- bkit Version: v1.5.7
- Gemini CLI Target: v0.29.0 ~ v0.32.1
- Total Test Suites: 24 (TC-01 ~ TC-24)
- Result: ALL PASS

## 2. Test Coverage Matrix
| Suite | Category | Test Cases | Result |
|-------|----------|------------|--------|
| TC-01 | Hooks | Hook event registration, lifecycle | PASS |
| TC-04 | Lib Modules | Adapter modules, core libraries | PASS |
| TC-07 | Config | bkit.config.json, gemini-extension.json | PASS |
| TC-09 | PDCA E2E | PDCA cycle end-to-end | PASS |
| TC-17 | v0.30 Phase2 | Policy Engine, version detection | PASS |
| TC-18 | v0.31 Features | Tool annotations, feature flags | PASS |
| TC-19 | v0.31 Policy | Level policy, hook adapter | PASS |
| TC-21 | v0.32 Migration | 23 tools, tracker annotations, flags | PASS |
| TC-22 | PDCA Status Path | Root vs legacy path handling | PASS |
| TC-23 | Tracker Bridge | Availability, epic, sync, viz | PASS |
| TC-24 | Runtime Hooks | SDK registration, handler, migration | PASS |

## 3. v1.5.7 Feature Verification Summary
(각 WS별 구현 완료 확인)

## 4. Quality Metrics
- Match Rate: 100%
- Regression: 0 failures
- New Tests: 4 suites (TC-21 ~ TC-24)

## 5. Conclusion
v1.5.7 릴리즈 준비 완료
```

### 3.3 Content Sources

- `tests/run-all.js` 실행 결과
- `docs/04-report/features/gemini-cli-032-migration.report.md` (구현 보고서)
- `docs/02-design/features/bkit-v157-comprehensive-test.design.md` (테스트 설계)

---

## 4. DS-03: CHANGELOG.md 링크 추가

### 4.1 Current State

```markdown
## [1.5.7] - 2026-03-04
... (content exists)

---

[1.5.6]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.5...v1.5.6
```

### 4.2 Target State

```markdown
---

[1.5.7]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.6...v1.5.7
[1.5.6]: https://github.com/popup-studio-ai/bkit-gemini/compare/v1.5.5...v1.5.6
```

### 4.3 Action

CHANGELOG.md 하단 링크 섹션에 `[1.5.7]` compare 링크 추가.

---

## 5. DS-04: README.md 세부 검증

### 5.1 Verification Checklist

| Section | Check Item | Expected Value | Source of Truth |
|---------|-----------|----------------|-----------------|
| Badge | Gemini CLI version range | v0.29.0~v0.32.1 | bkit.config.json |
| Badge | Version | 1.5.7 | bkit.config.json |
| Architecture | State Management count | 17 + 6 | hooks/scripts/ + lib/ |
| v1.5.7 Highlights | Tool count | 23 | tool-registry.js |
| v1.5.7 Highlights | Feature flags | 11 new | version-detector.js |
| Component Map | gemini-extension.json description | v1.5.7 | 실제 파일 |
| Component Map | tool-registry.js description | 23 tools | 실제 파일 |
| Component Map | version-detector.js description | 34 feature flags | 실제 코드 |
| Component Map | tracker-bridge.js | 존재 | 실제 파일 |
| Component Map | runtime-hooks.js | 존재 | 실제 파일 |
| Tool Mapping | 18 rows (14 legacy + 4 tracker) | 18 entries | tool-registry.js |
| Compatibility | Gemini CLI version | v0.29.0+ ... v0.32.1 | bkit.config.json |
| Team Mode | Version reference | v1.5.6 → generic | 정확성 확인 |

### 5.2 Known Issues to Fix

1. **Component Map `version-detector.js`**: "34 feature flags" 기술 → 실제 총 feature flag 수 확인 필요
2. **Team Mode Foundation**: "bkit v1.5.6 includes..." → 버전 참조 일반화 또는 v1.5.7 반영
3. **hooks/scripts/ count**: "17 hook scripts" → runtime-hooks.js 포함 시 재계산

### 5.3 Action

- grep으로 "1.5.6" 잔존 참조 탐색
- 각 수치를 코드에서 추출하여 비교
- 불일치 항목 수정

---

## 6. DS-05: GEMINI.md 검증

### 6.1 Verification Checklist

| Line | Check Item | Expected |
|------|-----------|----------|
| 1 | Title version | v1.5.7 |
| 12 | 29 Skills | 29 |
| 13 | 16 Agents | 16 |
| 14 | 10-Event Hook System | 10 |
| 61 | Footer version | v1.5.7 |
| 52-57 | @import paths | 6 modules, all exist |

### 6.2 @import Module Verification

| Module | Path | Exists |
|--------|------|--------|
| commands.md | .gemini/context/commands.md | Verify |
| pdca-rules.md | .gemini/context/pdca-rules.md | Verify |
| agent-triggers.md | .gemini/context/agent-triggers.md | Verify |
| skill-triggers.md | .gemini/context/skill-triggers.md | Verify |
| tool-reference.md | .gemini/context/tool-reference.md | Verify |
| feature-report.md | .gemini/context/feature-report.md | Verify |

### 6.3 Action

파일 존재 확인 + 내용 정합성 검증. v1.5.7 변경이 @import 모듈에 반영되었는지 확인.

---

## 7. DS-06: bkit.config.json 검증

### 7.1 Verification Checklist

| Field | Expected Value |
|-------|---------------|
| `version` | "1.5.7" |
| `testedVersions` | [..., "0.32.0", "0.32.1"] 포함 |
| `compatibility.minGeminiCliVersion` | "0.29.0" |
| `compatibility.runtimeHooks.enabled` | true |
| `compatibility.runtimeHooks.minVersion` | "0.31.0" |
| `compatibility.runtimeHooks.dualMode` | true |
| `compatibility.taskTracker.enabled` | true |
| `compatibility.taskTracker.minVersion` | "0.32.0" |
| `compatibility.taskTracker.bridgeEnabled` | true |

### 7.2 Action

JSON 구조 검증, 필수 필드 존재 확인.

---

## 8. DS-07: gemini-extension.json 검증

### 8.1 Verification Checklist

| Field | Expected |
|-------|----------|
| `version` | "1.5.7" |
| `excludeTools` | **존재하지 않음** (제거됨) |
| `contextFileName` | "GEMINI.md" |
| `hooksDir` | 존재 |

### 8.2 Action

`excludeTools` 필드가 완전히 제거되었는지 확인. version 1.5.7 확인.

---

## 9. DS-08 & DS-09: Hook Scripts & Lib Modules 버전 주석

### 9.1 Hook Scripts (DS-08)

| File | @version Check |
|------|---------------|
| hooks/scripts/session-start.js | v1.5.7 확인 |
| hooks/scripts/before-agent.js | v1.5.7 확인 |
| hooks/scripts/before-model.js | v1.5.7 확인 |
| hooks/scripts/after-model.js | v1.5.7 확인 |
| hooks/scripts/before-tool-selection.js | v1.5.7 확인 |
| hooks/scripts/before-tool.js | v1.5.7 확인 |
| hooks/scripts/after-tool.js | v1.5.7 확인 |
| hooks/scripts/after-agent.js | v1.5.7 확인 |
| hooks/runtime-hooks.js | v1.5.7 확인 |

### 9.2 Lib Modules (DS-09)

| File | @version Check |
|------|---------------|
| lib/adapters/gemini/tool-registry.js | v1.5.7 확인 |
| lib/adapters/gemini/version-detector.js | v1.5.7 확인 |
| lib/adapters/gemini/policy-migrator.js | v1.5.7 확인 |
| lib/adapters/gemini/hook-adapter.js | v1.5.7 확인 |
| lib/adapters/gemini/tracker-bridge.js | v1.5.7 확인 |
| lib/adapters/gemini/context-fork.js | 변경 없음 (기존 버전 유지 가능) |
| lib/adapters/gemini/import-resolver.js | 변경 없음 (기존 버전 유지 가능) |
| lib/pdca/status.js | 확인 |
| lib/core/memory.js | 확인 |

### 9.3 Strategy

- v1.5.7에서 수정된 파일: `@version 1.5.7` 확인
- v1.5.7에서 수정 안 된 파일: 기존 버전 유지 (강제 업데이트 불필요)

---

## 10. DS-10: tool-reference.md 검증

### 10.1 Current State (확인됨)

- 23개 도구 전체 테이블: OK (17 legacy + 6 tracker)
- Breaking Changes 섹션: OK (BC-1, BC-2, BC-3)
- Tool Alias Reference: OK
- Claude Code Mappings: OK (4 tracker mappings)
- Tool Annotations: OK (23 rows)

### 10.2 Verification Items

| Check | Expected |
|-------|----------|
| Tool table rows | 23 |
| Breaking Change entries | 3 (BC-1, BC-2, BC-3) |
| Annotation table rows | 23 |
| Claude Code Mapping rows | 4 (TaskCreate/Update/Get/List) |
| Forward Alias rows | 5 |

### 10.3 Action

테이블 행 수 확인, 내용 정확성 검증. 이미 업데이트 완료된 것으로 보이나 교차 확인 수행.

---

## 11. DS-11 & DS-12: Agent & Skill Frontmatter 검증

### 11.1 Agent Tracker Tools (DS-11)

| Agent | Expected Tracker Tools |
|-------|----------------------|
| cto-lead.md | tracker_create_task, tracker_update_task, tracker_list_tasks, tracker_visualize |
| product-manager.md | tracker_create_task, tracker_list_tasks |
| pdca-iterator.md | tracker_update_task, tracker_get_task |
| qa-strategist.md | tracker_list_tasks, tracker_visualize |

### 11.2 Skill Tracker Tools (DS-12)

| Skill | Expected Tracker Tools |
|-------|----------------------|
| pdca/SKILL.md | tracker_create_task, tracker_update_task, tracker_list_tasks, tracker_visualize |
| development-pipeline/SKILL.md | tracker_list_tasks, tracker_visualize |
| phase-8-review/SKILL.md | tracker_list_tasks |

### 11.3 Verification Strategy

각 파일의 frontmatter `tools:` 섹션에서 해당 도구 존재 여부를 grep으로 확인.

---

## 12. DS-13: 완료 피처 아카이브

### 12.1 Archive Target

| Feature | Source Files | Archive Path |
|---------|-------------|-------------|
| gemini-cli-032-migration | plan, design, analysis, report (4 files) | docs/archive/2026-03/gemini-cli-032-migration/ |
| bkit-gemini-comprehensive-test | plan, design, report (3 files) | docs/archive/2026-03/bkit-gemini-comprehensive-test/ |

### 12.2 Archive Procedure

1. `docs/archive/2026-03/` 디렉토리 생성
2. 각 피처의 PDCA 문서를 아카이브 디렉토리로 복사
3. 원본 삭제
4. `.pdca-status.json` 업데이트 (activeFeatures → archivedFeatures)
5. `docs/archive/2026-03/_INDEX.md` 생성

### 12.3 Archive Index Format

```markdown
# Archive Index - 2026-03

## gemini-cli-032-migration
- **Completed**: 2026-03-04
- **Match Rate**: 100%
- **Summary**: Gemini CLI v0.32.x full migration (bkit v1.5.7)

## bkit-gemini-comprehensive-test
- **Completed**: 2026-02-01
- **Match Rate**: 100%
- **Summary**: bkit v1.5.0 comprehensive test verification
```

---

## 13. DS-14: doc-sync PDCA Report

### 13.1 Target File

`docs/04-report/features/bkit-v157-doc-sync.report.md`

### 13.2 Report Structure

```markdown
# bkit v1.5.7 Documentation Synchronization Report

## 1. Summary
- 작업 범위: 14개 DS 항목
- 수정 파일: ~17개
- 결과: 모든 문서 v1.5.7 동기화 완료

## 2. Changes Made
(DS-01 ~ DS-14 각 항목별 수행 결과)

## 3. Verification Results
- v1.5.6 잔존 참조: 0건 (archive 제외)
- 수치 불일치: 0건
- 누락 문서: 0건

## 4. Quality Metrics
- Match Rate: >= 95%
```

---

## 14. Implementation Order (상세)

```
Step 1: Audit Phase
├── 1.1 grep "1\.5\.6" across all non-archive files
├── 1.2 Verify feature counts in code vs docs
└── 1.3 Check @version comments in modified files

Step 2: CHANGELOG Fix (DS-03)
└── 2.1 Add [1.5.7] compare link

Step 3: README Fixes (DS-04)
├── 3.1 Fix any v1.5.6 remnants
├── 3.2 Verify component map accuracy
└── 3.3 Verify feature counts

Step 4: GEMINI.md Verify (DS-05)
└── 4.1 Confirm all @import modules exist and are current

Step 5: Config Verify (DS-06, DS-07)
├── 5.1 bkit.config.json structure check
└── 5.2 gemini-extension.json structure check

Step 6: Version Comment Verify (DS-08, DS-09)
├── 6.1 Hook scripts @version check
└── 6.2 Lib modules @version check

Step 7: Content Verify (DS-10, DS-11, DS-12)
├── 7.1 tool-reference.md table counts
├── 7.2 Agent frontmatter tracker tools
└── 7.3 Skill frontmatter tracker tools

Step 8: Archive (DS-13)
├── 8.1 Create docs/archive/2026-03/
├── 8.2 Move completed feature docs
├── 8.3 Create _INDEX.md
└── 8.4 Delete originals

Step 9: PDCA Status Update (DS-01)
└── 9.1 Update .pdca-status.json to target state

Step 10: Reports (DS-02, DS-14)
├── 10.1 Create comprehensive test report
└── 10.2 Create doc-sync report

Step 11: Final Verification
├── 11.1 grep "1\.5\.6" final check
├── 11.2 Cross-reference all counts
└── 11.3 Verify .pdca-status.json consistency
```

---

## 15. Verification Queries

### 15.1 v1.5.6 Remnant Check

```bash
grep -r "1\.5\.6" --include="*.md" --include="*.json" --include="*.js" \
  --exclude-dir=archive --exclude-dir=node_modules .
```

Expected: 0 results (또는 CHANGELOG의 이전 버전 히스토리 참조만)

### 15.2 Tool Count Verification

```bash
# tool-registry.js에서 실제 도구 수
grep "BUILTIN_TOOLS\." lib/adapters/gemini/tool-registry.js | wc -l
# Expected: 23

# tool-reference.md에서 테이블 행 수
grep "^\| \`" .gemini/context/tool-reference.md | head -30 | wc -l
# Expected: 23
```

### 15.3 Feature Flag Count Verification

```bash
# version-detector.js에서 실제 플래그 수
grep "has[A-Z]" lib/adapters/gemini/version-detector.js | sort -u | wc -l
```

### 15.4 Agent Tracker Tool Verification

```bash
grep -l "tracker_" agents/*.md
# Expected: cto-lead.md, product-manager.md, pdca-iterator.md, qa-strategist.md
```

### 15.5 Skill Tracker Tool Verification

```bash
grep -rl "tracker_" skills/*/SKILL.md
# Expected: pdca, development-pipeline, phase-8-review
```

---

## 16. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| 아카이브 시 파일 누락 | 아카이브 전 `ls` 로 파일 목록 확인 |
| README 수치 오류 | 코드에서 `wc -l`, `grep -c`로 실제 값 추출 |
| .pdca-status.json 구조 오류 | `node -e "JSON.parse(...)"` 로 JSON 유효성 검증 |
| CHANGELOG 링크 오류 | GitHub compare URL 패턴 일관성 확인 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-04 | Initial - 14개 DS 항목 상세 설계 | Claude Opus 4.6 |

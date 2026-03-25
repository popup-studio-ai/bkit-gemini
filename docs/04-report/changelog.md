# bkit v2.0.0 Changelog

## [2026-03-23] - Gemini CLI v0.35.0 Stable 마이그레이션 갱신 (4차)

### Changed
- v0.35.0 Stable 출시 확정 (npm latest=0.35.0, 2026-03-24T20:06:31Z)
- 전략 갱신: Strategy B → Strategy B' (Updated Targeted Upgrade)
- Wave 구조 갱신: 3-Wave → 4-Wave (Wave 3: P0 modes, Wave 4: P1 4건)
- YAGNI 리뷰: 8건 제외로 42% 공수 절감

### Discovered
- P0 `modes` 값 불일치: `plan_mode` → `plan` 수정 필요 (59개소)
- preview.3 `normalizeCommandName` 전체 경로 보존 (PR #23558) — 보안 영향
- v0.36.0-preview.0 `toolName` 필수화 (PR #23330) — bkit 100% 호환 확인 ✅

### Analysis
- **v0.35.0 Stable**: 159 commits, 52명 기여자, preview.5 거쳐 확정
- **npm dist-tags**: latest=0.35.0, preview=0.36.0-preview.0
- **잔여 작업**: P0 1건 (1h) + P1 4건 (7h) = 8h
- **누적 공수**: 11.8h (완료 3.8h + 잔여 8h)

---

## [2026-03-21] - Gemini CLI v0.35.0 마이그레이션 전략 수립

### Added
- Gemini CLI v0.35.0 Breaking Changes 종합 분석 (3건)
- v0.35.0 Feature Gate 7개 등록 계획 (hasJITContextLoading, hasToolIsolation, hasParallelToolScheduler, hasAdminPolicy, hasDisableAlwaysAllow, hasCryptoVerification, hasCustomKeybindings)
- TOML 정책 `deny_message` 필드 지원 계획 (Starter UX 개선)
- 3-Wave 마이그레이션 로드맵 (1.3h + 4h + 2.5h = 7.8h)
- 위험 관리 계획 및 롤백 전략
- 호환성 테스트 케이스 추가 계획 (tc82, tc84)

### Changed
- v0.35.0 대응 전략: Strategy C(20.3h, 포괄적) → Strategy B(7.8h, YAGNI 기반) 선택
- bkit.config.json `testedVersions` 업데이트 예정 (["0.34.0"] → ["0.34.0", "0.35.0"])

### Fixed
- version.js Feature Gate 누락 (Critical) 해결 계획
- bkit.config.json 버전 호환성 미보증 (Critical) 해결 계획
- JIT Context Loading 호환성 검증 (High) 계획
- import-resolver.js 캐시 중복 최적화 (High) 계획
- policy.js TOML 필드 미지원 (High) 해결 계획
- Hook lifecycle 정합성 검증 (High) 계획

### Analysis
- **분석 범위**: 512개 파일 (179 JS, 284 MD, 40 JSON, 9 TOML)
- **영향 파일**: 24개 (실제 수정 필요: 9개)
- **공수 절감**: 20.3h → 7.8h (61% 절감)
- **v0.35.0 Stable 예상**: 2026-03-25 (4일 후)
- **사용자 영향**: 무중단 업그레이드 보장

### Deprecations
- v0.34.0 이전 버전 마이그레이션 지원 단계적 축소 (v0.32.0 이후만 지원)

### Documentation
- [gemini-cli-v035-migration.report.md](gemini-cli-v035-migration.report.md) - 종합 마이그레이션 보고서
- Related: [gemini-cli-v035-research.md](../01-plan/research/gemini-cli-v035-research.md) - 변경사항 조사
- Related: [gemini-cli-v035-impact.analysis.md](../03-analysis/gemini-cli-v035-impact.analysis.md) - 영향 분석
- Related: [gemini-cli-v035-migration.plan.md](../01-plan/features/gemini-cli-v035-migration.plan.md) - 구현 계획

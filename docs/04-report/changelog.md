# bkit v2.0.0 Changelog

## [2026-03-23] - Gemini CLI v0.35.0 마이그레이션 완료 (bkit v2.0.1)

### Added
- `buildPathAwareCommandRegex()` — v0.35.0+ 전체 경로 명령어 보안 매칭
- `hasFullPathCommands()` — v0.35.0+ 버전 감지
- `emitCommandMatchToml()` — commandPrefix/commandRegex 조건부 TOML 출력
- `isJITMode()` + `waitForFile()` — JIT Context lazy 로딩 안전장치
- `normalizeInput()` — v0.35.0 BeforeAgent/AfterAgent envelope 처리
- after-agent.js SDK dual-mode handler export
- context-fork.js / pre-compress.js JIT 불완전 상태 감지 (`jitPartial`)
- session-start.js JIT @import 중복 방지

### Fixed
- **P0 Critical**: `modes: ['plan_mode']` → `modes: ['plan']` 전수 수정 (JS 6 + TOML 3 + 테스트 ~50개소)
- **P1 Security**: normalizeCommandName 전체 경로 보존 대응 (commandRegex)
- **P1 Hooks**: after-agent.js SDK handler + v0.35.0 envelope unwrapping
- **P1 JIT**: import-resolver.js 재시도 + fallback + context-fork 안전장치

### Analysis
- **Gap Analysis**: 100% Match Rate (27/27 항목 전부 통과)
- **v0.35.0 Stable**: 2026-03-24 출시 확정 (159 commits, 52명 기여자)
- **v0.36.0 호환**: toolName 필수화 100% 호환
- **총 공수**: ~11.8h (4-Wave 완료)
- **수정 파일**: 16개 (+4,124 / -244 lines)

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

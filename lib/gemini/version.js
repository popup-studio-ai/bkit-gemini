/**
 * Gemini CLI Version Detector
 * Detects installed Gemini CLI version for compatibility branching
 *
 * Detection Order:
 * 1. GEMINI_CLI_VERSION env var (fastest)
 * 2. npm list -g @google/gemini-cli (reliable)
 * 3. gemini --version (fallback)
 *
 * @version 2.0.3
 */
const { execSync } = require('child_process');

// Cache version after first detection
let _cachedVersion = null;

// Maximum plausible Gemini CLI version (security boundary)
const MAX_PLAUSIBLE_VERSION = '2.0.0';

/**
 * Validate SemVer format
 * @param {string} str
 * @returns {boolean}
 */
function isValidSemVer(str) {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(str);
}

/**
 * Check if version exceeds plausible range (prevents env var injection)
 * @param {string} str
 * @returns {boolean}
 */
function isVersionBeyondPlausible(str) {
  const parsed = parseVersion(str);
  const max = parseVersion(MAX_PLAUSIBLE_VERSION);
  return compareVersions(parsed, max) > 0;
}

/**
 * Parse version string
 * @param {string} raw - e.g., "0.30.0-preview.3" or "0.34.0-nightly.20260304"
 * @returns {{ major: number, minor: number, patch: number, previewNum: number|null, nightlyNum: number|null, raw: string, isPreview: boolean, isNightly: boolean }}
 */
function parseVersion(raw) {
  if (!raw || typeof raw !== 'string') {
    return { major: 0, minor: 29, patch: 0, previewNum: null, nightlyNum: null, raw: raw || '0.29.0', isPreview: false, isNightly: false };
  }

  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(-(?:preview\.(\d+)|nightly\.(\d+)(?:\.[a-f0-9]+)?))?/);
  if (!match) {
    return { major: 0, minor: 29, patch: 0, previewNum: null, nightlyNum: null, raw, isPreview: false, isNightly: false };
  }

  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    previewNum: match[5] ? parseInt(match[5]) : null,
    nightlyNum: match[6] ? parseInt(match[6]) : null,
    raw,
    isPreview: !!match[5],
    isNightly: !!match[6]
  };
}

/**
 * Detect Gemini CLI version
 * @returns {{ major: number, minor: number, patch: number, previewNum: number|null, raw: string, isPreview: boolean }}
 */
function detectVersion() {
  if (_cachedVersion) return _cachedVersion;

  let raw = null;

  // Strategy 1: Environment variable (fastest, with validation)
  const envVal = process.env.GEMINI_CLI_VERSION || null;
  if (envVal) {
    if (!isValidSemVer(envVal)) {
      // Invalid format - potential injection attempt
      raw = null;
    } else if (isVersionBeyondPlausible(envVal)) {
      // Exceeds plausible range - potential flag manipulation
      raw = null;
    } else {
      raw = envVal;
    }
  }

  // Strategy 2: npm global package
  if (!raw) {
    try {
      const output = execSync(
        'npm list -g @google/gemini-cli --depth=0 --json 2>/dev/null',
        { timeout: 3000, encoding: 'utf-8' }
      );
      const json = JSON.parse(output);
      raw = json.dependencies?.['@google/gemini-cli']?.version || null;
    } catch (e) { /* ignore */ }
  }

  // Strategy 3: CLI --version
  if (!raw) {
    try {
      const output = execSync('gemini --version 2>/dev/null', {
        timeout: 3000,
        encoding: 'utf-8'
      });
      const match = output.match(/(\d+\.\d+\.\d+(-(?:preview|nightly)\.\d+)?)/);
      if (match) raw = match[1];
    } catch (e) { /* ignore */ }
  }

  // Default to minimum supported version
  if (!raw) raw = '0.34.0';

  _cachedVersion = parseVersion(raw);
  return _cachedVersion;
}

/**
 * Compare two version objects
 * @param {{ major: number, minor: number, patch: number }} a
 * @param {{ major: number, minor: number, patch: number }} b
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 */
function compareVersions(a, b) {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  return 0;
}

/**
 * Check if CLI version >= target
 * @param {string} target - e.g., "0.30.0"
 * @returns {boolean}
 */
function isVersionAtLeast(target) {
  const current = detectVersion();
  const tgt = parseVersion(target);
  return compareVersions(current, tgt) >= 0;
}

/**
 * Feature flags based on detected version
 * @returns {object}
 */
function getFeatureFlags() {
  return {
    // v0.34.0+
    hasNativeSkillSystem: isVersionAtLeast('0.34.0'),
    hasACP: isVersionAtLeast('0.34.0'),
    hasExtensionRegistryClient: isVersionAtLeast('0.34.0'),
    hasExtensionValidation: isVersionAtLeast('0.34.0'),
    hasHookMigration: isVersionAtLeast('0.34.0'),
    hasSlashCommandConflictResolution: isVersionAtLeast('0.34.0'),
    hasMcpPromptLoader: isVersionAtLeast('0.34.0'),
    hasContextFileNameArray: isVersionAtLeast('0.34.0'),
    hasGemini31CustomTools: isVersionAtLeast('0.34.0'),
    hasToolLegacyAliases: isVersionAtLeast('0.34.0'),
    hasStrictTomlValidation: isVersionAtLeast('0.34.0'),
    hasSubagentPolicies: isVersionAtLeast('0.34.0'),
    hasThemeSubdirectories: isVersionAtLeast('0.34.0'),
    hasUpgradeCommand: isVersionAtLeast('0.34.0'),

    // v0.35.0+
    hasJITContextLoading: isVersionAtLeast('0.35.0'),
    hasToolIsolation: isVersionAtLeast('0.35.0'),
    hasParallelToolScheduler: isVersionAtLeast('0.35.0'),
    hasAdminPolicy: isVersionAtLeast('0.35.0'),
    hasDisableAlwaysAllow: isVersionAtLeast('0.35.0'),
    hasCryptoVerification: isVersionAtLeast('0.35.0'),
    hasCustomKeybindings: isVersionAtLeast('0.35.0'),

    // v0.36.0+
    hasEnableAgentsDefaultFalse: isVersionAtLeast('0.36.0'),
    hasToolNameRequired: isVersionAtLeast('0.36.0'),
    hasStatelessSandbox: isVersionAtLeast('0.36.0'),
    hasBeforeToolAsk: isVersionAtLeast('0.36.0'),
    hasGitWorktree: isVersionAtLeast('0.36.0'),
    hasPlanModeNonInteractive: isVersionAtLeast('0.36.0'),
    hasMultiRegistry: isVersionAtLeast('0.36.0'),

    // v0.39.0+ (Plan §7.1.2 — feature flag group neuf for v0.39 Minor)
    // Legacy SubagentTool removed (PR #25053), replaced by invoke_agent (PR #24489)
    hasInvokeAgent: isVersionAtLeast('0.39.0'),
    // ContextManager + Sidecar decoupled architecture (PR #24752)
    hasContextManagerSidecar: isVersionAtLeast('0.39.0'),
    // MCP `auth` block (PR #24770)
    hasMcpAuthBlock: isVersionAtLeast('0.39.0'),
    // Tool-controlled display protocol Steps 2-3 (PR #25134)
    hasToolControlledDisplay: isVersionAtLeast('0.39.0'),
    // /memory inbox + skill patching (PR #24544/#25148)
    hasMemoryInbox: isVersionAtLeast('0.39.0'),
    // GEMINI_PLANS_DIR env var to hooks (PR #25296)
    hasGeminiPlansDirEnv: isVersionAtLeast('0.39.0'),
    // useAgentStream hook (PR #24292/#24297)
    hasUseAgentStream: isVersionAtLeast('0.39.0'),

    // v0.39.1+ (Patch — PR #25814 + #25720 보안 강화)
    // Headless 모드 untrusted workspace 차단 (PR #25814)
    // → bkit MCP가 자식 gemini에 GEMINI_CLI_TRUST_WORKSPACE='true'를 무조건 전파해 우회
    hasHeadlessTrustEnforcement: isVersionAtLeast('0.39.1'),
    // `tools.core` allowlist 신설 (PR #25720) — Multi-Registry 통합 시점 채택
    hasToolsCoreAllowlist: isVersionAtLeast('0.39.1'),
    // Policy Engine 셸 명령 재귀 검증 강화 (PR #25720)
    // → bkit 정책 회귀 위험 0건 확인 후 spot 검증
    hasShellRecursiveValidation: isVersionAtLeast('0.39.1'),
    // `--skip-trust` CLI 플래그 신설 (PR #25814) — bkit는 env 방식 채택, 미사용
    hasSkipTrustFlag: isVersionAtLeast('0.39.1'),

    // v0.40.0+ flags (4) — preview/stable 누적 흡수 (P3 plan §5, design §2.1.3)
    // `continueOnFailedApiCall` config 제거 + post-stream injection 제거 (PR #26340)
    hasContinueOnFailedApiCallRemoved: isVersionAtLeast('0.40.0'),
    // core tools가 native ToolDisplay emit, legacy returnDisplay adapter deprecated (PR #25186)
    hasNewToolDisplay: isVersionAtLeast('0.40.0'),
    // `exit_plan_mode` → `run_shell_command` 호출 금지 (PR #26230)
    hasExitPlanModeShellBan: isVersionAtLeast('0.40.0'),
    // `Config.setSessionId()` 호출 시 15+ session-scoped 상태 reset (PR #26342)
    hasSetSessionIdReset: isVersionAtLeast('0.40.0'),

    // v0.41.0+ flags (4)
    // a2a-server 분리 (참조용, bkit 영향 0건)
    hasA2aServerSplit: isVersionAtLeast('0.41.0'),
    // Auto Memory inbox flow base (Cx2, v2.1.0 cycle 채택 예정)
    hasAutoMemoryInbox: isVersionAtLeast('0.41.0'),
    // `--ignore-env` flag / `advanced.ignoreLocalEnv` setting base (Cx1)
    hasIgnoreEnvFlag: isVersionAtLeast('0.41.0'),
    // `--prompt` (-p) flag undeprecated (Cx14, v0.42.0에서 정정 확정)
    hasPromptUndeprecated: isVersionAtLeast('0.41.0'),

    // v0.42.0+ flag (1) — Cx13 Bx4 잠금 게이트
    // experimental.gemma default false → true (Gemma 4 default-on, PR #26307)
    // bkit는 .gemini/settings.json에서 명시적으로 false로 잠금 (Cx13)
    hasGemmaDefaultOn: isVersionAtLeast('0.42.0'),

    // Policy Engine flags (required by policy.js)
    hasPolicyEngine: isVersionAtLeast('0.30.0'),
    hasProjectLevelPolicy: isVersionAtLeast('0.31.0'),
    hasExtensionPolicies: isVersionAtLeast('0.32.0'),
    hasTaskTracker: isVersionAtLeast('0.32.0'),
    hasModelFamilyToolsets: isVersionAtLeast('0.32.0'),
    hasSlashCommands: isVersionAtLeast('0.32.0'),

    // RuntimeHook flag (required by hooks.js)
    hasRuntimeHookFunctions: isVersionAtLeast('0.31.0'),

    // Legacy / Intermediate flags (for tc18/tc79 compatibility)
    hasBrowserAgent: isVersionAtLeast('0.31.0'),
    hasMcpProgress: isVersionAtLeast('0.31.0'),
    hasParallelReadCalls: isVersionAtLeast('0.31.0'),
    hasPlanModeCustomStorage: isVersionAtLeast('0.31.0'),
    hasToolAnnotations: isVersionAtLeast('0.31.0'),
    hasExtensionFolderTrust: isVersionAtLeast('0.31.0'),
    hasAllowMultipleReplace: isVersionAtLeast('0.31.0'),

    // Legacy flags for old test compatibility (v0.29.0 and below)
    hasSkillsStable: isVersionAtLeast('0.29.0'),
    hasPlanMode: isVersionAtLeast('0.29.0'),
    hasGemini3Default: isVersionAtLeast('0.29.0'),
    hasExtensionRegistry: isVersionAtLeast('0.29.0'),
    hasSDK: isVersionAtLeast('0.30.0'),
    hasApprovalMode: isVersionAtLeast('0.30.0')
  };
}

/**
 * Get bkit feature availability based on Gemini CLI version
 * Maps CLI capabilities to bkit feature gates
 * @returns {object}
 */
function getBkitFeatureFlags() {
  const flags = getFeatureFlags();
  return {
    ...flags,
    // v2.0.0: Previous CLI-version-gated features are always available
    canUseTeam: true,
    canUsePmTeam: true,
    canUseNativeAgents: true,
    canUsePlanDirectory: true,
    canUseExcludeTools: true,
    canUseNativeSkills: flags.hasNativeSkillSystem,
    canUseSubagentPolicies: flags.hasSubagentPolicies,
    canValidateExtension: flags.hasExtensionValidation,

    // v0.35.0+
    canUseJITContext: flags.hasJITContextLoading,
    canUseToolIsolation: flags.hasToolIsolation,
    canUseParallelScheduler: flags.hasParallelToolScheduler,
    canUseAdminPolicy: flags.hasAdminPolicy,

    // v0.36.0+
    canUseBeforeToolAsk: flags.hasBeforeToolAsk,
    canUseGitWorktree: flags.hasGitWorktree,
    canUsePlanModeNonInteractive: flags.hasPlanModeNonInteractive
  };
}

/**
 * Get human-readable version summary
 * @returns {string}
 */
function getVersionSummary() {
  const v = detectVersion();
  const flags = getFeatureFlags();
  const features = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(', ');
  const suffix = v.isPreview ? ' (preview)' : v.isNightly ? ' (nightly)' : '';
  return `Gemini CLI ${v.raw}${suffix} | Features: ${features}`;
}

/**
 * Reset cached version (for testing)
 */
function resetCache() {
  _cachedVersion = null;
}

module.exports = {
  detectVersion,
  parseVersion,
  compareVersions,
  isVersionAtLeast,
  isValidSemVer,
  isVersionBeyondPlausible,
  getFeatureFlags,
  getBkitFeatureFlags,
  getVersionSummary,
  resetCache
};

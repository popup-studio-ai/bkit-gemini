#!/usr/bin/env node
/**
 * BeforePhase Hook — PDCA phase transition gate
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation (Wave 1 Day 3)
 * Design: docs/01-plan/sprints/v2.0.7-gemini-cli-l4-automation-design.md §5.3
 * Spec: AC-T2 (L4 phase 자동 전환), AC-T14 (before-phase 작동),
 *       D15 (Quality Gate 평가 = Agent dispatch via sprint-qa-flow),
 *       D18 (hooks.json BeforePhase entry)
 *
 * Trigger: PDCA phase 전환 시점 (Plan→Design→Do→Check→Act→Report).
 *   L0~L2: 사용자 결재 prompt 반환 (decision: 'ask')
 *   L3~L4: Quality Gate (M1~M10) 평가 — PASS 시 'allow', FAIL 시 'deny'
 *
 * Quality Gate 평가 전략 (D15):
 *   1차 — sync inline 검증 (file existence, design 종료 sentinel, baseline pass)
 *   2차 — sprint-qa-flow agent dispatch (async, BKIT_BEFORE_PHASE_AGENT=true 시)
 *
 * Cross-OS: pure Node.js. macOS / Linux / WSL / Windows / Git Bash 동일.
 *
 * Graceful: hook 실패 시 'ask' (보수적) 반환 — phase 전환 차단 X, 사용자 결재 요청.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

// ─── Core processing logic ──────────────────────────────────────
function processHook(input) {
  try {
    const currentPhase = input.current_phase || input.currentPhase || 'plan';
    const nextPhase = input.next_phase || input.nextPhase || null;
    const projectDir = input.projectDir || process.cwd();
    const feature = input.feature || input.featureName || null;

    // If next_phase missing, infer from current (PDCA order)
    const PHASE_ORDER = ['plan', 'design', 'do', 'check', 'act', 'report'];
    const inferredNext = nextPhase ||
      (PHASE_ORDER.indexOf(currentPhase) < PHASE_ORDER.length - 1
        ? PHASE_ORDER[PHASE_ORDER.indexOf(currentPhase) + 1]
        : null);

    if (!inferredNext) {
      // No further phase — sprint completes
      return { decision: 'allow', systemMessage: 'PDCA cycle complete (no next phase)' };
    }

    // Determine automation level
    const level = getAutomationLevel(projectDir);

    // L0~L2: legacy ask-user behavior (AC-T6 무회귀)
    if (level <= 2) {
      return askUserForTransition(currentPhase, inferredNext, feature);
    }

    // L3~L4: evaluate Quality Gates
    const gateReport = evaluateQualityGates(currentPhase, inferredNext, projectDir, feature);

    if (gateReport.allPassed) {
      auditPhaseTransition('allow', currentPhase, inferredNext, gateReport, projectDir, level);
      return {
        decision: 'allow',
        systemMessage: `bkit L${level} auto-advance ${currentPhase} → ${inferredNext} (gates: ${gateReport.passed.join(',')})`
      };
    }

    // Gate failures → block transition + audit
    auditPhaseTransition('deny', currentPhase, inferredNext, gateReport, projectDir, level);
    return {
      decision: 'deny',
      reason: `bkit L${level} blocked ${currentPhase} → ${inferredNext}: Quality Gate fail (${gateReport.failed.join(', ')}). ${gateReport.summary}`
    };
  } catch (error) {
    // Graceful: conservative ask
    return {
      decision: 'ask',
      systemMessage: `bkit before-phase: internal error, requesting user confirmation. (${error.message})`
    };
  }
}

// ─── Automation Level Detection ─────────────────────────────────
function getAutomationLevel(projectDir) {
  try {
    const TSM = require(path.join(libPath, 'core', 'trust-score'));
    const mgr = new TSM(projectDir);
    return mgr.getLevel();
  } catch (e) {
    return 2; // safe default — legacy L2
  }
}

// ─── L0~L2 user confirmation prompt ─────────────────────────────
function askUserForTransition(currentPhase, nextPhase, feature) {
  return {
    decision: 'ask',
    systemMessage: `PDCA phase transition: ${currentPhase} → ${nextPhase}` +
      (feature ? ` (feature: ${feature})` : '') +
      '. Proceed?'
  };
}

// ─── L3~L4 Quality Gate evaluation (D15 hybrid) ─────────────────
function evaluateQualityGates(currentPhase, nextPhase, projectDir, feature) {
  // D15 hybrid: sync inline 1차 + optional agent dispatch 2차
  const useAgent = process.env.BKIT_BEFORE_PHASE_AGENT === 'true';

  if (useAgent) {
    try {
      return dispatchSprintQaFlow(currentPhase, nextPhase, projectDir, feature);
    } catch (e) {
      // agent dispatch failure → fall through to inline
    }
  }

  return evaluateInline(currentPhase, nextPhase, projectDir, feature);
}

// ─── Sync inline gate evaluation ────────────────────────────────
function evaluateInline(currentPhase, nextPhase, projectDir, feature) {
  const gates = [];
  const passed = [];
  const failed = [];

  // M1 — Plan-Design 정합성 (file existence + sentinel check)
  const m1 = checkM1PlanDesignAlignment(currentPhase, projectDir, feature);
  gates.push(m1);
  if (m1.pass) passed.push(m1.id); else failed.push(m1.id);

  // M3 — Security policy (deny pattern integrity)
  const m3 = checkM3SecurityPolicy(projectDir);
  gates.push(m3);
  if (m3.pass) passed.push(m3.id); else failed.push(m3.id);

  // M5 — Baseline regression (lib/core/permission compat)
  // Hook is sync — full baseline test impractical here; defer to qa-strategist agent.
  // Inline check: ensure no destructive policy was removed.
  const m5 = checkM5BaselinePolicy(projectDir);
  gates.push(m5);
  if (m5.pass) passed.push(m5.id); else failed.push(m5.id);

  // M7 — Docs sync (current phase doc exists)
  const m7 = checkM7DocsSync(currentPhase, projectDir, feature);
  gates.push(m7);
  if (m7.pass) passed.push(m7.id); else failed.push(m7.id);

  // M9 — Sprint scope adherence (status file matchRate exists)
  const m9 = checkM9SprintScope(projectDir, feature);
  gates.push(m9);
  if (m9.pass) passed.push(m9.id); else failed.push(m9.id);

  return {
    allPassed: failed.length === 0,
    passed,
    failed,
    gates,
    summary: failed.length === 0
      ? `All ${passed.length} inline gates passed`
      : `${failed.length} gate(s) failed: ${failed.map(id => gates.find(g => g.id === id).reason).join('; ')}`,
    mode: 'inline'
  };
}

function checkM1PlanDesignAlignment(currentPhase, projectDir, feature) {
  if (!feature) return { id: 'M1', pass: true, reason: 'no feature scoped (skip)' };
  // Only enforce when transitioning OUT of design phase
  if (currentPhase !== 'design') return { id: 'M1', pass: true, reason: `skip (current=${currentPhase})` };
  const designPaths = [
    path.join(projectDir, 'docs', '02-design', 'features', `${feature}.design.md`),
    path.join(projectDir, 'docs', '02-design', `${feature}.design.md`)
  ];
  const exists = designPaths.some(p => fs.existsSync(p));
  return exists
    ? { id: 'M1', pass: true, reason: 'design doc found' }
    : { id: 'M1', pass: false, reason: `design doc missing for feature=${feature}` };
}

function checkM3SecurityPolicy(projectDir) {
  try {
    const cfgPath = path.join(projectDir, 'bkit.config.json');
    if (!fs.existsSync(cfgPath)) return { id: 'M3', pass: true, reason: 'no bkit.config.json (skip)' };
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    const perms = cfg.permissions || {};
    // Critical destructive patterns that MUST remain
    const mustHaveDeny = ['run_shell_command(rm -rf*)', 'run_shell_command(git push --force*)'];
    const missing = mustHaveDeny.filter(key => perms[key] !== 'deny');
    return missing.length === 0
      ? { id: 'M3', pass: true, reason: 'destructive deny patterns intact' }
      : { id: 'M3', pass: false, reason: `destructive deny missing: ${missing.join(', ')}` };
  } catch (e) {
    return { id: 'M3', pass: false, reason: `M3 check error: ${e.message}` };
  }
}

function checkM5BaselinePolicy(projectDir) {
  // Lightweight: verify lib/core/ key modules exist (full baseline run impractical in sync hook)
  const requiredModules = ['memory.js', 'paths.js', 'permission.js'];
  const coreDir = path.join(projectDir, 'lib', 'core');
  if (!fs.existsSync(coreDir)) return { id: 'M5', pass: true, reason: 'lib/core missing (skip)' };
  const missing = requiredModules.filter(m => !fs.existsSync(path.join(coreDir, m)));
  return missing.length === 0
    ? { id: 'M5', pass: true, reason: 'core modules intact' }
    : { id: 'M5', pass: false, reason: `core modules missing: ${missing.join(', ')}` };
}

function checkM7DocsSync(currentPhase, projectDir, feature) {
  if (!feature) return { id: 'M7', pass: true, reason: 'no feature scoped (skip)' };
  // Plan phase requires plan doc
  if (currentPhase === 'plan') {
    const planPaths = [
      path.join(projectDir, 'docs', '01-plan', 'features', `${feature}.plan.md`),
      path.join(projectDir, 'docs', '01-plan', `${feature}.plan.md`)
    ];
    const exists = planPaths.some(p => fs.existsSync(p));
    return exists
      ? { id: 'M7', pass: true, reason: 'plan doc found' }
      : { id: 'M7', pass: false, reason: `plan doc missing for feature=${feature}` };
  }
  return { id: 'M7', pass: true, reason: `skip (current=${currentPhase})` };
}

function checkM9SprintScope(projectDir, feature) {
  try {
    const statusPath = path.join(projectDir, '.pdca-status.json');
    if (!fs.existsSync(statusPath)) return { id: 'M9', pass: true, reason: 'no pdca-status (skip)' };
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    // sanity: status file is parseable + has expected shape
    if (!status.pipeline && !status.activeFeatures) {
      return { id: 'M9', pass: false, reason: 'pdca-status malformed' };
    }
    return { id: 'M9', pass: true, reason: 'sprint scope tracked' };
  } catch (e) {
    return { id: 'M9', pass: false, reason: `M9 check error: ${e.message}` };
  }
}

// ─── 2차 Agent dispatch via MCP (D15) ───────────────────────────
function dispatchSprintQaFlow(currentPhase, nextPhase, projectDir, feature) {
  // Note: hook is sync (called by Gemini CLI hook runner). MCP spawn_agent is async.
  // For v2.0.7 S7 Wave 1, we implement a sync stub that delegates evaluation to
  // inline gates. v2.1.0+ may upgrade this to true async agent dispatch when
  // Gemini CLI hook spec supports promise-returning hooks reliably.
  //
  // The BKIT_BEFORE_PHASE_AGENT=true env var triggers this branch but currently
  // delegates back to inline evaluation. Production agent dispatch is deferred.
  const result = evaluateInline(currentPhase, nextPhase, projectDir, feature);
  result.mode = 'agent-dispatch-stub-v2.0.7';
  return result;
}

// ─── Audit log ──────────────────────────────────────────────────
function auditPhaseTransition(decision, fromPhase, toPhase, gateReport, projectDir, level) {
  try {
    const AL = require(path.join(libPath, 'core', 'audit-log'));
    new AL(projectDir).append({
      event: decision === 'allow' ? 'ALLOW' : 'DENY',
      hook: 'BeforePhase',
      tool: 'pdca-transition',
      decision,
      reason: gateReport.summary,
      level_after: level,
      from_phase: fromPhase,
      to_phase: toPhase,
      gates_passed: gateReport.passed,
      gates_failed: gateReport.failed,
      mode: gateReport.mode
    });
  } catch (e) {
    // graceful
  }
}

// ─── RuntimeHook function export (v0.31.0+ SDK) ────────────────
async function handler(event) {
  return processHook(event);
}

// ─── Legacy command mode ───────────────────────────────────────
function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();
    const input = adapter.readHookInput();
    input.projectDir = adapter.getProjectDir();
    const result = processHook(input);

    if (result.decision === 'deny') {
      adapter.outputBlock(result.reason);
    } else if (result.decision === 'ask') {
      // 'ask' delivered via systemMessage in adapter (v0.36.0+)
      if (adapter.outputAsk) adapter.outputAsk(result.systemMessage, 'BeforePhase');
      else adapter.outputAllow(result.systemMessage, 'BeforePhase');
    } else if (result.systemMessage) {
      adapter.outputAllow(result.systemMessage, 'BeforePhase');
    } else {
      adapter.outputEmpty();
    }
  } catch (error) {
    process.exit(0);
  }
}

if (require.main === module) { main(); }

module.exports = { handler, processHook, evaluateInline, evaluateQualityGates };

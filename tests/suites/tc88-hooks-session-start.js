const { PLUGIN_ROOT, assert, assertEqual, assertContains, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const HOOK_PATH = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js');

const tests = [
  // ═══ TC-88: session-start.js v2.0.0 Features (25 tests) ═══

  {
    name: 'SS-01: session-start.js exists',
    fn: () => {
      assert(fs.existsSync(HOOK_PATH), 'session-start.js should exist');
    }
  },
  {
    name: 'SS-02: Source contains PHASE_CONTEXT_MAP constant',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'PHASE_CONTEXT_MAP', 'Should contain PHASE_CONTEXT_MAP');
    }
  },
  {
    name: 'SS-03: PHASE_CONTEXT_MAP has plan phase',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "plan:", 'PHASE_CONTEXT_MAP should have plan key');
    }
  },
  {
    name: 'SS-04: PHASE_CONTEXT_MAP has design phase',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "design:", 'PHASE_CONTEXT_MAP should have design key');
    }
  },
  {
    name: 'SS-05: PHASE_CONTEXT_MAP has do phase',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "do:", 'PHASE_CONTEXT_MAP should have do key');
    }
  },
  {
    name: 'SS-06: PHASE_CONTEXT_MAP has check phase',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "check:", 'PHASE_CONTEXT_MAP should have check key');
    }
  },
  {
    name: 'SS-07: PHASE_CONTEXT_MAP has act phase',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "act:", 'PHASE_CONTEXT_MAP should have act key');
    }
  },
  {
    name: 'SS-08: PHASE_CONTEXT_MAP has idle phase',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "idle:", 'PHASE_CONTEXT_MAP should have idle key');
    }
  },
  {
    name: 'SS-09: PHASE_CONTEXT_MAP has all 6 phases + idle (7 total)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const mapMatch = src.match(/PHASE_CONTEXT_MAP\s*=\s*\{([\s\S]*?)\};/);
      assert(mapMatch, 'Should find PHASE_CONTEXT_MAP definition');
      const mapBody = mapMatch[1];
      const phases = ['plan', 'design', 'do', 'check', 'act', 'idle'];
      for (const phase of phases) {
        assert(mapBody.includes(`${phase}:`), `PHASE_CONTEXT_MAP should include ${phase}`);
      }
    }
  },
  {
    name: 'SS-10: plan phase loads 4 files (commands, pdca-rules, feature-report, executive-summary-rules)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const mapMatch = src.match(/PHASE_CONTEXT_MAP\s*=\s*\{([\s\S]*?)\};/);
      assert(mapMatch, 'Should find PHASE_CONTEXT_MAP');
      const planMatch = mapMatch[1].match(/plan:\s*\[([\s\S]*?)\]/);
      assert(planMatch, 'Should find plan array');
      const planFiles = planMatch[1];
      assertContains(planFiles, 'commands.md', 'plan should load commands.md');
      assertContains(planFiles, 'pdca-rules.md', 'plan should load pdca-rules.md');
      assertContains(planFiles, 'feature-report.md', 'plan should load feature-report.md');
      assertContains(planFiles, 'executive-summary-rules.md', 'plan should load executive-summary-rules.md');
      // Count entries
      const entries = planFiles.match(/\.md/g);
      assertEqual(entries.length, 4, 'plan should have exactly 4 files');
    }
  },
  {
    name: 'SS-11: do phase loads 3 files (tool-reference, skill-triggers, feature-report)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const mapMatch = src.match(/PHASE_CONTEXT_MAP\s*=\s*\{([\s\S]*?)\};/);
      assert(mapMatch, 'Should find PHASE_CONTEXT_MAP');
      // Extract do array - need to be careful with the key name
      const doMatch = mapMatch[1].match(/do:\s*\[([\s\S]*?)\]/);
      assert(doMatch, 'Should find do array');
      const doFiles = doMatch[1];
      assertContains(doFiles, 'tool-reference-v2.md', 'do should load tool-reference-v2.md');
      assertContains(doFiles, 'skill-triggers.md', 'do should load skill-triggers.md');
      assertContains(doFiles, 'feature-report.md', 'do should load feature-report.md');
      const entries = doFiles.match(/\.md/g);
      assertEqual(entries.length, 3, 'do should have exactly 3 files');
    }
  },
  {
    name: 'SS-12: check phase loads 2 files',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const mapMatch = src.match(/PHASE_CONTEXT_MAP\s*=\s*\{([\s\S]*?)\};/);
      assert(mapMatch, 'Should find PHASE_CONTEXT_MAP');
      const checkMatch = mapMatch[1].match(/check:\s*\[([\s\S]*?)\]/);
      assert(checkMatch, 'Should find check array');
      const entries = checkMatch[1].match(/\.md/g);
      assertEqual(entries.length, 2, 'check should have exactly 2 files');
    }
  },
  {
    name: 'SS-13: act phase loads 2 files',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const mapMatch = src.match(/PHASE_CONTEXT_MAP\s*=\s*\{([\s\S]*?)\};/);
      assert(mapMatch, 'Should find PHASE_CONTEXT_MAP');
      const actMatch = mapMatch[1].match(/act:\s*\[([\s\S]*?)\]/);
      assert(actMatch, 'Should find act array');
      const entries = actMatch[1].match(/\.md/g);
      assertEqual(entries.length, 2, 'act should have exactly 2 files');
    }
  },
  {
    name: 'SS-14: idle phase loads 5 files',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const mapMatch = src.match(/PHASE_CONTEXT_MAP\s*=\s*\{([\s\S]*?)\};/);
      assert(mapMatch, 'Should find PHASE_CONTEXT_MAP');
      const idleMatch = mapMatch[1].match(/idle:\s*\[([\s\S]*?)\]/);
      assert(idleMatch, 'Should find idle array');
      const entries = idleMatch[1].match(/\.md/g);
      assertEqual(entries.length, 5, 'idle should have exactly 5 files');
    }
  },
  {
    name: 'SS-15: loadPhaseAwareContext function exists',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'function loadPhaseAwareContext', 'Should define loadPhaseAwareContext function');
    }
  },
  {
    name: 'SS-16: LEVEL_SKILL_WHITELIST exists',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'LEVEL_SKILL_WHITELIST', 'Should contain LEVEL_SKILL_WHITELIST');
    }
  },
  {
    name: 'SS-17: LEVEL_SKILL_WHITELIST Starter has 5 entries',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const wlMatch = src.match(/LEVEL_SKILL_WHITELIST\s*=\s*\{([\s\S]*?)\};/);
      assert(wlMatch, 'Should find LEVEL_SKILL_WHITELIST definition');
      const starterMatch = wlMatch[1].match(/Starter:\s*\[([\s\S]*?)\]/);
      assert(starterMatch, 'Should find Starter array');
      const items = starterMatch[1].match(/'[^']+'/g);
      assertEqual(items.length, 5, 'Starter should have 5 skills');
    }
  },
  {
    name: 'SS-18: LEVEL_SKILL_WHITELIST Dynamic is an array',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const wlMatch = src.match(/LEVEL_SKILL_WHITELIST\s*=\s*\{([\s\S]*?)\};/);
      assert(wlMatch, 'Should find LEVEL_SKILL_WHITELIST definition');
      assertContains(wlMatch[1], 'Dynamic: [', 'Dynamic should be an array');
    }
  },
  {
    name: 'SS-19: LEVEL_SKILL_WHITELIST Enterprise is null (all skills)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const wlMatch = src.match(/LEVEL_SKILL_WHITELIST\s*=\s*\{([\s\S]*?)\};/);
      assert(wlMatch, 'Should find LEVEL_SKILL_WHITELIST definition');
      assertContains(wlMatch[1], 'Enterprise: null', 'Enterprise should be null');
    }
  },
  {
    name: 'SS-20: buildAvailableSkillsSection function exists',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'function buildAvailableSkillsSection', 'Should define buildAvailableSkillsSection');
    }
  },
  {
    name: 'SS-21: buildCoreRules includes Natural Language Feature Request',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'Natural Language Feature Request', 'buildCoreRules should reference Natural Language Feature Request');
    }
  },
  {
    name: 'SS-22: No flags.hasPolicyEngine condition (version guards removed)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assert(!src.includes('flags.hasPolicyEngine'), 'Should not contain flags.hasPolicyEngine (v2.0.0 removed version guards)');
    }
  },
  {
    name: 'SS-23: No flags.hasProjectLevelPolicy condition',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assert(!src.includes('flags.hasProjectLevelPolicy'), 'Should not contain flags.hasProjectLevelPolicy');
    }
  },
  {
    name: 'SS-24: Version string is v2.0.0 (not v1.5.x)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'v2.0.0', 'Should reference v2.0.0');
      assert(!src.includes('v1.5.8') && !src.includes('v1.5.7'), 'Should not reference old v1.5.x versions');
    }
  },
  {
    name: 'SS-25: Source references lib/gemini (not lib/adapters)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "'gemini'", 'Should reference gemini module path');
      // v2.0.0: lib/adapters was removed in favor of lib/gemini
      assert(!src.includes("lib/adapters"), 'Should not reference legacy lib/adapters path');
    }
  },
];

module.exports = { tests };

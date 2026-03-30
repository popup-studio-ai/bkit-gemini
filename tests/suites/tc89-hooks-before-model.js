const { PLUGIN_ROOT, assert, assertEqual, assertContains, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const HOOK_PATH = path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'before-model.js');

const tests = [
  // ═══ TC-89: before-model.js v2.0.0 Features (16 tests) ═══

  {
    name: 'BM-01: before-model.js exists',
    fn: () => {
      assert(fs.existsSync(HOOK_PATH), 'before-model.js should exist');
    }
  },
  {
    name: 'BM-02: MODEL_ROUTING constant exists in source',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'MODEL_ROUTING', 'Should contain MODEL_ROUTING constant');
    }
  },
  {
    name: 'BM-03: MODEL_ROUTING has plan entry',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      assertContains(routingMatch[1], 'plan:', 'MODEL_ROUTING should have plan entry');
    }
  },
  {
    name: 'BM-04: MODEL_ROUTING has design entry',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      assertContains(routingMatch[1], 'design:', 'MODEL_ROUTING should have design entry');
    }
  },
  {
    name: 'BM-05: MODEL_ROUTING has do entry',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      assertContains(routingMatch[1], 'do:', 'MODEL_ROUTING should have do entry');
    }
  },
  {
    name: 'BM-06: MODEL_ROUTING has check entry',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      assertContains(routingMatch[1], 'check:', 'MODEL_ROUTING should have check entry');
    }
  },
  {
    name: 'BM-07: MODEL_ROUTING has act entry',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      assertContains(routingMatch[1], 'act:', 'MODEL_ROUTING should have act entry');
    }
  },
  {
    name: 'BM-08: MODEL_ROUTING has at least 5 entries',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      const entries = routingMatch[1].match(/\w+:\s*\{/g);
      assert(entries && entries.length >= 5, `MODEL_ROUTING should have at least 5 entries, found ${entries ? entries.length : 0}`);
    }
  },
  {
    name: 'BM-09: plan maps to pro model',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      const planMatch = routingMatch[1].match(/plan:\s*\{([\s\S]*?)\}/);
      assert(planMatch, 'Should find plan entry');
      assertContains(planMatch[1], "'pro'", 'plan should map to pro model');
    }
  },
  {
    name: 'BM-10: design maps to pro model',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      const designMatch = routingMatch[1].match(/design:\s*\{([\s\S]*?)\}/);
      assert(designMatch, 'Should find design entry');
      assertContains(designMatch[1], "'pro'", 'design should map to pro model');
    }
  },
  {
    name: 'BM-11: do maps to pro model',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      const doMatch = routingMatch[1].match(/do:\s*\{([\s\S]*?)\}/);
      assert(doMatch, 'Should find do entry');
      assertContains(doMatch[1], "'pro'", 'do should map to pro model');
    }
  },
  {
    name: 'BM-12: check maps to flash model',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      const checkMatch = routingMatch[1].match(/check:\s*\{([\s\S]*?)\}/);
      assert(checkMatch, 'Should find check entry');
      assertContains(checkMatch[1], "'flash'", 'check should map to flash model');
    }
  },
  {
    name: 'BM-13: act maps to flash model',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      const routingMatch = src.match(/MODEL_ROUTING\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/);
      assert(routingMatch, 'Should find MODEL_ROUTING definition');
      const actMatch = routingMatch[1].match(/act:\s*\{([\s\S]*?)\}/);
      assert(actMatch, 'Should find act entry');
      assertContains(actMatch[1], "'flash'", 'act should map to flash model');
    }
  },
  {
    name: 'BM-14: getModelRoutingHint function exists',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'function getModelRoutingHint', 'Should define getModelRoutingHint function');
    }
  },
  {
    name: 'BM-15: extractDocumentAnchors function exists',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'function extractDocumentAnchors', 'Should define extractDocumentAnchors function');
    }
  },
  {
    name: 'BM-16: processHook exists and calls getModelRoutingHint',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, 'function processHook', 'Should define processHook function');
      assertContains(src, 'getModelRoutingHint(', 'processHook should call getModelRoutingHint');
    }
  },
  {
    name: 'BM-17: Source has no claudeToolName reference',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assert(!src.includes('claudeToolName'), 'Should not contain claudeToolName (CC legacy)');
    }
  },
  {
    name: 'BM-18: Source references lib/gemini (not lib/adapters)',
    fn: () => {
      const src = fs.readFileSync(HOOK_PATH, 'utf-8');
      assertContains(src, "'gemini'", 'Should reference gemini module path');
      assert(!src.includes("lib/adapters"), 'Should not reference legacy lib/adapters path');
    }
  },
];

module.exports = { tests };

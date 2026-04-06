const { PLUGIN_ROOT, assert, assertEqual } = require('../test-utils');
const path = require('path');

const { normalizeSkillName } = require(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'utils', 'skill-normalizer'));

const tests = [
  // ═══ TC-112: v0.36.0 Extension Skill Prefix Normalization (PR #23566) ═══

  {
    name: 'SP-01: normalizeSkillName strips bkit: prefix',
    fn: () => {
      assertEqual(normalizeSkillName('bkit:pdca'), 'pdca');
      assertEqual(normalizeSkillName('bkit:code-review'), 'code-review');
      assertEqual(normalizeSkillName('bkit:phase-8-review'), 'phase-8-review');
    }
  },
  {
    name: 'SP-02: normalizeSkillName passes through bare names unchanged',
    fn: () => {
      assertEqual(normalizeSkillName('pdca'), 'pdca');
      assertEqual(normalizeSkillName('code-review'), 'code-review');
    }
  },
  {
    name: 'SP-03: normalizeSkillName handles null/undefined/empty',
    fn: () => {
      assertEqual(normalizeSkillName(null), '');
      assertEqual(normalizeSkillName(undefined), '');
      assertEqual(normalizeSkillName(''), '');
    }
  },
  {
    name: 'SP-04: normalizeSkillName handles non-string input',
    fn: () => {
      assertEqual(normalizeSkillName(123), '');
      assertEqual(normalizeSkillName({}), '');
    }
  },
  {
    name: 'SP-05: normalizeSkillName only strips leading bkit: prefix',
    fn: () => {
      assertEqual(normalizeSkillName('other:pdca'), 'other:pdca', 'Should not strip non-bkit prefix');
      assertEqual(normalizeSkillName('pdca:bkit'), 'pdca:bkit', 'Should not strip trailing bkit');
    }
  },
  {
    name: 'SP-06: normalizeSkillName handles double prefix gracefully',
    fn: () => {
      assertEqual(normalizeSkillName('bkit:bkit:pdca'), 'bkit:pdca', 'Should strip only first bkit: prefix');
    }
  },
];

module.exports = { name: 'tc112-v036-skill-prefix', tests };

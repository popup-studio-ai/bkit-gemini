// TC-44: Agent Integration v1.5.8 Tests (18 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, parseYamlFrontmatter } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');
const EXPECTED_AGENTS = ['gap-detector', 'pdca-iterator', 'code-analyzer', 'report-generator', 'starter-guide',
  'design-validator', 'qa-monitor', 'pipeline-guide', 'bkend-expert', 'enterprise-expert', 'infra-architect',
  'frontend-architect', 'security-architect', 'product-manager', 'qa-strategist', 'cto-lead',
  'pm-lead', 'pm-discovery', 'pm-strategy', 'pm-research', 'pm-prd'];

const tests = [
  {
    name: 'TC44-01: 21개 에이전트 파일 존재',
    fn: () => {
      const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
      assertEqual(files.length, 21, `Should have 21 agents, found ${files.length}`);
    }
  },
  {
    name: 'TC44-02: 모든 예상 에이전트 존재',
    fn: () => {
      let missing = [];
      for (const a of EXPECTED_AGENTS) {
        if (!fs.existsSync(path.join(AGENTS_DIR, `${a}.md`))) missing.push(a);
      }
      assertEqual(missing.length, 0, `Missing agents: ${missing.join(', ')}`);
    }
  },
  {
    name: 'TC44-03: 비-PM 에이전트 Tool Usage Notes 포함',
    fn: () => {
      const pmAgents = ['pm-lead', 'pm-discovery', 'pm-strategy', 'pm-research', 'pm-prd'];
      const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
      const nonPm = files.filter(f => !pmAgents.includes(f.replace('.md', '')));
      let missing = [];
      for (const f of nonPm) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, f), 'utf-8');
        if (!content.includes('Tool Usage Notes') && !content.includes('tool_usage_notes')) missing.push(f);
      }
      assertEqual(missing.length, 0, `Missing Tool Usage Notes: ${missing.join(', ')}`);
    }
  },
  {
    name: 'TC44-04: 에이전트 frontmatter 구조',
    fn: () => {
      let noFrontmatter = [];
      for (const a of EXPECTED_AGENTS) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, `${a}.md`), 'utf-8');
        if (!content.startsWith('---')) noFrontmatter.push(a);
      }
      assertEqual(noFrontmatter.length, 0, `No frontmatter: ${noFrontmatter.join(', ')}`);
    }
  },
  {
    name: 'TC44-05: gap-detector 에이전트 내용',
    fn: () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, 'gap-detector.md'), 'utf-8');
      assertContains(content, 'gap', 'Should reference gap analysis');
    }
  },
  {
    name: 'TC44-06: cto-lead 에이전트 내용',
    fn: () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, 'cto-lead.md'), 'utf-8');
      assertContains(content, 'CTO', 'Should reference CTO');
    }
  },
  {
    name: 'TC44-07: pm-lead 에이전트 내용',
    fn: () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, 'pm-lead.md'), 'utf-8');
      assertContains(content, 'PM', 'Should reference PM');
    }
  },
  {
    name: 'TC44-08: 에이전트 최소 크기 > 200 bytes',
    fn: () => {
      let tooSmall = [];
      for (const a of EXPECTED_AGENTS) {
        const stat = fs.statSync(path.join(AGENTS_DIR, `${a}.md`));
        if (stat.size < 200) tooSmall.push(a);
      }
      assertEqual(tooSmall.length, 0, `Too small: ${tooSmall.join(', ')}`);
    }
  },
  {
    name: 'TC44-09: report-generator 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'report-generator.md'), 'report-generator'); }
  },
  {
    name: 'TC44-10: pdca-iterator 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'pdca-iterator.md'), 'pdca-iterator'); }
  },
  {
    name: 'TC44-11: code-analyzer 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'code-analyzer.md'), 'code-analyzer'); }
  },
  {
    name: 'TC44-12: starter-guide 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'starter-guide.md'), 'starter-guide'); }
  },
  {
    name: 'TC44-13: bkend-expert 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'bkend-expert.md'), 'bkend-expert'); }
  },
  {
    name: 'TC44-14: PM 에이전트 5개 완전성',
    fn: () => {
      const pmAgents = ['pm-lead', 'pm-discovery', 'pm-strategy', 'pm-research', 'pm-prd'];
      for (const a of pmAgents) {
        assertExists(path.join(AGENTS_DIR, `${a}.md`), `PM agent ${a}`);
      }
    }
  },
  {
    name: 'TC44-15: 에이전트 파일 확장자 일관성',
    fn: () => {
      const files = fs.readdirSync(AGENTS_DIR);
      const nonMd = files.filter(f => !f.endsWith('.md') && !f.startsWith('.'));
      assertEqual(nonMd.length, 0, `Non-md files: ${nonMd.join(', ')}`);
    }
  },
  {
    name: 'TC44-16: qa-strategist 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'qa-strategist.md'), 'qa-strategist'); }
  },
  {
    name: 'TC44-17: design-validator 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'design-validator.md'), 'design-validator'); }
  },
  {
    name: 'TC44-18: infra-architect 에이전트 존재',
    fn: () => { assertExists(path.join(AGENTS_DIR, 'infra-architect.md'), 'infra-architect'); }
  }
];

module.exports = { tests };

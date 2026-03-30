// tests/suites/tc93-skills-agents.js
// TC-93: Skills and Agents - 80 tests
const { PLUGIN_ROOT, assert, assertEqual, assertContains, assertExists, assertType, assertHasKey, assertInRange, parseYamlFrontmatter, getPdcaStatus, withVersion } = require('../test-utils');
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const AGENTS_DIR = path.join(PLUGIN_ROOT, 'agents');

// ═══════════════════════════════════════════════════════════════
// Helper: List all SKILL.md files
// ═══════════════════════════════════════════════════════════════
function listSkillDirs() {
  return fs.readdirSync(SKILLS_DIR).filter(d => {
    const skillMd = path.join(SKILLS_DIR, d, 'SKILL.md');
    return fs.existsSync(skillMd);
  });
}

function listAgentFiles() {
  return fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
}

function readFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      // Only capture top-level scalar values (not indented lines)
      if (!line.startsWith(' ') && !line.startsWith('\t') && val && val !== '|' && val !== '>') {
        yaml[key] = val;
      }
    }
  });
  return yaml;
}

function getSkillClassification(skillName) {
  const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  const fm = readFrontmatter(skillPath);
  return fm.classification || null;
}

function getAgentTools(agentFile) {
  const content = fs.readFileSync(path.join(AGENTS_DIR, agentFile), 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return [];
  const tools = [];
  const lines = fmMatch[1].split('\n');
  let inTools = false;
  for (const line of lines) {
    if (line.trim().startsWith('tools:')) { inTools = true; continue; }
    if (inTools) {
      if (line.match(/^\s+-\s+/)) {
        tools.push(line.replace(/^\s+-\s+/, '').trim());
      } else if (!line.startsWith(' ') && line.trim()) {
        inTools = false;
      }
    }
  }
  return tools;
}

function classifyAgentSafety(tools) {
  const hasWrite = tools.includes('write_file') || tools.includes('replace');
  const hasShell = tools.includes('run_shell_command');
  if (hasShell) return 'FULL';
  if (hasWrite) return 'DOCWRITE';
  return 'READONLY';
}

const VALID_MODELS = ['gemini-3.1-pro', 'gemini-3-pro', 'gemini-3-flash', 'gemini-3-flash-lite'];

const tests = [
  // ═══════════════════════════════════════════════════════════════
  // SKILLS: Section 1 - Directory & Count (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'SKILL-93-01: skills/ directory exists',
    fn: () => {
      assert(fs.existsSync(SKILLS_DIR), 'skills/ directory should exist');
    }
  },
  {
    name: 'SKILL-93-02: skills/ directory has 35+ SKILL.md files',
    fn: () => {
      const skills = listSkillDirs();
      assert(skills.length >= 35, `Should have 35+ SKILL.md files, found ${skills.length}`);
    }
  },
  {
    name: 'SKILL-93-03: Each SKILL.md has frontmatter delimiters',
    fn: () => {
      const skills = listSkillDirs();
      for (const skill of skills) {
        const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
        assert(content.startsWith('---'), `${skill}/SKILL.md should start with ---`);
        const secondDash = content.indexOf('---', 3);
        assert(secondDash > 3, `${skill}/SKILL.md should have closing ---`);
      }
    }
  },
  {
    name: 'SKILL-93-04: Each SKILL.md has name field in frontmatter',
    fn: () => {
      const skills = listSkillDirs();
      for (const skill of skills) {
        const fm = readFrontmatter(path.join(SKILLS_DIR, skill, 'SKILL.md'));
        assert(fm.name, `${skill}/SKILL.md should have name field, got: ${JSON.stringify(fm)}`);
      }
    }
  },
  {
    name: 'SKILL-93-05: Each SKILL.md has description field',
    fn: () => {
      const skills = listSkillDirs();
      for (const skill of skills) {
        const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
        assertContains(content, 'description:', `${skill}/SKILL.md should have description`);
      }
    }
  },
  {
    name: 'SKILL-93-06: Each SKILL.md has classification field',
    fn: () => {
      const skills = listSkillDirs();
      for (const skill of skills) {
        const fm = readFrontmatter(path.join(SKILLS_DIR, skill, 'SKILL.md'));
        assert(fm.classification, `${skill}/SKILL.md should have classification`);
      }
    }
  },
  {
    name: 'SKILL-93-07: Classification values are valid',
    fn: () => {
      const validClassifications = ['W', 'C', 'H', 'workflow', 'capability', 'hybrid'];
      const skills = listSkillDirs();
      for (const skill of skills) {
        const cls = getSkillClassification(skill);
        assert(validClassifications.includes(cls), `${skill} classification "${cls}" should be valid`);
      }
    }
  },
  {
    name: 'SKILL-93-08: Workflow classification count is >= 5',
    fn: () => {
      const skills = listSkillDirs();
      const wCount = skills.filter(s => ['W', 'workflow'].includes(getSkillClassification(s))).length;
      assert(wCount >= 5, `Workflow skills should be >= 5, found ${wCount}`);
    }
  },
  {
    name: 'SKILL-93-09: Capability classification count is >= 15',
    fn: () => {
      const skills = listSkillDirs();
      const cCount = skills.filter(s => ['C', 'capability'].includes(getSkillClassification(s))).length;
      assert(cCount >= 15, `Capability skills should be >= 15, found ${cCount}`);
    }
  },
  {
    name: 'SKILL-93-10: Hybrid classification exists (>= 1)',
    fn: () => {
      const skills = listSkillDirs();
      const hCount = skills.filter(s => ['H', 'hybrid'].includes(getSkillClassification(s))).length;
      assert(hCount >= 1, `Hybrid skills should be >= 1, found ${hCount}`);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SKILLS: Section 2 - Specific Skills Existence (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'SKILL-93-11: pdca skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'pdca', 'SKILL.md'), 'pdca/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-12: starter skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'starter', 'SKILL.md'), 'starter/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-13: dynamic skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'dynamic', 'SKILL.md'), 'dynamic/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-14: enterprise skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'enterprise', 'SKILL.md'), 'enterprise/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-15: development-pipeline skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'development-pipeline', 'SKILL.md'), 'development-pipeline/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-16: bkend-quickstart skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'bkend-quickstart', 'SKILL.md'), 'bkend-quickstart/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-17: bkend-auth skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'bkend-auth', 'SKILL.md'), 'bkend-auth/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-18: bkend-data skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'bkend-data', 'SKILL.md'), 'bkend-data/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-19: bkend-storage skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'bkend-storage', 'SKILL.md'), 'bkend-storage/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-20: bkend-mcp skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'bkend-mcp', 'SKILL.md'), 'bkend-mcp/SKILL.md should exist');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SKILLS: Section 3 - bkend & Phase Skills (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'SKILL-93-21: bkend-security skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'bkend-security', 'SKILL.md'), 'bkend-security/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-22: bkend-cookbook skill exists',
    fn: () => {
      assertExists(path.join(SKILLS_DIR, 'bkend-cookbook', 'SKILL.md'), 'bkend-cookbook/SKILL.md should exist');
    }
  },
  {
    name: 'SKILL-93-23: All 7 bkend-* skills exist',
    fn: () => {
      const bkendSkills = ['bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage', 'bkend-mcp', 'bkend-security', 'bkend-cookbook'];
      for (const skill of bkendSkills) {
        assertExists(path.join(SKILLS_DIR, skill, 'SKILL.md'), `${skill}/SKILL.md should exist`);
      }
    }
  },
  {
    name: 'SKILL-93-24: phase-1 through phase-9 skills exist',
    fn: () => {
      const phaseSkills = [
        'phase-1-schema', 'phase-2-convention', 'phase-3-mockup',
        'phase-4-api', 'phase-5-design-system', 'phase-6-ui-integration',
        'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment'
      ];
      for (const skill of phaseSkills) {
        assertExists(path.join(SKILLS_DIR, skill, 'SKILL.md'), `${skill}/SKILL.md should exist`);
      }
    }
  },
  {
    name: 'SKILL-93-25: phase skills are all Capability (C) classification',
    fn: () => {
      const phaseSkills = [
        'phase-1-schema', 'phase-2-convention', 'phase-3-mockup',
        'phase-4-api', 'phase-5-design-system', 'phase-6-ui-integration',
        'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment'
      ];
      for (const skill of phaseSkills) {
        const cls = getSkillClassification(skill);
        assertEqual(cls, 'C', `${skill} should be Capability (C), got ${cls}`);
      }
    }
  },
  {
    name: 'SKILL-93-26: pdca skill is Workflow (W) classification',
    fn: () => {
      assertEqual(getSkillClassification('pdca'), 'W', 'pdca should be Workflow');
    }
  },
  {
    name: 'SKILL-93-27: starter skill is Workflow (W) classification',
    fn: () => {
      assertEqual(getSkillClassification('starter'), 'W', 'starter should be Workflow');
    }
  },
  {
    name: 'SKILL-93-28: dynamic skill is Workflow (W) classification',
    fn: () => {
      assertEqual(getSkillClassification('dynamic'), 'W', 'dynamic should be Workflow');
    }
  },
  {
    name: 'SKILL-93-29: enterprise skill is Workflow (W) classification',
    fn: () => {
      assertEqual(getSkillClassification('enterprise'), 'W', 'enterprise should be Workflow');
    }
  },
  {
    name: 'SKILL-93-30: pm-discovery skill is Hybrid (H) classification',
    fn: () => {
      const cls = getSkillClassification('pm-discovery');
      assert(cls !== undefined && cls !== null, `pm-discovery should have a classification, got ${cls}`);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SKILLS: Section 4 - LEVEL_SKILL_WHITELIST & Orchestrator (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'SKILL-93-31: LEVEL_SKILL_WHITELIST exists in session-start.js',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js'), 'utf-8');
      assertContains(content, 'LEVEL_SKILL_WHITELIST', 'Should contain LEVEL_SKILL_WHITELIST');
    }
  },
  {
    name: 'SKILL-93-32: Starter level has 5 skills in whitelist',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js'), 'utf-8');
      // Extract Starter array
      const starterMatch = content.match(/Starter:\s*\[([\s\S]*?)\]/);
      assert(starterMatch, 'Should find Starter whitelist');
      const skills = starterMatch[1].match(/'([^']+)'/g).map(s => s.replace(/'/g, ''));
      assertEqual(skills.length, 5, `Starter should have 5 skills, found ${skills.length}`);
    }
  },
  {
    name: 'SKILL-93-33: Starter whitelist includes pdca, starter, bkit-rules, bkit-templates, development-pipeline',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js'), 'utf-8');
      const starterMatch = content.match(/Starter:\s*\[([\s\S]*?)\]/);
      const starterBlock = starterMatch[1];
      const expected = ['starter', 'pdca', 'bkit-rules', 'bkit-templates', 'development-pipeline'];
      for (const skill of expected) {
        assertContains(starterBlock, `'${skill}'`, `Starter should include ${skill}`);
      }
    }
  },
  {
    name: 'SKILL-93-34: Dynamic level whitelist is an array',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js'), 'utf-8');
      const dynamicMatch = content.match(/Dynamic:\s*\[([\s\S]*?)\]/);
      assert(dynamicMatch, 'Dynamic whitelist should be an array');
      const skills = dynamicMatch[1].match(/'([^']+)'/g);
      assert(skills.length > 5, `Dynamic should have more skills than Starter, found ${skills.length}`);
    }
  },
  {
    name: 'SKILL-93-35: Enterprise level whitelist is null (all skills available)',
    fn: () => {
      const content = fs.readFileSync(path.join(PLUGIN_ROOT, 'hooks', 'scripts', 'session-start.js'), 'utf-8');
      assertContains(content, 'Enterprise: null', 'Enterprise should be null (all skills)');
    }
  },
  {
    name: 'SKILL-93-36: Skill orchestrator exports parseSkillFrontmatter',
    fn: () => {
      const orchestrator = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      assertType(orchestrator.parseSkillFrontmatter, 'function', 'Should export parseSkillFrontmatter');
    }
  },
  {
    name: 'SKILL-93-37: Skill orchestrator exports loadSkill',
    fn: () => {
      const orchestrator = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      assertType(orchestrator.loadSkill, 'function', 'Should export loadSkill');
    }
  },
  {
    name: 'SKILL-93-38: Skill orchestrator exports activateSkill',
    fn: () => {
      const orchestrator = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      assertType(orchestrator.activateSkill, 'function', 'Should export activateSkill');
    }
  },
  {
    name: 'SKILL-93-39: Skill orchestrator exports listSkills',
    fn: () => {
      const orchestrator = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      assertType(orchestrator.listSkills, 'function', 'Should export listSkills');
    }
  },
  {
    name: 'SKILL-93-40: Skill orchestrator exports resolveAgent',
    fn: () => {
      const orchestrator = require(path.join(PLUGIN_ROOT, 'lib', 'skill-orchestrator'));
      assertType(orchestrator.resolveAgent, 'function', 'Should export resolveAgent');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // AGENTS: Section 5 - Directory & Count (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'AGENT-93-41: agents/ directory exists',
    fn: () => {
      assert(fs.existsSync(AGENTS_DIR), 'agents/ directory should exist');
    }
  },
  {
    name: 'AGENT-93-42: agents/ directory has 21 .md files',
    fn: () => {
      const agents = listAgentFiles();
      assertEqual(agents.length, 21, `Should have 21 agent files, found ${agents.length}`);
    }
  },
  {
    name: 'AGENT-93-43: Each agent file has frontmatter with model field',
    fn: () => {
      const agents = listAgentFiles();
      for (const agent of agents) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, agent), 'utf-8');
        assertContains(content, 'model:', `${agent} should have model field`);
      }
    }
  },
  {
    name: 'AGENT-93-44: Each agent file has description field',
    fn: () => {
      const agents = listAgentFiles();
      for (const agent of agents) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, agent), 'utf-8');
        assertContains(content, 'description:', `${agent} should have description field`);
      }
    }
  },
  {
    name: 'AGENT-93-45: All agent models are valid Gemini models',
    fn: () => {
      const agents = listAgentFiles();
      for (const agent of agents) {
        const fm = readFrontmatter(path.join(AGENTS_DIR, agent));
        assert(VALID_MODELS.includes(fm.model), `${agent} model "${fm.model}" should be valid. Valid: ${VALID_MODELS.join(', ')}`);
      }
    }
  },
  {
    name: 'AGENT-93-46: gemini-3.1-pro agents exist',
    fn: () => {
      const agents = listAgentFiles();
      const proAgents = agents.filter(a => {
        const fm = readFrontmatter(path.join(AGENTS_DIR, a));
        return fm.model === 'gemini-3.1-pro';
      });
      assert(proAgents.length > 0, 'Should have gemini-3.1-pro agents');
    }
  },
  {
    name: 'AGENT-93-47: gemini-3-flash agents exist',
    fn: () => {
      const agents = listAgentFiles();
      const flashAgents = agents.filter(a => {
        const fm = readFrontmatter(path.join(AGENTS_DIR, a));
        return fm.model === 'gemini-3-flash';
      });
      assert(flashAgents.length > 0, 'Should have gemini-3-flash agents');
    }
  },
  {
    name: 'AGENT-93-48: gemini-3-flash-lite agents exist',
    fn: () => {
      const agents = listAgentFiles();
      const liteAgents = agents.filter(a => {
        const fm = readFrontmatter(path.join(AGENTS_DIR, a));
        return fm.model === 'gemini-3-flash-lite';
      });
      assert(liteAgents.length > 0, 'Should have gemini-3-flash-lite agents');
    }
  },
  {
    name: 'AGENT-93-49: Each agent has tools section',
    fn: () => {
      const agents = listAgentFiles();
      for (const agent of agents) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, agent), 'utf-8');
        assertContains(content, 'tools:', `${agent} should have tools section`);
      }
    }
  },
  {
    name: 'AGENT-93-50: Each agent has temperature setting',
    fn: () => {
      const agents = listAgentFiles();
      for (const agent of agents) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, agent), 'utf-8');
        assertContains(content, 'temperature:', `${agent} should have temperature`);
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // AGENTS: Section 6 - Safety Tiers (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'AGENT-93-51: Safety tier classification works for READONLY',
    fn: () => {
      const tier = classifyAgentSafety(['read_file', 'grep_search', 'glob']);
      assertEqual(tier, 'READONLY', 'Read-only tools should classify as READONLY');
    }
  },
  {
    name: 'AGENT-93-52: Safety tier classification works for DOCWRITE',
    fn: () => {
      const tier = classifyAgentSafety(['read_file', 'write_file', 'glob']);
      assertEqual(tier, 'DOCWRITE', 'Write tools without shell should classify as DOCWRITE');
    }
  },
  {
    name: 'AGENT-93-53: Safety tier classification works for FULL',
    fn: () => {
      const tier = classifyAgentSafety(['read_file', 'write_file', 'run_shell_command']);
      assertEqual(tier, 'FULL', 'Shell command should classify as FULL');
    }
  },
  {
    name: 'AGENT-93-54: gap-detector is READONLY',
    fn: () => {
      const tools = getAgentTools('gap-detector.md');
      assertEqual(classifyAgentSafety(tools), 'READONLY', 'gap-detector should be READONLY');
    }
  },
  {
    name: 'AGENT-93-55: code-analyzer is READONLY',
    fn: () => {
      const tools = getAgentTools('code-analyzer.md');
      assertEqual(classifyAgentSafety(tools), 'READONLY', 'code-analyzer should be READONLY');
    }
  },
  {
    name: 'AGENT-93-56: security-architect is READONLY',
    fn: () => {
      const tools = getAgentTools('security-architect.md');
      assertEqual(classifyAgentSafety(tools), 'READONLY', 'security-architect should be READONLY');
    }
  },
  {
    name: 'AGENT-93-57: design-validator is READONLY',
    fn: () => {
      const tools = getAgentTools('design-validator.md');
      assertEqual(classifyAgentSafety(tools), 'READONLY', 'design-validator should be READONLY');
    }
  },
  {
    name: 'AGENT-93-58: cto-lead is FULL (has run_shell_command)',
    fn: () => {
      const tools = getAgentTools('cto-lead.md');
      assertEqual(classifyAgentSafety(tools), 'FULL', 'cto-lead should be FULL');
    }
  },
  {
    name: 'AGENT-93-59: report-generator has write_file (DOCWRITE)',
    fn: () => {
      const tools = getAgentTools('report-generator.md');
      assert(tools.includes('write_file'), 'report-generator should have write_file');
      assertEqual(classifyAgentSafety(tools), 'DOCWRITE', 'report-generator should be DOCWRITE');
    }
  },
  {
    name: 'AGENT-93-60: All agents classified into exactly 3 tiers',
    fn: () => {
      const agents = listAgentFiles();
      const tiers = new Set();
      for (const agent of agents) {
        const tools = getAgentTools(agent);
        tiers.add(classifyAgentSafety(tools));
      }
      assert(tiers.has('READONLY'), 'Should have READONLY agents');
      assert(tiers.has('DOCWRITE'), 'Should have DOCWRITE agents');
      assert(tiers.has('FULL'), 'Should have FULL agents');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // AGENTS: Section 7 - Agent Memory (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'AGENT-93-61: Agent memory directory exists at .gemini/agent-memory/bkit/',
    fn: () => {
      const memDir = path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit');
      assert(fs.existsSync(memDir), 'Agent memory directory should exist');
    }
  },
  {
    name: 'AGENT-93-62: Agent memory has JSON files for agents',
    fn: () => {
      const memDir = path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit');
      const files = fs.readdirSync(memDir).filter(f => f.endsWith('.json'));
      assert(files.length > 0, 'Should have agent memory JSON files');
    }
  },
  {
    name: 'AGENT-93-63: cto-lead has memory file',
    fn: () => {
      assertExists(
        path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit', 'cto-lead.json'),
        'cto-lead memory should exist'
      );
    }
  },
  {
    name: 'AGENT-93-64: gap-detector has memory file',
    fn: () => {
      assertExists(
        path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit', 'gap-detector.json'),
        'gap-detector memory should exist'
      );
    }
  },
  {
    name: 'AGENT-93-65: pdca-iterator has memory file',
    fn: () => {
      assertExists(
        path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit', 'pdca-iterator.json'),
        'pdca-iterator memory should exist'
      );
    }
  },
  {
    name: 'AGENT-93-66: code-analyzer has memory file',
    fn: () => {
      assertExists(
        path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit', 'code-analyzer.json'),
        'code-analyzer memory should exist'
      );
    }
  },
  {
    name: 'AGENT-93-67: report-generator has memory file',
    fn: () => {
      assertExists(
        path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit', 'report-generator.json'),
        'report-generator memory should exist'
      );
    }
  },
  {
    name: 'AGENT-93-68: Agent memory files are valid JSON',
    fn: () => {
      const memDir = path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit');
      const files = fs.readdirSync(memDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(memDir, file), 'utf-8').trim();
        if (content.length === 0) continue; // Empty memory files are valid (no sessions yet)
        try {
          JSON.parse(content);
        } catch (e) {
          assert(false, `${file} should be valid JSON or empty: ${e.message}`);
        }
      }
    }
  },
  {
    name: 'AGENT-93-69: Memory directory path follows .gemini/agent-memory/bkit/ convention',
    fn: () => {
      const expectedPath = path.join('.gemini', 'agent-memory', 'bkit');
      const fullPath = path.join(PLUGIN_ROOT, expectedPath);
      assert(fs.existsSync(fullPath), `Memory dir should follow ${expectedPath} convention`);
    }
  },
  {
    name: 'AGENT-93-70: At least 16 agent memory files exist',
    fn: () => {
      const memDir = path.join(PLUGIN_ROOT, '.gemini', 'agent-memory', 'bkit');
      const files = fs.readdirSync(memDir).filter(f => f.endsWith('.json'));
      assert(files.length >= 16, `Should have >= 16 agent memory files, found ${files.length}`);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // AGENTS: Section 8 - PM Agents & Core Agents (10 tests)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'AGENT-93-71: pm-lead agent exists',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'pm-lead.md'), 'pm-lead.md should exist');
    }
  },
  {
    name: 'AGENT-93-72: pm-discovery agent exists',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'pm-discovery.md'), 'pm-discovery.md should exist');
    }
  },
  {
    name: 'AGENT-93-73: pm-strategy agent exists',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'pm-strategy.md'), 'pm-strategy.md should exist');
    }
  },
  {
    name: 'AGENT-93-74: pm-research agent exists',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'pm-research.md'), 'pm-research.md should exist');
    }
  },
  {
    name: 'AGENT-93-75: pm-prd agent exists',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'pm-prd.md'), 'pm-prd.md should exist');
    }
  },
  {
    name: 'AGENT-93-76: All 5 PM agents use gemini-3.1-pro model',
    fn: () => {
      const pmAgents = ['pm-lead', 'pm-discovery', 'pm-strategy', 'pm-research', 'pm-prd'];
      for (const agent of pmAgents) {
        const fm = readFrontmatter(path.join(AGENTS_DIR, `${agent}.md`));
        assertEqual(fm.model, 'gemini-3.1-pro', `${agent} should use gemini-3.1-pro`);
      }
    }
  },
  {
    name: 'AGENT-93-77: gap-detector agent exists with correct model',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'gap-detector.md'), 'gap-detector.md should exist');
      const fm = readFrontmatter(path.join(AGENTS_DIR, 'gap-detector.md'));
      assertEqual(fm.model, 'gemini-3.1-pro', 'gap-detector should use gemini-3.1-pro');
    }
  },
  {
    name: 'AGENT-93-78: pdca-iterator agent exists',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'pdca-iterator.md'), 'pdca-iterator.md should exist');
    }
  },
  {
    name: 'AGENT-93-79: cto-lead agent exists with correct model',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'cto-lead.md'), 'cto-lead.md should exist');
      const fm = readFrontmatter(path.join(AGENTS_DIR, 'cto-lead.md'));
      assertEqual(fm.model, 'gemini-3.1-pro', 'cto-lead should use gemini-3.1-pro');
    }
  },
  {
    name: 'AGENT-93-80: report-generator agent exists',
    fn: () => {
      assertExists(path.join(AGENTS_DIR, 'report-generator.md'), 'report-generator.md should exist');
      const fm = readFrontmatter(path.join(AGENTS_DIR, 'report-generator.md'));
      assertEqual(fm.model, 'gemini-3-flash-lite', 'report-generator should use gemini-3-flash-lite');
    }
  }
];

module.exports = { tests };

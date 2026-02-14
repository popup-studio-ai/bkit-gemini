const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function verifyComponents() {
  console.log('Starting Component Tests...');
  const rootDir = path.resolve(__dirname, '..');

  try {
    // --- Skills Tests ---
    console.log('Testing Skills...');
    const skillsDir = path.join(rootDir, 'skills');
    const skills = fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());
    
    // Check specific skills from plan
    const requiredSkills = [
      'pdca', 'starter', 'dynamic', 'enterprise',
      'development-pipeline', 'phase-1-schema', 'phase-9-deployment',
      'code-review', 'gemini-cli-learning',
      'bkend-quickstart', 'bkend-auth', 'bkend-data', 'bkend-storage',
      'bkend-mcp', 'bkend-security', 'bkend-cookbook', 'bkend-guides'
    ];
    
    requiredSkills.forEach(skill => {
      assert.ok(skills.includes(skill), `Missing skill: ${skill}`);
      const skillFile = path.join(skillsDir, skill, 'SKILL.md');
      assert.ok(fs.existsSync(skillFile), `Missing SKILL.md for ${skill}`);
      
      // Basic Frontmatter check
      const content = fs.readFileSync(skillFile, 'utf8');
      assert.ok(content.startsWith('---') || content.includes('name:'), `SKILL.md for ${skill} should have YAML frontmatter`);
    });
    console.log(`PASS: Verified ${skills.length} skills`);


    // --- Agents Tests ---
    console.log('Testing Agents...');
    const agentsDir = path.join(rootDir, 'agents');
    const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    
    const requiredAgents = [
      'gap-detector', 'design-validator', 'pdca-iterator', 
      'report-generator', 'code-analyzer', 'qa-monitor',
      'starter-guide', 'pipeline-guide', 'bkend-expert'
    ];
    
    requiredAgents.forEach(agent => {
        const agentFile = `${agent}.md`;
        assert.ok(agents.includes(agentFile), `Missing agent: ${agentFile}`);
        
        // Check content
        const content = fs.readFileSync(path.join(agentsDir, agentFile), 'utf8');
        assert.ok(content.length > 0, `Agent file empty: ${agentFile}`);
    });
    console.log(`PASS: Verified ${agents.length} agents`);

  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

verifyComponents();

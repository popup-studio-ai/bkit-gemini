#!/usr/bin/env node
/**
 * BeforeAgent Hook - Intent Detection
 * Detects user intent, triggers, and provides context before agent processing
 * Dual-mode: handler export (v0.31.0+ SDK) + stdin command (legacy)
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');
const intent = require(path.join(libPath, 'intent'));

// --- Core processing logic ---
function processHook(input) {
  try {
    // v0.35.0 compat (#18514): unwrap nested data envelope if present
    const base = (input && (input.data || input.result)) || input || {};
    const prompt = base.prompt || base.user_message || base.message ||
                   input.prompt || input.user_message || input.message || '';

    if (!prompt || prompt.length < 3) {
      return { decision: 'allow' };
    }

    const contexts = [];

    const agentMatch = intent.matchImplicitAgentTrigger(prompt);
    if (agentMatch) {
      contexts.push(`**Detected Agent Trigger**: ${agentMatch.agent} (confidence: ${agentMatch.confidence})`);
    }

    const skillMatch = intent.matchImplicitSkillTrigger(prompt);
    if (skillMatch) {
      contexts.push(`**Detected Skill Trigger**: ${skillMatch.skill} (level: ${skillMatch.level})`);
    }

    const featureIntent = intent.detectNewFeatureIntent(prompt);
    if (featureIntent.isNewFeature) {
      contexts.push(`**New Feature Detected**: "${featureIntent.featureName}" - Consider starting PDCA with /pdca plan ${featureIntent.featureName}`);
    }

    const ambiguityScore = intent.calculateAmbiguityScore(prompt);
    if (ambiguityScore > 50) {
      contexts.push('**Note**: Request may be ambiguous. Consider asking clarifying questions.');
    }

    if (contexts.length > 0) {
      return { decision: 'allow', systemMessage: contexts.join('\n') };
    }
    return { decision: 'allow' };
  } catch (error) {
    return { decision: 'allow' };
  }
}

// --- RuntimeHook function export (v0.31.0+ SDK) ---
async function handler(event) {
  return processHook(event);
}

// --- Legacy command mode ---
function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'gemini', 'platform'));
    const adapter = getAdapter();
    const input = adapter.readHookInput();
    const result = processHook(input);

    if (result.systemMessage) {
      adapter.outputAllow(result.systemMessage, 'BeforeAgent');
    } else {
      adapter.outputEmpty();
    }
  } catch (error) {
    process.exit(0);
  }
}

if (require.main === module) { main(); }

module.exports = { handler };

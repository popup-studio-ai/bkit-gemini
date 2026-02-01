#!/usr/bin/env node
/**
 * BeforeAgent Hook - Intent Detection
 * Detects user intent, triggers, and provides context before agent processing
 */
const fs = require('fs');
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', 'lib');

function main() {
  try {
    const { getAdapter } = require(path.join(libPath, 'adapters'));
    const adapter = getAdapter();

    // Read input from stdin
    const input = adapter.readHookInput();
    const prompt = input.prompt || input.user_message || input.message || '';

    if (!prompt || prompt.length < 3) {
      adapter.outputEmpty();
      return;
    }

    const contexts = [];

    // 1. Detect agent triggers
    const agentMatch = matchAgentTrigger(prompt);
    if (agentMatch) {
      contexts.push(`**Detected Agent Trigger**: ${agentMatch.agent} (confidence: ${agentMatch.confidence})`);
    }

    // 2. Detect skill triggers
    const skillMatch = matchSkillTrigger(prompt);
    if (skillMatch) {
      contexts.push(`**Detected Skill Trigger**: ${skillMatch.skill} (level: ${skillMatch.level})`);
    }

    // 3. Detect new feature intent
    const featureIntent = detectFeatureIntent(prompt);
    if (featureIntent.isNewFeature) {
      contexts.push(`**New Feature Detected**: "${featureIntent.featureName}" - Consider starting PDCA with /pdca plan ${featureIntent.featureName}`);
    }

    // 4. Calculate ambiguity
    const ambiguityScore = calculateAmbiguity(prompt);
    if (ambiguityScore > 0.5) {
      contexts.push('**Note**: Request may be ambiguous. Consider asking clarifying questions.');
    }

    if (contexts.length > 0) {
      adapter.outputAllow(contexts.join('\n'), 'BeforeAgent');
    } else {
      adapter.outputEmpty();
    }

  } catch (error) {
    // Silent fail
    process.exit(0);
  }
}

// Agent trigger patterns (8 languages)
const AGENT_TRIGGERS = {
  'gap-detector': [
    'verify', 'check', 'validate', 'gap', 'compare',
    '검증', '확인', '비교', '갭',
    '確認', '検証', '比較',
    '验证', '检查', '对比',
    'verificar', 'comprobar',
    'vérifier', 'comparer',
    'überprüfen', 'vergleichen',
    'verificare', 'confrontare'
  ],
  'pdca-iterator': [
    'improve', 'iterate', 'fix', 'enhance', 'optimize',
    '개선', '반복', '수정', '최적화',
    '改善', '反復', '修正',
    '改进', '优化', '修复',
    'mejorar', 'optimizar',
    'améliorer', 'optimiser',
    'verbessern', 'optimieren',
    'migliorare', 'ottimizzare'
  ],
  'code-analyzer': [
    'analyze', 'quality', 'review', 'security', 'scan',
    '분석', '품질', '리뷰', '보안',
    '分析', '品質', 'レビュー',
    '分析', '质量', '审查',
    'analizar', 'calidad',
    'analyser', 'qualité',
    'analysieren', 'Qualität',
    'analizzare', 'qualità'
  ],
  'report-generator': [
    'report', 'summary', 'complete', 'finish',
    '보고서', '요약', '완료',
    '報告', 'レポート', '完了',
    '报告', '总结', '完成',
    'informe', 'resumen',
    'rapport', 'résumé',
    'Bericht', 'Zusammenfassung',
    'rapporto', 'riepilogo'
  ]
};

function matchAgentTrigger(text) {
  const lowerText = text.toLowerCase();

  for (const [agent, triggers] of Object.entries(AGENT_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        return { agent, confidence: 0.8 };
      }
    }
  }

  return null;
}

// Skill trigger patterns
const SKILL_TRIGGERS = {
  'starter': ['static', 'portfolio', 'landing', 'html', 'css', '정적', '포트폴리오'],
  'dynamic': ['fullstack', 'login', 'auth', 'database', 'api', '풀스택', '로그인', '인증'],
  'enterprise': ['microservices', 'kubernetes', 'terraform', 'k8s', '마이크로서비스']
};

function matchSkillTrigger(text) {
  const lowerText = text.toLowerCase();

  for (const [skill, triggers] of Object.entries(SKILL_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        return {
          skill,
          level: skill.charAt(0).toUpperCase() + skill.slice(1),
          confidence: 0.75
        };
      }
    }
  }

  return null;
}

function detectFeatureIntent(text) {
  const featurePatterns = [
    /(?:create|build|make|add|implement|develop)\s+(?:a\s+)?(?:new\s+)?([a-z-]+(?:\s+[a-z-]+)?)\s*(?:feature|function|module)?/i,
    /(?:기능|모듈|페이지)(?:를|을)?\s*(?:만들|추가|개발|구현)/,
    /新(?:機能|機能を|しい)/
  ];

  for (const pattern of featurePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        isNewFeature: true,
        featureName: match[1]?.replace(/\s+/g, '-').toLowerCase() || 'new-feature',
        confidence: 0.8
      };
    }
  }

  return { isNewFeature: false, featureName: null, confidence: 0 };
}

function calculateAmbiguity(text) {
  let score = 0;

  // Short messages are often ambiguous
  if (text.length < 20) score += 0.2;

  // Missing specific nouns
  if (!/\b(file|component|function|api|page|feature)\b/i.test(text)) score += 0.2;

  // Multiple interpretations possible
  if (/\b(or|either|maybe|might|could)\b/i.test(text)) score += 0.2;

  // No technical terms
  if (!/\b(code|bug|error|test|deploy|build)\b/i.test(text)) score += 0.2;

  return Math.min(score, 1);
}

main();

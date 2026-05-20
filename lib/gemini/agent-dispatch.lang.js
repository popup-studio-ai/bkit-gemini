/**
 * agent-dispatch.lang.js — 8-language natural-language patterns for agent invocation
 *
 * Sprint: S3 v2.0.7-agent-dispatch-fix (Wave 1, Plan §6.1 D2~D5)
 * Design: docs/01-plan/sprints/v2.0.7-agent-dispatch-fix-design.md §4 매처 + §5 catalog
 * Spec: AC-A1~A5 (Track A natural-language matcher), 8 lang consistency
 *
 * Patterns capture two groups:
 *   $1 = agent name (lowercase letters + hyphens)
 *   $2 = task description (everything after the verb)
 *
 * Cross-OS: pure JS regex literal. macOS / Windows / Linux 동일.
 */
'use strict';

// Each language has a sample-validated regex + label.
// Conservative: case-insensitive, no fuzzy matching.
const LANG_PATTERNS = [
  {
    lang: 'en',
    // "Use the code-analyzer agent to evaluate ..."
    regex: /^\s*(?:Use|Invoke|Spawn|Call|Run)\s+(?:the\s+)?([a-z][a-z0-9-]+)\s+(?:agent|subagent)\s+(?:to\s+|for\s+|and\s+)?(.+)$/i,
    sample: 'Use the code-analyzer agent to evaluate this code'
  },
  {
    lang: 'ko',
    // "code-analyzer 에이전트로 ~ 평가해줘"
    regex: /^\s*([a-z][a-z0-9-]+)\s*에이전트(?:를|로|로서|에게)?\s*(.+?)(?:해줘|해주세요|해\s*다오|부탁해|해|줘)?\s*$/i,
    sample: 'code-analyzer 에이전트로 이 코드 평가해줘'
  },
  {
    lang: 'ja',
    // "code-analyzer エージェント で ..."
    regex: /^\s*([a-z][a-z0-9-]+)\s*(?:エージェント|サブエージェント)(?:を|で|に)?\s*(?:使って|呼んで|起動して)?\s*(.+?)(?:してください|して|お願いします|頼む)?\s*$/i,
    sample: 'code-analyzer エージェントで このコードを評価して'
  },
  {
    lang: 'zh',
    // "使用 code-analyzer 代理 ..."
    regex: /^\s*(?:使用|调用|启动|运行)\s*([a-z][a-z0-9-]+)\s*(?:代理|子代理|智能体)\s*(?:来|去|为)?\s*(.+?)\s*$/i,
    sample: '使用 code-analyzer 代理来评估这段代码'
  },
  {
    lang: 'es',
    // "Usar el agente code-analyzer para ..."
    regex: /^\s*(?:Usar|Usa|Invocar|Llamar|Lanzar)\s+(?:el|al)\s+agente\s+([a-z][a-z0-9-]+)\s+(?:para|que|y)\s+(.+)$/i,
    sample: 'Usar el agente code-analyzer para evaluar este código'
  },
  {
    lang: 'fr',
    // "Utiliser l'agent code-analyzer pour ..."
    regex: /^\s*(?:Utiliser|Utilise|Invoquer|Appeler|Lancer)\s+(?:l['']|le\s+)agent\s+([a-z][a-z0-9-]+)\s+(?:pour|qui|et)\s+(.+)$/i,
    sample: "Utiliser l'agent code-analyzer pour évaluer ce code"
  },
  {
    lang: 'de',
    // "Verwende den code-analyzer Agenten für ..."
    regex: /^\s*(?:Verwende|Verwenden|Nutze|Starte|Rufe)\s+(?:den|das|die)?\s*([a-z][a-z0-9-]+)\s+(?:Agenten|Sub-Agenten|Agent)\s+(?:für|um|zu)\s+(.+)$/i,
    sample: 'Verwende den code-analyzer Agenten für die Bewertung'
  },
  {
    lang: 'it',
    // "Usa l'agente code-analyzer per ..."
    regex: /^\s*(?:Usa|Usare|Invocare|Chiamare|Avviare)\s+(?:l['']|il\s+)agente\s+([a-z][a-z0-9-]+)\s+(?:per|che|e)\s+(.+)$/i,
    sample: "Usa l'agente code-analyzer per valutare questo codice"
  }
];

/**
 * Attempt to match a user prompt against any language pattern.
 * @returns {{ lang: string, agent: string, task: string }|null}
 */
function matchAny(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;
  for (const { lang, regex } of LANG_PATTERNS) {
    const m = regex.exec(prompt);
    if (m && m[1]) {
      return {
        lang,
        agent: m[1].toLowerCase(),
        task: (m[2] || '').trim()
      };
    }
  }
  return null;
}

module.exports = { LANG_PATTERNS, matchAny };

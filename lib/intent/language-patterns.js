/**
 * 8-Language Auto-Trigger Patterns
 * Maps keywords in 8 languages to agent/skill triggers
 * @version 2.0.2
 */
const LANGUAGE_PATTERNS = {
  'gap-detector': {
    en: ['verify', 'check implementation', 'gap analysis'],
    ko: ['검증', '확인', '갭 분석'],
    ja: ['確認', '検証', 'ギャップ分析'],
    zh: ['验证', '确认', '差距分析'],
    es: ['verificar', 'comprobar'],
    fr: ['vérifier', 'contrôler'],
    de: ['prüfen', 'verifizieren'],
    it: ['verificare', 'controllare']
  },
  'pdca-iterator': {
    en: ['improve', 'iterate', 'auto-fix', 'optimize'],
    ko: ['개선', '반복', '자동 수정'],
    ja: ['改善', '反復', '自動修正'],
    zh: ['改进', '迭代', '自动修复'],
    es: ['mejorar', 'iterar'],
    fr: ['améliorer', 'itérer'],
    de: ['verbessern', 'iterieren'],
    it: ['migliorare', 'iterare']
  },
  'code-analyzer': {
    en: ['analyze', 'code review', 'quality check'],
    ko: ['분석', '코드 리뷰', '품질 검사'],
    ja: ['分析', 'コードレビュー', '品質チェック'],
    zh: ['分析', '代码审查', '质量检查'],
    es: ['analizar', 'revisión de código'],
    fr: ['analyser', 'revue de code'],
    de: ['analysieren', 'Code-Review'],
    it: ['analizzare', 'revisione codice']
  },
  'report-generator': {
    en: ['report', 'summary', 'status'],
    ko: ['보고서', '요약', '상태'],
    ja: ['報告', '要約', '状況'],
    zh: ['报告', '摘要', '状态'],
    es: ['informe', 'resumen'],
    fr: ['rapport', 'résumé'],
    de: ['Bericht', 'Zusammenfassung'],
    it: ['rapporto', 'riepilogo']
  },
  'starter-guide': {
    en: ['beginner', 'help', 'first project'],
    ko: ['초보자', '도움', '처음'],
    ja: ['初心者', '助けて', '初めて'],
    zh: ['新手', '帮助', '第一次'],
    es: ['principiante', 'ayuda'],
    fr: ['débutant', 'aide'],
    de: ['Anfänger', 'Hilfe'],
    it: ['principiante', 'aiuto']
  },
  'bkend-expert': {
    en: ['bkend', 'BaaS', 'backend service', 'authentication', 'login'],
    ko: ['백엔드', '인증', '로그인'],
    ja: ['バックエンド', '認証', 'ログイン'],
    zh: ['后端', '认证', '登录'],
    es: ['autenticación', 'inicio de sesión'],
    fr: ['authentification', 'connexion'],
    de: ['Authentifizierung', 'Anmeldung'],
    it: ['autenticazione', 'accesso']
  },
  'pm-lead': {
    en: ['pm', 'PRD', 'product discovery', 'PM analysis'],
    ko: ['PM 분석', '제품 기획', 'PM팀'],
    ja: ['PM分析', 'プロダクト分析'],
    zh: ['PM分析', '产品分析'],
    es: ['análisis PM'],
    fr: ['analyse PM'],
    de: ['PM-Analyse'],
    it: ['analisi PM']
  }
};

function getTriggersForLanguage(lang) {
  const result = {};
  for (const [agent, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    if (patterns[lang]) {
      result[agent] = patterns[lang];
    }
  }
  return result;
}

function findMatchingAgent(text) {
  const normalizedText = text.toLowerCase();
  for (const [agent, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const langPatterns of Object.values(patterns)) {
      for (const pattern of langPatterns) {
        if (normalizedText.includes(pattern.toLowerCase())) {
          return agent;
        }
      }
    }
  }
  return null;
}

module.exports = { LANGUAGE_PATTERNS, getTriggersForLanguage, findMatchingAgent };

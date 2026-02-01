/**
 * Multi-Language Support
 * Provides pattern matching for 8 languages
 */

/**
 * Supported languages
 */
const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it'];

/**
 * Agent trigger patterns by language
 */
const AGENT_TRIGGER_PATTERNS = {
  'gap-detector': {
    en: ['verify', 'check', 'validate', 'gap', 'compare', 'match rate'],
    ko: ['검증', '확인', '비교', '갭', '매치율', '일치율'],
    ja: ['確認', '検証', '比較', 'ギャップ', '一致率'],
    zh: ['验证', '检查', '对比', '差距', '匹配率'],
    es: ['verificar', 'comprobar', 'validar', 'comparar'],
    fr: ['vérifier', 'comparer', 'valider', 'écart'],
    de: ['überprüfen', 'vergleichen', 'validieren', 'Lücke'],
    it: ['verificare', 'confrontare', 'validare', 'divario']
  },
  'pdca-iterator': {
    en: ['improve', 'iterate', 'fix', 'enhance', 'optimize', 'refine'],
    ko: ['개선', '반복', '수정', '최적화', '향상', '고쳐'],
    ja: ['改善', '反復', '修正', '最適化', '向上'],
    zh: ['改进', '优化', '修复', '迭代', '提升'],
    es: ['mejorar', 'optimizar', 'arreglar', 'iterar'],
    fr: ['améliorer', 'optimiser', 'corriger', 'itérer'],
    de: ['verbessern', 'optimieren', 'reparieren', 'iterieren'],
    it: ['migliorare', 'ottimizzare', 'correggere', 'iterare']
  },
  'code-analyzer': {
    en: ['analyze', 'quality', 'review', 'security', 'scan', 'audit'],
    ko: ['분석', '품질', '리뷰', '보안', '스캔', '감사'],
    ja: ['分析', '品質', 'レビュー', 'セキュリティ', '監査'],
    zh: ['分析', '质量', '审查', '安全', '扫描'],
    es: ['analizar', 'calidad', 'revisar', 'seguridad'],
    fr: ['analyser', 'qualité', 'revoir', 'sécurité'],
    de: ['analysieren', 'Qualität', 'überprüfen', 'Sicherheit'],
    it: ['analizzare', 'qualità', 'revisionare', 'sicurezza']
  },
  'report-generator': {
    en: ['report', 'summary', 'complete', 'finish', 'conclude'],
    ko: ['보고서', '요약', '완료', '마무리', '정리'],
    ja: ['報告', 'レポート', '完了', '終了', 'まとめ'],
    zh: ['报告', '总结', '完成', '结束', '汇总'],
    es: ['informe', 'resumen', 'completar', 'finalizar'],
    fr: ['rapport', 'résumé', 'terminer', 'conclure'],
    de: ['Bericht', 'Zusammenfassung', 'abschließen', 'beenden'],
    it: ['rapporto', 'riepilogo', 'completare', 'concludere']
  },
  'starter-guide': {
    en: ['help', 'guide', 'beginner', 'start', 'learn', 'tutorial'],
    ko: ['도움', '가이드', '초보', '시작', '배우기', '튜토리얼'],
    ja: ['助けて', 'ガイド', '初心者', '始める', '学ぶ'],
    zh: ['帮助', '指南', '初学者', '开始', '学习'],
    es: ['ayuda', 'guía', 'principiante', 'empezar', 'aprender'],
    fr: ['aide', 'guide', 'débutant', 'commencer', 'apprendre'],
    de: ['Hilfe', 'Anleitung', 'Anfänger', 'beginnen', 'lernen'],
    it: ['aiuto', 'guida', 'principiante', 'iniziare', 'imparare']
  }
};

/**
 * Skill trigger patterns by language
 */
const SKILL_TRIGGER_PATTERNS = {
  'starter': {
    en: ['static', 'portfolio', 'landing', 'html', 'css', 'simple web'],
    ko: ['정적', '포트폴리오', '랜딩', '간단한', '웹사이트'],
    ja: ['静的', 'ポートフォリオ', 'ランディング', 'シンプル'],
    zh: ['静态', '作品集', '落地页', '简单', '网站'],
    es: ['estático', 'portafolio', 'página de inicio'],
    fr: ['statique', 'portfolio', 'page d\'accueil'],
    de: ['statisch', 'Portfolio', 'Landingpage'],
    it: ['statico', 'portfolio', 'pagina di destinazione']
  },
  'dynamic': {
    en: ['fullstack', 'login', 'auth', 'database', 'api', 'backend', 'signup'],
    ko: ['풀스택', '로그인', '인증', '데이터베이스', '백엔드', '회원가입'],
    ja: ['フルスタック', 'ログイン', '認証', 'データベース', 'バックエンド'],
    zh: ['全栈', '登录', '身份验证', '数据库', '后端', '注册'],
    es: ['fullstack', 'inicio de sesión', 'autenticación', 'base de datos'],
    fr: ['fullstack', 'connexion', 'authentification', 'base de données'],
    de: ['Fullstack', 'Anmeldung', 'Authentifizierung', 'Datenbank'],
    it: ['fullstack', 'accesso', 'autenticazione', 'database']
  },
  'enterprise': {
    en: ['microservices', 'kubernetes', 'terraform', 'k8s', 'infrastructure'],
    ko: ['마이크로서비스', '쿠버네티스', '테라폼', '인프라'],
    ja: ['マイクロサービス', 'クバネティス', 'テラフォーム', 'インフラ'],
    zh: ['微服务', 'kubernetes', 'terraform', '基础设施'],
    es: ['microservicios', 'kubernetes', 'terraform', 'infraestructura'],
    fr: ['microservices', 'kubernetes', 'terraform', 'infrastructure'],
    de: ['Microservices', 'Kubernetes', 'Terraform', 'Infrastruktur'],
    it: ['microservizi', 'kubernetes', 'terraform', 'infrastruttura']
  },
  'mobile-app': {
    en: ['mobile', 'react native', 'flutter', 'ios', 'android', 'expo'],
    ko: ['모바일', '리액트 네이티브', '플러터', '앱'],
    ja: ['モバイル', 'React Native', 'Flutter', 'アプリ'],
    zh: ['移动', 'React Native', 'Flutter', '应用'],
    es: ['móvil', 'react native', 'flutter', 'aplicación'],
    fr: ['mobile', 'react native', 'flutter', 'application'],
    de: ['mobil', 'React Native', 'Flutter', 'App'],
    it: ['mobile', 'react native', 'flutter', 'applicazione']
  }
};

/**
 * Detect language from text
 * @param {string} text
 * @returns {string}
 */
function detectLanguage(text) {
  // Korean characters
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';

  // Japanese (Hiragana, Katakana, Kanji)
  if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(text) && !/[\u4E00-\u9FFF]{3,}/.test(text)) return 'ja';

  // Chinese (mostly Hanzi)
  if (/[\u4E00-\u9FFF]{2,}/.test(text)) return 'zh';

  // Spanish indicators
  if (/[áéíóúñ¿¡]/.test(text)) return 'es';

  // French indicators
  if (/[àâçéèêëïîôùûüœæ]/.test(text)) return 'fr';

  // German indicators
  if (/[äöüß]/.test(text)) return 'de';

  // Italian indicators
  if (/[àèéìòù]/.test(text) && !/[áíóú]/.test(text)) return 'it';

  // Default to English
  return 'en';
}

/**
 * Get all patterns for a pattern map
 * @param {object} patternMap
 * @returns {string[]}
 */
function getAllPatterns(patternMap) {
  return Object.values(patternMap).flat();
}

/**
 * Match multi-language pattern
 * @param {string} text
 * @param {object} patternMap - Map of language to patterns
 * @returns {boolean}
 */
function matchMultiLangPattern(text, patternMap) {
  const lowerText = text.toLowerCase();

  for (const patterns of Object.values(patternMap)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  SUPPORTED_LANGUAGES,
  AGENT_TRIGGER_PATTERNS,
  SKILL_TRIGGER_PATTERNS,
  detectLanguage,
  getAllPatterns,
  matchMultiLangPattern
};

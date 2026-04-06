/**
 * Skill Name Normalizer
 * Strips extension prefix (bkit:) from skill names for consistent handler matching.
 * v0.36.0: CLI always attaches "extensionName:" prefix to extension skills (PR #23566).
 *
 * @version 1.0.0
 */

/**
 * Normalize skill name by stripping known extension prefixes.
 * @param {string} skillName - Raw skill name from CLI event
 * @returns {string} Normalized skill name without prefix
 */
function normalizeSkillName(skillName) {
  if (!skillName || typeof skillName !== 'string') return '';
  return skillName.replace(/^bkit:/, '');
}

module.exports = { normalizeSkillName };

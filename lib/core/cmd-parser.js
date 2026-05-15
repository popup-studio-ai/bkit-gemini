/**
 * CmdParser — self-contained shell command analyzer for destructive op detection
 *
 * Sprint: S7 v2.0.7-gemini-cli-l4-automation (Wave 1 Day 2)
 * Design: docs/01-plan/sprints/v2.0.7-gemini-cli-l4-automation-design.md §4
 * Spec: D7 (AST-like parsing) + D16' (self mini-parser only, no bash-parser npm)
 *
 * Detection strategy:
 *   1. Normalize: strip ANSI/control chars, unwind aliases, IFS substitution
 *   2. Recursive bypass unwind: heredoc body, subshell, base64 decode, eval body, exec/xargs children
 *   3. Pattern match: 16 destructive patterns (D-RM-RF, D-FORCE-PUSH, etc)
 *   4. Conservative deny: ambiguous fd redirection
 *
 * Cross-OS: pure JavaScript regex + Buffer (base64). Works on macOS / Windows / Linux / WSL / Git Bash.
 *
 * NOT a complete shell parser. Optimized for safety (false-positive > false-negative).
 */
'use strict';

// ─── 16 Destructive Patterns ──────────────────────────────────────
const DESTRUCTIVE_PATTERNS = [
  // CP-01~03, 31 — rm -rf variants
  { id: 'D-RM-RF', regex: /\brm\s+(?:-[^\s]*r[^\s]*f[^\s]*|-[^\s]*f[^\s]*r[^\s]*|-r\s+-f|-f\s+-r)/i },
  // CP-08~09 — git force push
  { id: 'D-FORCE-PUSH', regex: /\bgit\s+push\s+.*(?:--force(?!-with-lease)|-f\b)/i },
  // CP-10 — drop table (SQL)
  { id: 'D-DROP-TABLE', regex: /\bdrop\s+table\b/i },
  // CP-11 — truncate (SQL)
  { id: 'D-TRUNCATE', regex: /\btruncate\s+(?:table\s+)?\w+/i },
  // CP-12 — delete from without where (negative lookahead for WHERE keyword)
  { id: 'D-DELETE-NO-WHERE', regex: /\bdelete\s+from\s+\w+\b(?![^;"']*\bwhere\b)/i },
  // CP-14 — sudo
  { id: 'D-SUDO', regex: /(^|[\s;&|])sudo\b/i },
  // CP-15 — chmod 777
  { id: 'D-CHMOD-777', regex: /\bchmod\s+(?:-R\s+)?777\b/i },
  // CP-16 — /etc write
  { id: 'D-ETC-WRITE', regex: /(?:>+|tee|>>)\s*\/etc\//i },
  // CP-15 (overlap) — ~/.ssh write
  { id: 'D-SSH-WRITE', regex: /(?:>+|tee|chmod|rm)\s+(?:-?\S*\s+)?~?\/?\.ssh\b|chmod\s+\d+\s+~\/\.ssh/i },
  // CP-17 — gpg delete key
  { id: 'D-GPG-DISABLE', regex: /\bgpg\s+.*--delete(?:-secret)?-key/i },
  // CP-27 — env write
  { id: 'D-ENV-WRITE', regex: /(?:>+|tee|>>)\s*\.env(?:\.|\b|$)|>\s*\.env\.local|\brm\s+(?:-[a-z]*\s+)?\.env(?:\.local)?(?:\s|$)/i },
  // CP-28 — private key write/delete
  { id: 'D-PRIVATE-KEY-WRITE', regex: /\b(?:rm|>+|tee|cat\s*>)\s+(?:-[a-z]*\s+)?(?:[\w.\/~-]*\/)?(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)(?:\.pub)?(?:\s|$)|\b(?:rm|>+)\s+(?:-[a-z]*\s+)?\S+\.(?:pem|p12|kdbx|key)(?:\s|$)/i },
  // CP-29 — npm publish --force
  { id: 'D-NPM-FORCE-PUBLISH', regex: /\bnpm\s+publish\s+.*--force/i },
  // CP-30 — git config credential unset
  { id: 'D-GIT-CONFIG-UNSET', regex: /\bgit\s+config\s+.*--unset.*credential/i },
  // CP-31 — rm .git
  { id: 'D-RM-DOT-GIT', regex: /\brm\s+(?:-[a-z]*\s+)?(?:[\w.\/~-]*\/)?\.git(?:\/|\s|$)/i },
  // future — drop database
  { id: 'D-DROP-DATABASE', regex: /\bdrop\s+database\b/i }
];

// ─── 11 Bypass Patterns ───────────────────────────────────────────
function detectBypass(cmd) {
  const detected = [];

  // heredoc <<EOF...EOF or <<-EOF...EOF
  if (/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\s*\1\s*$/m.test(cmd) || /<<-?\s*['"]?(\w+)['"]?/m.test(cmd)) detected.push('heredoc');
  // base64 decode via pipe
  if (/base64\s+(?:-d|--decode)\s*(?:\||$)/i.test(cmd)) detected.push('base64');
  // eval
  if (/(^|[\s;&|])eval\s/i.test(cmd)) detected.push('eval');
  // subshell or backtick
  if (/\$\([^)]*\)/.test(cmd) || /`[^`]+`/.test(cmd)) detected.push('subshell');
  // variable expansion $VAR
  if (/\$\w+|\$\{/.test(cmd)) detected.push('variable');
  // exec
  if (/(^|[\s;&|])exec\s+/i.test(cmd)) detected.push('exec');
  // xargs
  if (/\bxargs\s+/i.test(cmd)) detected.push('xargs');
  // fd redirection (exec N<file or <&N)
  if (/exec\s+\d+\s*<\s*\S+|<&\s*\d+/i.test(cmd)) detected.push('fd');
  // IFS modification
  if (/(^|[\s;])IFS\s*=/.test(cmd)) detected.push('ifs');
  // ANSI/control char (backspace 0x08, ESC sequences)
  if (/[]/.test(cmd) || /\\x0[bd8]|\\b\s*[a-z]/i.test(cmd)) detected.push('ansi');
  // alias/function override of dangerous commands
  if (/\b(?:alias|function)\s+(?:rm|cp|mv|sudo|chmod|chown|dd|mkfs|fdisk)\b/i.test(cmd) || /^\s*(?:rm|cp|mv|chmod|sudo)\s*\(\s*\)\s*\{/m.test(cmd)) detected.push('alias');

  return detected;
}

// ─── Normalization ────────────────────────────────────────────────
// Safety principle: a single normalization can miss an attack vector that uses
// the OPPOSITE interpretation of control chars. We compute BOTH:
//   (a) BS-applied:  treat 0x08 like terminal (delete prev char) — defeats 'Xr\b\brm'
//   (b) Control-stripped: drop all 0x00-0x1F (except \t\n\r) — defeats 'r\bm'
// isDestructive() checks both as candidates (false-positive > false-negative).
function stripAnsiControl(cmd) {
  let result = '';
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd.charCodeAt(i);
    if (c === 0x08) {
      if (result.length > 0) result = result.slice(0, -1);
      continue;
    }
    if (c === 0x1b) {
      while (i + 1 < cmd.length && !/[a-zA-Z]/.test(cmd[++i])) { /* skip */ }
      continue;
    }
    result += cmd[i];
  }
  return result;
}

function stripControlOnly(cmd) {
  // Drop control chars 0x00-0x1F (preserve adjacent chars) + 0x7F (DEL).
  // Tab \x09, LF \x0a, CR \x0d preserved for command boundaries.
  return cmd.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}

function tryBase64Decode(cmd) {
  // Extract potential base64 from echo X | base64 -d | bash
  const m = /echo\s+(['"]?)([A-Za-z0-9+/=]+)\1\s*\|\s*base64\s+(?:-d|--decode)/.exec(cmd);
  if (!m) return null;
  try {
    const decoded = Buffer.from(m[2], 'base64').toString('utf-8');
    return decoded;
  } catch (e) {
    return null;
  }
}

function extractSubshellInner(cmd) {
  const results = [];
  const subshellMatches = cmd.match(/\$\(([^)]*)\)/g) || [];
  for (const m of subshellMatches) {
    results.push(m.slice(2, -1));
  }
  const backtickMatches = cmd.match(/`([^`]+)`/g) || [];
  for (const m of backtickMatches) {
    results.push(m.slice(1, -1));
  }
  return results;
}

function extractHeredocBody(cmd) {
  // <<EOF ... EOF (capture body)
  const m = /<<-?\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\s*\1\s*(?:\n|$)/m.exec(cmd);
  if (m) return m[2];
  return null;
}

function unwindAlias(cmd) {
  // function rm() { /bin/rm -rf "$@"; }; rm /tmp
  // Try to detect function/alias that wraps a dangerous command
  const funcMatch = /(?:function\s+)?(\w+)\s*\(\)\s*\{\s*([^}]+)\s*;?\s*\}\s*;?\s*\1\s+([^;]*)/.exec(cmd);
  if (funcMatch) {
    const body = funcMatch[2].replace(/"\$@"/g, funcMatch[3]).replace(/\$@/g, funcMatch[3]);
    return body;
  }
  return null;
}

function expandIfs(cmd) {
  // IFS=x; cmd=xrmx-rfx/tmp; $cmd
  const ifsMatch = /^(?:.*;)?\s*IFS\s*=\s*['"]?([^'"\s;]+)['"]?\s*;\s*(.+)/.exec(cmd);
  if (!ifsMatch) return null;
  const delim = ifsMatch[1];
  const rest = ifsMatch[2];
  // Try to detect cmd=X..X then $cmd
  const cmdAssignMatch = new RegExp(`(\\w+)\\s*=\\s*['"]?([^'";]+)['"]?\\s*;\\s*\\$\\1`).exec(rest);
  if (cmdAssignMatch) {
    return cmdAssignMatch[2].split(delim).filter(Boolean).join(' ');
  }
  // Simpler form: just expand vars by replacing delim with space
  return rest.replace(new RegExp(delim, 'g'), ' ');
}

// ─── Main API ─────────────────────────────────────────────────────
class CmdParser {
  isDestructive(cmd) {
    if (!cmd || typeof cmd !== 'string') return false;

    // Step 1: dual normalize (both BS-applied and control-stripped)
    const normalizedBsApplied = stripAnsiControl(cmd);
    const normalizedControlOnly = stripControlOnly(cmd);

    // Step 2: try expansions to surface hidden destructive commands
    const candidates = [normalizedBsApplied];
    if (normalizedControlOnly !== normalizedBsApplied) candidates.push(normalizedControlOnly);
    // Step alias for subsequent code referring to `normalized`
    const normalized = normalizedBsApplied;

    // Heredoc body
    const heredocBody = extractHeredocBody(normalized);
    if (heredocBody) candidates.push(heredocBody);

    // Subshell/backtick inner
    candidates.push(...extractSubshellInner(normalized));

    // Base64 decode
    const decoded = tryBase64Decode(normalized);
    if (decoded) candidates.push(decoded);

    // Alias/function override unwind
    const unwound = unwindAlias(normalized);
    if (unwound) candidates.push(unwound);

    // IFS expansion
    const ifsExpanded = expandIfs(normalized);
    if (ifsExpanded) candidates.push(ifsExpanded);

    // Step 3: pattern match on all candidates
    for (const candidate of candidates) {
      for (const pat of DESTRUCTIVE_PATTERNS) {
        if (pat.regex.test(candidate)) return true;
      }
    }

    // Step 4: conservative deny for ambiguous bypass
    const bypasses = detectBypass(normalized);
    // fd redirection alone (no obvious destructive) → conservative deny
    if (bypasses.includes('fd') && /\|\s*(?:bash|sh|zsh)\b/i.test(normalized)) return true;

    // eval, exec, xargs — if they target shell, check if their context is dangerous
    if (bypasses.includes('eval') && /eval\s+/i.test(normalized)) {
      // eval with any argument is risky if it contains shell metacharacters
      const evalBody = /eval\s+['"]?([^'"]+)['"]?/i.exec(normalized);
      if (evalBody) {
        for (const pat of DESTRUCTIVE_PATTERNS) {
          if (pat.regex.test(evalBody[1])) return true;
        }
      }
    }

    if (bypasses.includes('exec') && !bypasses.includes('fd')) {
      // exec CMD → check CMD
      const execBody = /(^|[\s;&|])exec\s+([^;&|]+)/i.exec(normalized);
      if (execBody) {
        for (const pat of DESTRUCTIVE_PATTERNS) {
          if (pat.regex.test(execBody[2])) return true;
        }
      }
    }

    if (bypasses.includes('xargs')) {
      // xargs CMD → check CMD
      const xargsBody = /\bxargs\s+(?:-[a-zA-Z0-9]+\s+)*([^|;&]+)/i.exec(normalized);
      if (xargsBody) {
        for (const pat of DESTRUCTIVE_PATTERNS) {
          if (pat.regex.test(xargsBody[1])) return true;
        }
      }
    }

    return false;
  }

  /**
   * Parse and return analysis.
   * @returns {{ destructive: boolean, patterns: string[], bypasses: string[] }}
   */
  parse(cmd) {
    if (!cmd || typeof cmd !== 'string') {
      return { destructive: false, patterns: [], bypasses: [] };
    }
    const normalized = stripAnsiControl(cmd);
    const matchedPatterns = [];
    const candidates = [normalized];
    const heredocBody = extractHeredocBody(normalized);
    if (heredocBody) candidates.push(heredocBody);
    candidates.push(...extractSubshellInner(normalized));
    const decoded = tryBase64Decode(normalized);
    if (decoded) candidates.push(decoded);
    const unwound = unwindAlias(normalized);
    if (unwound) candidates.push(unwound);
    const ifsExpanded = expandIfs(normalized);
    if (ifsExpanded) candidates.push(ifsExpanded);

    for (const candidate of candidates) {
      for (const pat of DESTRUCTIVE_PATTERNS) {
        if (pat.regex.test(candidate) && !matchedPatterns.includes(pat.id)) {
          matchedPatterns.push(pat.id);
        }
      }
    }
    const bypasses = detectBypass(normalized);

    return {
      destructive: matchedPatterns.length > 0 || this.isDestructive(cmd),
      patterns: matchedPatterns,
      bypasses
    };
  }

  detectBypass(cmd) {
    return detectBypass(stripAnsiControl(cmd));
  }
}

module.exports = CmdParser;
module.exports.DESTRUCTIVE_PATTERNS = DESTRUCTIVE_PATTERNS;

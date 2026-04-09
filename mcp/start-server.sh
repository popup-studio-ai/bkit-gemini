#!/usr/bin/env bash
# MCP server launcher - resolves node path for nvm/fnm/volta environments
# Gemini CLI spawns MCP servers without shell initialization, so 'node'
# may not be in PATH. This wrapper ensures node is found.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# If node is not in PATH, try common version managers
if ! command -v node &>/dev/null; then
  # nvm
  [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
  # fnm
  command -v fnm &>/dev/null && eval "$(fnm env)"
  # volta
  [ -d "$HOME/.volta" ] && export PATH="$HOME/.volta/bin:$PATH"
fi

exec node "$SCRIPT_DIR/bkit-server.js" "$@"

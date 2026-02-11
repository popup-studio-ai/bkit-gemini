/**
 * Memory Helper - Shared memory load/save utility
 */
const fs = require('fs');
const path = require('path');

function loadMemory(projectDir) {
  const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
  try {
    if (fs.existsSync(memoryPath)) {
      return JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return {};
}

function saveMemory(projectDir, memory) {
  try {
    const memoryPath = path.join(projectDir, 'docs', '.bkit-memory.json');
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  } catch (e) { /* silently fail */ }
}

function updateMemoryField(projectDir, key, value) {
  const memory = loadMemory(projectDir);
  memory[key] = value;
  saveMemory(projectDir, memory);
  return memory;
}

module.exports = { loadMemory, saveMemory, updateMemoryField };

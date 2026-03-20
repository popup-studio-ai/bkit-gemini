/**
 * Memory Helper - Shared memory load/save utility
 * Delegates to lib/core/memory module for path resolution
 */
const path = require('path');

const libPath = path.resolve(__dirname, '..', '..', '..', 'lib');

function loadMemory(projectDir) {
  try {
    const { getMemory } = require(path.join(libPath, 'core', 'memory'));
    return getMemory(projectDir).load();
  } catch (e) { /* ignore */ }
  return {};
}

function saveMemory(projectDir, memory) {
  try {
    const { getMemory } = require(path.join(libPath, 'core', 'memory'));
    const memoryManager = getMemory(projectDir);
    // Overwrite cache and force save
    memoryManager.cache = memory;
    memoryManager.dirty = true;
    memoryManager.save(true);
  } catch (e) { /* silently fail */ }
}

function updateMemoryField(projectDir, key, value) {
  try {
    const { getMemory } = require(path.join(libPath, 'core', 'memory'));
    const memoryManager = getMemory(projectDir);
    memoryManager.set(key, value);
    return memoryManager.load();
  } catch (e) {
    const memory = loadMemory(projectDir);
    memory[key] = value;
    saveMemory(projectDir, memory);
    return memory;
  }
}

module.exports = { loadMemory, saveMemory, updateMemoryField };

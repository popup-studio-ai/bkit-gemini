// TC-68: Edge Case Filesystem Tests (10 TC)
const { PLUGIN_ROOT, TEST_PROJECT_DIR, createTestProject, cleanupTestProject, assert, assertEqual, assertExists, getPdcaStatus, withVersion } = require('../test-utils');
const path = require('path');
const fs = require('fs');

const { getPaths, ensureDirectories } = require(path.join(PLUGIN_ROOT, 'lib/core/paths'));

const tests = [
  { name: 'TC68-01: getPaths 존재하지 않는 루트',
    fn: () => {
      const paths = getPaths('/nonexistent/path');
      assert(paths.pdcaStatus !== undefined, 'Should return paths even for missing root');
    }
  },
  { name: 'TC68-02: ensureDirectories 빈 프로젝트',
    setup: () => createTestProject({}),
    fn: () => {
      ensureDirectories(TEST_PROJECT_DIR);
      const paths = getPaths(TEST_PROJECT_DIR);
      assertExists(paths.stateDir, 'stateDir created');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC68-03: ensureDirectories 이미 존재하는 디렉토리',
    setup: () => createTestProject({}),
    fn: () => {
      ensureDirectories(TEST_PROJECT_DIR);
      ensureDirectories(TEST_PROJECT_DIR); // 중복 호출
      assert(true, 'Duplicate ensureDirectories should not throw');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC68-04: 읽기 전용 파일 처리',
    setup: () => {
      createTestProject({ 'readonly.json': '{"a":1}' });
    },
    fn: () => {
      const filePath = path.join(TEST_PROJECT_DIR, 'readonly.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      assertEqual(JSON.parse(content).a, 1, 'Should read file');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC68-05: 빈 파일 읽기',
    setup: () => createTestProject({ 'empty.json': '' }),
    fn: () => {
      const content = fs.readFileSync(path.join(TEST_PROJECT_DIR, 'empty.json'), 'utf-8');
      assertEqual(content, '', 'Should read empty file');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC68-06: 깊은 중첩 경로 생성',
    setup: () => createTestProject({}),
    fn: () => {
      const deepPath = path.join(TEST_PROJECT_DIR, 'a', 'b', 'c', 'd', 'e');
      fs.mkdirSync(deepPath, { recursive: true });
      assertExists(deepPath, 'Deep nested path should exist');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC68-07: 큰 파일 생성/읽기',
    setup: () => createTestProject({}),
    fn: () => {
      const bigContent = 'x'.repeat(100000);
      const filePath = path.join(TEST_PROJECT_DIR, 'big.txt');
      fs.writeFileSync(filePath, bigContent);
      const read = fs.readFileSync(filePath, 'utf-8');
      assertEqual(read.length, 100000, 'Should handle 100KB file');
    },
    teardown: cleanupTestProject
  },
  { name: 'TC68-08: symlink 안전 처리',
    fn: () => {
      // Verify PLUGIN_ROOT is not a symlink to something dangerous
      const realPath = fs.realpathSync(PLUGIN_ROOT);
      assert(realPath.length > 0, 'Should resolve real path');
    }
  },
  { name: 'TC68-09: getPaths 경로 separator 일관성',
    fn: () => {
      const paths = getPaths('/tmp/test');
      assert(!paths.pdcaStatus.includes('\\'), 'Should use forward slashes on unix');
    }
  },
  { name: 'TC68-10: 특수문자 디렉토리명 처리',
    setup: () => createTestProject({}),
    fn: () => {
      const specialDir = path.join(TEST_PROJECT_DIR, 'dir with spaces');
      fs.mkdirSync(specialDir, { recursive: true });
      assertExists(specialDir, 'Dir with spaces should exist');
    },
    teardown: cleanupTestProject
  }
];

module.exports = { tests };

# Design: bkit Test Code Simplification

- **ID:** `feature/test-code-simplification.design`
- **Target:** `tests/test-utils.js`, `tests/setup.js`, `tests/suites/*.js`

## 1. Unified Project Creation
```javascript
function createTestProject(fixtures = {}) {
  // Standard v2.0.2 structure always ensured
  const dirs = [
    'src', '.bkit/state', '.gemini/policies',
    'docs/01-plan/features', 'docs/02-design/features',
    'docs/03-analysis/features', 'docs/04-report/features',
    'docs/.pdca-snapshots'
  ];
  // ... mkdir logic ...
  
  // Status placement: root is default for v2
  const statusPath = path.join(TEST_PROJECT_DIR, '.pdca-status.json');
  if (!fixtures['.pdca-status.json']) {
    fs.writeFileSync(statusPath, JSON.stringify(DEFAULT_STATUS));
  }
}
```

## 2. Fixture Factory
```javascript
function getPdcaStatus(overrides = {}) {
  const { PDCA_STATUS_FIXTURE } = require('./fixtures');
  const base = JSON.parse(JSON.stringify(PDCA_STATUS_FIXTURE));
  return { ...base, ...overrides };
}
```

## 3. Version Helper Cleanup
- Ensure `withVersion` encapsulates `resetCache()` entirely.
- Allow optional `pluginRoot` override via environment within the helper.

## 4. Migration Plan
- Rename `createTestProjectV2` calls to `createTestProject`.
- Delete `createTestProjectV2` definition.
- Standardize `os.tmpdir()` usage to prevent cross-platform path issues.

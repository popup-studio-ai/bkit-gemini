// TC-26: Version Detector v1.5.8 Unit Tests (25 TC)
const { PLUGIN_ROOT, assert, assertEqual, assertType, withVersion, getPdcaStatus } = require('../test-utils');
const path = require('path');

const vd = require(path.join(PLUGIN_ROOT, 'lib/gemini/version'));

const tests = [
  {
    name: 'TC26-01: isValidSemVer 정상 버전',
    fn: () => { assertEqual(vd.isValidSemVer('0.32.0'), true, '0.32.0 should be valid'); }
  },
  {
    name: 'TC26-02: isValidSemVer 잘못된 형식',
    fn: () => { assertEqual(vd.isValidSemVer('abc'), false, 'abc should be invalid'); }
  },
  {
    name: 'TC26-03: isVersionBeyondPlausible 미래 버전',
    fn: () => { assertEqual(vd.isVersionBeyondPlausible('99.99.99'), true, '99.99.99 should be beyond plausible'); }
  },
  {
    name: 'TC26-04: isVersionBeyondPlausible 현재 범위',
    fn: () => { assertEqual(vd.isVersionBeyondPlausible('0.32.0'), false, '0.32.0 should be plausible'); }
  },
  {
    name: 'TC26-05: parseVersion 정상 파싱',
    fn: () => {
      const v = vd.parseVersion('0.32.1');
      assertEqual(v.major, 0, 'Major should be 0');
      assertEqual(v.minor, 32, 'Minor should be 32');
      assertEqual(v.patch, 1, 'Patch should be 1');
    }
  },
  {
    name: 'TC26-06: parseVersion preview 버전',
    fn: () => {
      const v = vd.parseVersion('0.33.0-preview');
      assertEqual(v.minor, 33, 'Minor should be 33');
      assert(v.isPreview === true || v.raw.includes('preview'), 'Should detect preview');
    }
  },
  {
    name: 'TC26-07: compareVersions 동일 버전',
    fn: () => { assertEqual(vd.compareVersions('0.32.0', '0.32.0'), 0, 'Same versions should be 0'); }
  },
  {
    name: 'TC26-08: compareVersions 큰 버전',
    fn: () => { assert(vd.compareVersions(vd.parseVersion('0.33.0'), vd.parseVersion('0.32.0')) > 0, '0.33.0 > 0.32.0'); }
  },
  {
    name: 'TC26-09: compareVersions 작은 버전',
    fn: () => { assert(vd.compareVersions(vd.parseVersion('0.31.0'), vd.parseVersion('0.32.0')) < 0, '0.31.0 < 0.32.0'); }
  },
  {
    name: 'TC26-10: detectVersion 환경변수 기반',
    fn: () => {
      withVersion('0.32.0', () => {
        const v = vd.detectVersion();
        assertEqual(v.minor, 32, 'Should detect 0.32.0');
      });
    }
  },
  {
    name: 'TC26-11: getFeatureFlags v0.28.0',
    fn: () => {
      withVersion('0.28.0', () => {
        const flags = vd.getFeatureFlags();
        assertEqual(flags.hasToolAnnotations, false, 'v0.28 should not have tool annotations');
      });
    }
  },
  {
    name: 'TC26-12: getFeatureFlags v0.30.0 Policy Engine',
    fn: () => {
      withVersion('0.30.0', () => {
        const flags = vd.getFeatureFlags();
        assertEqual(flags.hasPolicyEngine, true, 'v0.30 should have policy engine');
      });
    }
  },
  {
    name: 'TC26-13: getFeatureFlags v0.31.0 Level Policy',
    fn: () => {
      withVersion('0.31.0', () => {
        const flags = vd.getFeatureFlags();
        assertEqual(flags.hasProjectLevelPolicy, true, 'v0.31 should have level policy');
      });
    }
  },
  {
    name: 'TC26-14: getFeatureFlags v0.32.0 Extension Policy',
    fn: () => {
      withVersion('0.32.0', () => {
        const flags = vd.getFeatureFlags();
        assertEqual(flags.hasExtensionPolicies, true, 'v0.32 should have extension policies');
      });
    }
  },
  {
    name: 'TC26-15: getFeatureFlags v0.32.0 Task Tracker',
    fn: () => {
      withVersion('0.32.0', () => {
        const flags = vd.getFeatureFlags();
        assertEqual(flags.hasTaskTracker, true, 'v0.32 should have task tracker');
      });
    }
  },
  {
    name: 'TC26-16: resetCache 캐시 초기화',
    fn: () => {
      withVersion('0.32.0', () => {
        vd.detectVersion();
        vd.resetCache();
        // After reset, next detect should re-parse
        const v = vd.detectVersion();
        assert(v !== undefined, 'Should still work after reset');
      });
    }
  },
  {
    name: 'TC26-17: getBkitFeatureFlags 존재',
    fn: () => {
      assertType(vd.getBkitFeatureFlags, 'function', 'Should export getBkitFeatureFlags');
    }
  },
  {
    name: 'TC26-18: getVersionSummary 함수 존재',
    fn: () => {
      assertType(vd.getVersionSummary, 'function', 'Should export getVersionSummary');
    }
  },
  {
    name: 'TC26-19: isVersionAtLeast 경계값',
    fn: () => {
      withVersion('0.32.0', () => {
        assertEqual(vd.isVersionAtLeast('0.32.0'), true, 'Same version should be at least');
        assertEqual(vd.isVersionAtLeast('0.33.0'), false, 'Higher should be false');
      });
    }
  },
  {
    name: 'TC26-20: v0.26.0 최소 지원 버전 플래그',
    fn: () => {
      withVersion('0.26.0', () => {
        const flags = vd.getFeatureFlags();
        assertType(flags, 'object', 'Should return flags object');
      });
    }
  },
  {
    name: 'TC26-21: v0.29.0 플래그 확인',
    fn: () => {
      withVersion('0.29.0', () => {
        const flags = vd.getFeatureFlags();
        assertEqual(flags.hasPolicyEngine, false, 'v0.29 should not have policy engine');
      });
    }
  },
  {
    name: 'TC26-22: v0.33.0 네이티브 에이전트 플래그',
    fn: () => {
      withVersion('0.33.0', () => {
        const flags = vd.getBkitFeatureFlags();
        assertType(flags, 'object', 'Should return bkit flags');
      });
    }
  },
  {
    name: 'TC26-23: parseVersion null 입력 방어',
    fn: () => {
      try {
        const v = vd.parseVersion(null);
        assert(v !== undefined, 'Should handle null gracefully');
      } catch (e) {
        assert(true, 'Throwing on null is acceptable');
      }
    }
  },
  {
    name: 'TC26-24: parseVersion 빈 문자열',
    fn: () => {
      try {
        const v = vd.parseVersion('');
        assert(v !== undefined, 'Should handle empty string');
      } catch (e) {
        assert(true, 'Throwing on empty is acceptable');
      }
    }
  },
  {
    name: 'TC26-25: 전체 Feature Flag 키 개수 >= 10',
    fn: () => {
      withVersion('0.33.0', () => {
        const flags = vd.getFeatureFlags();
        const count = Object.keys(flags).length;
        assert(count >= 10, `Should have >=10 flags, found ${count}`);
      });
    }
  }
];

module.exports = { tests };

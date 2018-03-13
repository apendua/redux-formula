/* eslint-env jest */

import memoizeMapValues from './memoizeMapValues';

const constant = x => () => x;
const identity = x => x;

describe('Test utility - memoizeMapValues', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(() => {
    testContext.object = {};
    testContext.identity = memoizeMapValues(identity);
    testContext.constant = memoizeMapValues(constant(testContext.object));
  });

  describe('Given an empty object', () => {
    test('should not be changed by identity mapping', () => {
      const x = {};
      const y = testContext.identity(x);
      expect(testContext.identity(x)).toBe(y);
    });

    test('should not be changed by constant mapping', () => {
      const x = {};
      const y = testContext.constant(x);
      expect(testContext.constant(x)).toBe(y);
    });

    test(
      'should return the same result when called with similar argument',
      () => {
        const x = {};
        const y = {};
        expect(testContext.constant(x)).toBe(testContext.constant(y));
      },
    );
  });

  describe('Given a non-empty object', () => {
    test('should not be changed by identity mapping', () => {
      const x = {
        a: {},
        b: {},
      };
      expect(testContext.identity(x)).toBe(x);
    });
    test('should be changed by constant mapping', () => {
      const x = {
        a: {},
        b: {},
      };
      expect(testContext.constant(x)).not.toBe(x);
    });
    test(
      'should return the same result when called with similar argument',
      () => {
        const x = {
          a: {},
          b: {},
        };
        const y = {
          ...x,
        };
        expect(testContext.constant(x)).toBe(testContext.constant(y));
      },
    );
  });
});

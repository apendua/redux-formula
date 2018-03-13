/* eslint-env jest */

import Scope from './Parser.Scope';

describe('Test Scope; ', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('given a simple scope', () => {
    beforeEach(() => {
      testContext.scope = new Scope(null, {
        a: 1,
        b: 2,
      });
    });

    test('should be able to lookup symbols', () => {
      expect(testContext.scope.lookup('a')).toBe(1);
      expect(testContext.scope.lookup('b')).toBe(2);
    });

    test('should be able to get symbols', () => {
      expect(testContext.scope.get('a')).toBe(1);
      expect(testContext.scope.get('b')).toBe(2);
    });

    test('should be able to define symbols', () => {
      testContext.scope.define('c', 3);
      expect(testContext.scope.lookup('c')).toBe(3);
    });

    test('should be able to remove existing symbols', () => {
      testContext.scope.remove('a');
      expect(testContext.scope.lookup('a')).toBeUndefined();
    });
  });

  describe('Given a scope hierarchy', () => {
    beforeEach(() => {
      testContext.scope1 = new Scope(null, { a: 4 });
      testContext.scope2 = testContext.scope1.child({ b: 5 });
    });

    test('should be able to lookup symbol', () => {
      expect(testContext.scope2.lookup('b')).toBe(5);
    });

    test('should be able to lookup symbol from parent scope', () => {
      expect(testContext.scope2.lookup('a')).toBe(4);
    });

    test('should not be able to access symbol from nested scope', () => {
      expect(testContext.scope1.lookup('b')).toBeUndefined();
    });

    test('should not affect parent scope when defining new symbol', () => {
      testContext.scope2.define('c', 6);
      expect(testContext.scope1.lookup('c')).toBeUndefined();
      expect(testContext.scope2.lookup('c')).toBe(6);
    });

    test('should be able to overwrite parent symbol', () => {
      testContext.scope2.define('a', 100);
      expect(testContext.scope2.lookup('a')).toBe(100);
    });

    test('however, should not affect the parent value', () => {
      testContext.scope2.define('a', 100);
      expect(testContext.scope1.lookup('a')).toBe(4);
    });
  });
});

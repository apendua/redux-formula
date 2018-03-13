/* eslint-env jest */

import Scope from './Scope';

// const constant = x => () => x;
// const identity = x => x;

describe('Test Scope', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('Given a scope without unknowns', () => {
    beforeEach(() => {
      testContext.scope = new Scope();
    });
    test('should not have any own unknowns', () => {
      expect(testContext.scope.hasOwnUnknowns()).toBe(false);
    });
  });

  describe('Given a scope with unknowns', () => {
    beforeEach(() => {
      testContext.scope = new Scope(null, ['x', 'y']);
    });
    test('should have own unknowns', () => {
      expect(testContext.scope.hasOwnUnknowns()).toBe(true);
    });
  });
});

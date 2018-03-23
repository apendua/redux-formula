/* eslint-env jest */

import Scope from './Scope';
import Selector from './Selector';
import {
  identity,
  constant,
} from '../utils/functions';

describe('Test Selector', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('Given a scope without unknowns', () => {
    beforeEach(() => {
      testContext.scope = new Scope();
    });
    test('should select a literal', () => {
      const selector = Selector.relativeTo(testContext.scope, constant(1));
      expect(selector.evaluate()).toBe(1);
    });
    test('should select a specified literal', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      );
      expect(selector.evaluate(1)).toBe(1);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.evaluate(2)()).toBe(2);
    });
  });

  describe('Given a scope with unknowns', () => {
    beforeEach(() => {
      testContext.scope = new Scope(null, ['x']);
    });
    test('should select a function that returns a literal', () => {
      const selector = Selector.create(
        testContext.scope,
        constant(1),
        identity,
      );
      expect(selector.evaluate()()).toBe(1);
    });
    test('should select a function that returns a specified literal', () => {
      const selector = Selector.create(
        testContext.scope,
        identity,
        identity,
      );
      expect(selector.evaluate(2)()).toBe(2);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.evaluate(2)()()).toBe(2);
    });
    test('should select an unknown indirectly', () => {
      const selector = testContext.scope.resolve('x').selector.indirect();
      expect(selector.evaluate()({ x: 3 })()).toBe(3);
    });
    test(
      'should select a function that returns a specified variable',
      () => {
        const selector = Selector.create(
          testContext.scope,
          new Selector(
            testContext.scope,
            constant(({ x }) => x),
          ),
          identity,
        );
        expect(selector.evaluate()({ x: 2 })).toBe(2);
      },
    );
    test('should select an incrementation function', () => {
      const selector = Selector.create(
        testContext.scope,
        new Selector(
          testContext.scope,
          y => (({ x }) => x + y),
        ),
        identity,
      );
      expect(selector.evaluate(2)({ x: 1 })).toBe(3);
    });
  });

  describe('Given a scope with parent unknowns', () => {
    beforeEach(() => {
      testContext.parentScope = new Scope(null, ['x']);
      testContext.scope = new Scope(testContext.parentScope);
    });
    test('should select a function that returns a literal', () => {
      const selector = Selector.create(
        testContext.scope,
        constant(1),
        identity,
      );
      expect(selector.evaluate()()).toBe(1);
    });
    test('should select a function that returns a specified literal', () => {
      const selector = Selector.create(
        testContext.scope,
        identity,
        identity,
      );
      expect(selector.evaluate(2)()).toBe(2);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.evaluate(2)()()).toBe(2);
    });
    test('should select an unknown from parent scope indirectly', () => {
      const selector = testContext.scope.resolve('x').selector.relativeTo(testContext.scope).indirect();
      expect(selector.evaluate()({ x: 3 })()).toBe(3);
    });
    test(
      'should select a function that returns a specified variable',
      () => {
        const selector = Selector.create(
          testContext.scope,
          new Selector(
            testContext.scope,
            constant(({ x }) => x),
          ),
          identity,
        );
        expect(selector.evaluate()({ x: 2 })).toBe(2);
      },
    );
    test('should select an incrementation function', () => {
      const selector = Selector.create(
        testContext.scope,
        new Selector(
          testContext.scope,
          y => (({ x }) => x + y),
        ),
        identity,
      );
      expect(selector.evaluate(2)({ x: 1 })).toBe(3);
    });
  });

  describe('Given a scope with both self and parent unknowns', () => {
    beforeEach(() => {
      testContext.parentScope = new Scope(null, ['x']);
      testContext.scope = new Scope(testContext.parentScope, ['y']);
    });
    test('should select a function that returns a literal', () => {
      const selector = Selector.create(
        testContext.scope,
        constant(1),
        identity,
      );
      expect(selector.evaluate()()()).toBe(1);
    });
    test('should select a function that returns a specified literal', () => {
      const selector = Selector.create(
        testContext.scope,
        identity,
        identity,
      );
      expect(selector.evaluate(2)()()).toBe(2);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.evaluate(2)()()()).toBe(2);
    });
    test('should select an unknown from parent scope indirectly', () => {
      const selector = testContext.scope.resolve('x').selector.relativeTo(testContext.scope).indirect();
      expect(selector.evaluate()({ x: 2 })()()).toBe(2);
    });
    test('should select an unknown indirectly', () => {
      const selector = testContext.scope.resolve('y').selector.indirect();
      expect(selector.evaluate()()({ y: 2 })()).toBe(2);
    });
    test(
      'should select a function that returns a specified variable',
      () => {
        const selector = Selector.create(
          testContext.scope,
          new Selector(
            testContext.scope,
            constant(constant(({ x }) => x)),
          ),
          identity,
        );
        expect(selector.evaluate()()({ x: 2 })).toBe(2);
      },
    );
    test('should select an incrementation function', () => {
      const selector = Selector.create(
        testContext.scope,
        new Selector(
          testContext.parentScope,
          x => y => x + y,
        ),
        new Selector(
          testContext.scope,
          x => y => z => x + y + z,
        ),
        (a, b) => a + b,
      );
      expect(selector.evaluate(1)(2)(3)).toBe(9);
    });
  });
});

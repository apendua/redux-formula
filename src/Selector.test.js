/* eslint-env jest */

import Scope from './Scope';
import Selector, {
  lift,
  constant,
} from './Selector';
import { identity } from './utils';

const constant1 = x => () => x;
// const identity = x => x;

describe('Test Selector', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('Given constant functor', () => {
    beforeEach(() => {
      testContext.obj = {};
    });
    test('should create constant of order 0', () => {
      expect(constant(0)(testContext.obj)).toBe(testContext.obj);
    });
    test('should create constant of order 1', () => {
      expect(constant(1)(testContext.obj)()).toBe(testContext.obj);
    });
    test('should create constant of order 2', () => {
      expect(constant(2)(testContext.obj)()()).toBe(testContext.obj);
    });
    test('should create constant of order 2', () => {
      expect(constant(3)(testContext.obj)()()()).toBe(testContext.obj);
    });
  });

  describe('Given lift functor', () => {
    beforeEach(() => {
      testContext.obj = {};
      testContext.s1 = x => x;
      testContext.s2 = x => y => x + y;
      testContext.s3 = x => y => z => x + y + z;
    });
    test('should create lift of order 0, 0', () => {
      expect(lift(0, 0)(testContext.s1)(1)).toBe(1);
    });
    test('should create lift of order 0, 1', () => {
      expect(lift(0, 1)(testContext.s1)()(1)).toBe(1);
    });
    test('should create lift of order 0, 2', () => {
      expect(lift(0, 2)(testContext.s1)()()(1)).toBe(1);
    });
    test('should create lift of order 1, 0', () => {
      expect(lift(1, 0)(testContext.s2)(1)(2)).toBe(3);
    });
    test('should create lift of order 1, 1', () => {
      expect(lift(1, 1)(testContext.s2)(1)()(2)).toBe(3);
    });
    test('should create lift of order 1, 2', () => {
      expect(lift(1, 2)(testContext.s2)(1)()()(2)).toBe(3);
    });
    test('should create lift of order 2, 0', () => {
      expect(lift(2, 0)(testContext.s2)(1)(2)).toBe(3);
    });
    test('should create lift of order 2, 1', () => {
      expect(lift(2, 1)(testContext.s2)(1)(2)()).toBe(3);
    });
    test('should create lift of order 2, 2', () => {
      expect(lift(2, 2)(testContext.s2)(1)(2)()()).toBe(3);
    });
  });

  describe('Given a scope without unknowns', () => {
    beforeEach(() => {
      testContext.scope = new Scope();
    });
    test('should select a literal', () => {
      const selector = Selector.relativeTo(testContext.scope, constant1(1));
      expect(selector.selector()).toBe(1);
    });
    test('should select a specified literal', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      );
      expect(selector.selector(1)).toBe(1);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.selector(2)()).toBe(2);
    });
  });

  describe('Given a scope with unknowns', () => {
    beforeEach(() => {
      testContext.scope = new Scope(null, ['x']);
    });
    test('should select a function that returns a literal', () => {
      const selector = Selector.create(
        testContext.scope,
        constant1(1),
        identity,
      );
      expect(selector.selector()()).toBe(1);
    });
    test('should select a function that returns a specified literal', () => {
      const selector = Selector.create(
        testContext.scope,
        identity,
        identity,
      );
      expect(selector.selector(2)()).toBe(2);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.selector(2)()()).toBe(2);
    });
    test(
      'should select a function that returns a specified variable',
      () => {
        const selector = Selector.create(
          testContext.scope,
          new Selector(
            testContext.scope,
            constant1(({ x }) => x),
          ),
          identity,
        );
        expect(selector.selector()({ x: 2 })).toBe(2);
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
      expect(selector.selector(2)({ x: 1 })).toBe(3);
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
        constant1(1),
        identity,
      );
      expect(selector.selector()()).toBe(1);
    });
    test('should select a function that returns a specified literal', () => {
      const selector = Selector.create(
        testContext.scope,
        identity,
        identity,
      );
      expect(selector.selector(2)()).toBe(2);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.selector(2)()()).toBe(2);
    });
    test(
      'should select a function that returns a specified variable',
      () => {
        const selector = Selector.create(
          testContext.scope,
          new Selector(
            testContext.scope,
            constant1(({ x }) => x),
          ),
          identity,
        );
        expect(selector.selector()({ x: 2 })).toBe(2);
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
      expect(selector.selector(2)({ x: 1 })).toBe(3);
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
        constant1(1),
        identity,
      );
      expect(selector.selector()()()).toBe(1);
    });
    test('should select a function that returns a specified literal', () => {
      const selector = Selector.create(
        testContext.scope,
        identity,
        identity,
      );
      expect(selector.selector(2)()()).toBe(2);
    });
    test('should select a specified literal indirectly', () => {
      const selector = Selector.relativeTo(
        testContext.scope,
        identity,
      ).indirect();
      expect(selector.selector(2)()()()).toBe(2);
    });
    test(
      'should select a function that returns a specified variable',
      () => {
        const selector = Selector.create(
          testContext.scope,
          new Selector(
            testContext.scope,
            constant1(constant1(({ x }) => x)),
          ),
          identity,
        );
        expect(selector.selector()()({ x: 2 })).toBe(2);
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
      expect(selector.selector(1)(2)(3)).toBe(9);
    });
  });
});

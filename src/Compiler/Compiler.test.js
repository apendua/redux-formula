/* eslint-env jest */

import Compiler from './Compiler';
import presetDefault from './presets/default';
import { identity } from '../utils/functions';

const constant = x => () => x;

describe('Test Compiler', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(() => {
    testContext.compiler = new Compiler({
      plugins: presetDefault,
    });
    testContext.compiler.define('PI', [], 3.14);
    testContext.createSelector = testContext.compiler.createSelector.bind(testContext.compiler);
  });

  describe('Basic formulas', () => {
    test('should select an empty object', () => {
      const formula = testContext.createSelector({});
      expect(formula()).toEqual({});
    });

    test('should select a plain literal', () => {
      const formula = testContext.createSelector({
        '!': 1,
      });
      expect(formula()).toEqual(1);
    });

    test('should select a custom scope symbol', () => {
      const formula = testContext.createSelector({
        x: 'PI',
      });
      expect(formula()).toEqual({ x: 3.14 });
    });

    test('should throw on unknown symbol', () => {
      expect(() => {
        testContext.createSelector({
          x: 'UNKNOWN',
        });
      }).toThrowError(/Unknown dependency/);
    });

    test('should select a literal inside an object', () => {
      const formula = testContext.createSelector({
        a: { '!': 1 },
        b: 2,
      });
      expect(formula()).toEqual({
        a: 1,
        b: 2,
      });
    });

    test('should select "="', () => {
      const formula = testContext.createSelector({
        '=': 1,
      });
      expect(formula()).toEqual(1);
    });

    test('should select "=" with references to local scope', () => {
      const formula = testContext.createSelector({
        a: 1,
        '=': 'a',
      });
      expect(formula()).toEqual(1);
    });

    test('should select "=" inside object', () => {
      const formula = testContext.createSelector({
        a: { '=': 1 },
      });
      expect(formula()).toEqual({
        a: 1,
      });
    });

    test('should select a unary operator', () => {
      const formula = testContext.createSelector({
        $neg: 1,
      });
      expect(formula()).toEqual(-1);
    });

    test(
      'should select a unary operator with references to local scope',
      () => {
        const formula = testContext.createSelector({
          a: 1,
          $neg: 'a',
        });
        expect(formula()).toEqual(-1);
      },
    );

    test('should select a unary operator inside object', () => {
      const formula = testContext.createSelector({
        a: { $neg: 1 },
      });
      expect(formula()).toEqual({
        a: -1,
      });
    });

    test('should select a binary operator', () => {
      const formula = testContext.createSelector({
        $sub: [1, 2],
      });
      expect(formula()).toEqual(-1);
    });

    test(
      'should select a binary operator with references to local scope',
      () => {
        const formula = testContext.createSelector({
          a: 1,
          b: 2,
          $sub: ['a', 'b'],
        });
        expect(formula()).toEqual(-1);
      },
    );

    test('should select a binary operator inside object', () => {
      const formula = testContext.createSelector({
        a: { $sub: [1, 2] },
      });
      expect(formula()).toEqual({
        a: -1,
      });
    });

    test('should resolve basic dependency', () => {
      const formula = testContext.createSelector({
        a: 1,
        b: 'a',
      });
      expect(formula()).toEqual({
        a: 1,
        b: 1,
      });
    });

    test('should select a constant function', () => {
      const formula = testContext.createSelector({
        '?': [],
        '=': 1,
      });
      expect(formula()()).toEqual(1);
    });

    test('should select an identity function', () => {
      const formula = testContext.createSelector({
        '?': ['x'],
        '=': 'x',
      });
      expect(formula()(13)).toEqual(13);
    });

    test('should evaluate a function', () => {
      const formula = testContext.createSelector({
        identity: {
          '?': ['x'],
          '=': 'x',
        },
        a: {
          $call: ['identity', 2],
        },
      });
      expect(formula().a).toEqual(2);
    });

    test('should select a "property" function', () => {
      const formula = testContext.createSelector({
        '?': ['y'],
        x: 'y',
      });
      expect(formula()(13)).toEqual({ x: 13 });
    });

    test('should resolve a nested key from function argument', () => {
      const formula = testContext.createSelector({
        '?': ['y'],
        x: 'y.x',
      });
      expect(formula()({ x: 2 })).toEqual({ x: 2 });
    });
  });

  describe('Operators', () => {
    test('should evaluate function as an operator', () => {
      const formula = testContext.createSelector({
        a: {
          '?': ['x', 'y'],
          '=': { $add: ['x', 'y'] },
        },
        $: ['a', 1, 2],
      });
      expect(formula()).toEqual(3);
    });

    test('should evaluate function as an operator inside another function', () => {
      const formula = testContext.createSelector({
        a: {
          '?': ['x', 'y'],
          '=': { $add: ['x', 'y'] },
        },
        b: {
          '?': ['x', 'y'],
          '=': { $: ['a', 'x', 'y'] },
        },
        $: ['b', 1, 2],
      });
      expect(formula()).toEqual(3);
    });

    test('should partially evaluate function as an operator', () => {
      const formula = testContext.createSelector({
        a: {
          '?': ['x', 'y'],
          '=': { $add: ['x', 'y'] },
        },
        $: ['a', 1],
      });
      expect(formula()(2)).toEqual(3);
    });

    test('should evaluate recursive function as an operator', () => {
      const formula = testContext.createSelector({
        a: {
          '?': ['x'],
          '=': {
            $if: [
              { $lte: ['x', 0] },
              0,
              { $add: [{ $call: ['this', 'x - 1'] }, 'x'] },
            ],
          },
        },
        $: ['a', '2'],
      });
      expect(formula()).toEqual(3);
    });
  });

  describe('Complex formulas', () => {
    test('should use an explicit selector', () => {
      const formula = testContext.createSelector({
        a: identity,
      });
      expect(formula(1)).toEqual({
        a: 1,
      });
    });

    test('should use an explicit selector inside a function', () => {
      const formula = testContext.createSelector({
        '?': ['x'],
        y: identity,
        '=': { $add: ['x', 'y'] },
      });
      expect(formula(1)(2)).toBe(3);
    });

    test('should ignore comments', () => {
      const formula = testContext.createSelector({
        '#': 'This text should be ignored',
        a: 1,
      });
      expect(formula()).toEqual({
        a: 1,
      });
    });

    test('should exclude hidden variables', () => {
      const formula = testContext.createSelector({
        a: 'b',
        '~b': 1,
      });
      expect(formula()).toEqual({
        a: 1,
      });
    });

    test('should select nested properties', () => {
      const formula = testContext.createSelector({
        a: {
          b: 1,
        },
      });
      expect(formula()).toEqual({
        a: {
          b: 1,
        },
      });
    });

    test('should resolve dependency with nested key', () => {
      const formula = testContext.createSelector({
        a: {
          b: 1,
        },
        c: 'a.b',
      });
      expect(formula()).toEqual({
        a: {
          b: 1,
        },
        c: 1,
      });
    });

    test('should resolve dependency from parent scope', () => {
      const formula = testContext.createSelector({
        a: 1,
        b: {
          c: 'a',
        },
      });
      expect(formula()).toEqual({
        a: 1,
        b: {
          c: 1,
        },
      });
    });

    test('should shadow dependency from parent scope', () => {
      const formula = testContext.createSelector({
        a: 1,
        b: {
          a: 2,
          c: 'a',
        },
      });
      expect(formula()).toEqual({
        a: 1,
        b: {
          a: 2,
          c: 2,
        },
      });
    });

    test('should allow reference shadowed variable', () => {
      const formula = testContext.createSelector({
        a: 1,
        b: {
          a: { $add: ['^a', 1] },
        },
      });
      expect(formula()).toEqual({
        a: 1,
        b: {
          a: 2,
        },
      });
    });

    test('should allow argument reference', () => {
      const formula = testContext.createSelector({
        '~$0': '^$0.context',
        a: '$0.x',
      });
      expect(formula({
        context: { x: 1 },
      })).toEqual({
        a: 1,
      });
    });

    test('should extract field from the first argument', () => {
      const formula = testContext.createSelector({
        a: '$0.x',
      });
      expect(formula({ x: 1 })).toEqual({
        a: 1,
      });
    });

    test('should extract second argument', () => {
      const formula = testContext.createSelector({
        a: '$1',
      });
      expect(formula(null, 1)).toEqual({
        a: 1,
      });
    });

    test('should filter contents of an array', () => {
      const formula = testContext.createSelector({
        a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
        b: {
          $filter: ['a', { x: 1 }],
        },
      });
      expect(formula()).toEqual({
        a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
        b: [{ x: 1 }],
      });
    });

    test('should create a function based on a formula', () => {
      const formula = testContext.createSelector({
        a: {
          '?': ['x', 'y'],
          '=': {
            $add: ['x', 'y'],
          },
        },
      });
      const result = formula();
      expect(result.a(1, 2)).toEqual(3);
      expect(result.a(3, 4)).toEqual(7);
    });

    test('should evaluate a predefined formula', () => {
      const formula = testContext.createSelector({
        a: {
          '?': ['x', 'y'],
          '=': {
            $add: ['x', 'y'],
          },
        },
        b: {
          $call: ['a', 2, 3],
        },
      });
      const result = formula();
      expect(result.b).toEqual(5);
    });

    test('should evaluate comparision operator', () => {
      const formula = testContext.createSelector({
        a: {
          $lt: [1, 2],
        },
        b: {
          $lt: [2, 1],
        },
      });
      expect(formula()).toEqual({
        a: true,
        b: false,
      });
    });

    test('should evaluate conditional formula', () => {
      const formula = testContext.createSelector({
        min: {
          '?': ['x', 'y'],
          '=': {
            $if: [{ $lt: ['x', 'y'] }, 'x', 'y'],
          },
        },
      });
      const result = formula();
      expect(result.min(1, 2)).toEqual(1);
      expect(result.min(2, 1)).toEqual(1);
    });

    test('should evaluate a recursive function', () => {
      const formula = testContext.createSelector({
        triangle: {
          '?': ['x'],
          '=': {
            $if: [
              { $lt: ['x', 1] },
              0,
              { $add: ['x', { $call: ['this', { $add: ['x', -1] }] }] },
            ],
          },
        },
      });
      const result = formula();
      expect(result.triangle(2)).toEqual(3);
    });

    test('should evaluate a complex functions composition', () => {
      const formula = testContext.createSelector({
        subtract: {
          '?': ['x', 'y'],
          '=': { $sub: ['x', 'y'] },
        },
        swap: {
          '?': ['f'],
          '=': { '?': ['a', 'b'], $call: ['f', 'b', 'a'] },
        },
        value: {
          $call: [{ $call: ['swap', 'subtract'] }, 1, 2],
        },
      });
      const result = formula();
      expect(result.value).toBe(1);
      expect(result.subtract(1, 2)).toBe(-1);
      // NOTE: I don't believe this one works :)
      expect(result.swap((x, y) => x / y)(5, 10)).toBe(2);
    });

    test('should process a tree data structure', () => {
      const formula = testContext.createSelector({
        map: {
          '?': ['node'],
          '=': {
            $if: [
              'node',
              {
                name: 'node.name',
                left: { $call: ['this', 'node.left'] },
                right: { $call: ['this', 'node.right'] },
              },
              '"[unknown]"',
            ],
          },
        },
        '=': {
          $call: ['map', '$0'],
        },
      });
      const result = formula({
        name: 'A',
        left: {
          name: 'B',
          left: {
            name: 'C',
          },
          right: {
            name: 'D',
          },
        },
      });
      expect(result).toEqual({
        name: 'A',
        left: {
          name: 'B',
          left: {
            name: 'C',
            left: '[unknown]',
            right: '[unknown]',
          },
          right: {
            name: 'D',
            left: '[unknown]',
            right: '[unknown]',
          },
        },
        right: '[unknown]',
      });
    });
  });

  describe.skip('Macros', () => {
    test('should use an explicit selector as a macro', () => {
      const formula = testContext.createSelector({
        // TODO: This also works, why?
        // a: { ':=': identity },
        a: { ':=': constant(identity) },
      });
      expect(formula(1)).toEqual({
        a: 1,
      });
    });

    test('should use a function expression as a macro', () => {
      const formula = testContext.createSelector({
        '~selector': {
          '?': ['0', '1'],
          '=': { $add: ['$0', '$1'] },
        },
        a: { ':=': '$selector' },
      });
      expect(formula(1, 2)).toEqual({
        a: 3,
      });
    });

    test('should create macro from explicit expression', () => {
      const formula = testContext.createSelector({
        selector: {
          '_=': { _$add: ['_$0', '_$1'] },
        },
        a: { ':=': '$selector' },
      });
      expect(formula(1, 2)).toEqual({
        selector: {
          '=': { $add: ['$0', '$1'] },
        },
        a: 3,
      });
    });

    test('should create a parametrized macro', () => {
      const formula = testContext.createSelector({
        '~selector': {
          '?': ['x', 'y'],
          '_=': { _$add: ['x', 'y'] },
        },
        a: { ':=': { $selector: ['$0', '$1'] } },
      });
      expect(formula(1, 2)).toEqual({
        a: 3,
      });
    });
  });

  describe('Value mappings', () => {
    test('should map object fields', () => {
      const formula = testContext.createSelector({
        $map: ['$0', {
          '?': ['value', 'key'],
          '=': {
            v: 'value',
            k: 'key',
          },
        }],
      });
      expect(formula({ a: 1, b: 2 })).toEqual({
        a: { v: 1, k: 'a' },
        b: { v: 2, k: 'b' },
      });
    });

    test('should map array elements', () => {
      const formula = testContext.createSelector({
        $map: ['$0', {
          '?': ['value', 'key'],
          '=': {
            v: 'value',
            k: 'key',
          },
        }],
      });
      expect(formula([1, 2])).toEqual([
        { v: 1, k: 0 },
        { v: 2, k: 1 },
      ]);
    });

    test('should map array elements with custom caching key', () => {
      const formula = testContext.createSelector({
        $map: ['$0', {
          '?': ['x', 'y'],
          '=': { v: { $sum: ['y', '","', 'x.v'] } },
        }],
        '~key': '"id"',
      });
      expect(formula([
        { id: '1', v: 'a' },
        { id: '2', v: 'b' },
        { id: '3', v: 'c' },
      ])).toEqual([
        { v: '1,a' },
        { v: '2,b' },
        { v: '3,c' },
      ]);
    });
  });

  describe('Native functions', () => {
    test('should embed a custom selector', () => {
      const formula = testContext.createSelector({
        x: (...args) => args[0],
      });
      expect(formula(1)).toEqual({
        x: 1,
      });
    });

    test('should be able to embed a custom function', () => {
      const func = x => x + 1;
      const formula = testContext.createSelector({
        func: { '!': func },
        x: { $call: ['func', 2] },
      });
      expect(formula(1)).toEqual({
        func,
        x: 3,
      });
    });

    test('should be able to to call a custom function directly', () => {
      const func = x => x + 1;
      const formula = testContext.createSelector({
        x: 3,
        z: {
          $call: [{ '!': func }, 'x'],
        },
      });
      expect(formula(1)).toEqual({
        x: 3,
        z: 4,
      });
    });
  });

  describe('Advanced functions', () => {
    test('should create a function parametrized by input', () => {
      const formula = testContext.createSelector({
        x: '$0.value',
        inc: {
          '?': ['y'],
          '=': {
            $add: ['x', 'y'],
          },
        },
      });
      expect(formula({ value: 2 }).inc(1)).toBe(3);
    });

    test(
      'should be able to invoke a function with one argument instead of arguments list',
      () => {
        const formula = testContext.createSelector({
          inc: {
            '?': ['x'],
            '=': {
              $add: ['x', 1],
            },
          },
          val: {
            $call: ['inc', 1],
          },
        });
        expect(formula().val).toBe(2);
      },
    );

    test(
      'should be able to invoke an operator with one argument instead of arguments list',
      () => {
        const formula = testContext.createSelector({
          a: { $not: true },
          b: { $not: [true] },
        });
        expect(formula()).toEqual({
          a: false,
          b: false,
        });
      },
    );

    test('should create constant functor', () => {
      const formula = testContext.createSelector({
        constant: {
          '?': ['x'],
          '=': {
            '?': [],
            '=': 'x',
          },
        },
      });
      expect(formula().constant(2)()).toBe(2);
    });

    test('should create a nested function', () => {
      const formula = testContext.createSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': { $add: ['x', 'y'] },
          },
        },
      });
      expect(formula().add(2)(3)).toBe(5);
    });

    test('should create a double nested function', () => {
      const formula = testContext.createSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': {
              '?': ['z'],
              '=': { $sum: ['x', 'y', 'z'] },
            },
          },
        },
      });
      expect(formula().add(1)(2)(3)).toBe(6);
    });

    test('should partially apply a nested function', () => {
      const formula = testContext.createSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': { $add: ['x', 'y'] },
          },
        },
        add1: { $call: ['add', 1] },
        value: { $call: ['add1', 4] },
      });
      expect(formula().add1(2)).toBe(3);
      expect(formula().value).toBe(5);
    });
  });

  describe('Value persistance', () => {
    test('should persist on constant formula', () => {
      const formula = testContext.createSelector({
        a: 1,
      });
      expect(formula({})).toBe(formula({}));
    });

    test('should persist if dependencies do not change', () => {
      const formula = testContext.createSelector({
        a: '$0.x',
      });
      expect(formula({ x: 1, y: 1 })).toBe(formula({ x: 1, y: 2 }));
    });

    test('should persist a function call', () => {
      const formula = testContext.createSelector({
        map: {
          '?': ['x'],
          v: 'x',
        },
        a: { $call: ['map', '$0.x'] },
      });
      expect(formula({ x: 1, y: 1 })).toBe(formula({ x: 1, y: 2 }));
    });

    test('should persist a constant function expression', () => {
      const formula = testContext.createSelector({
        one: {
          '?': [],
          '=': 1,
        },
      });
      const out1 = formula({});
      const out2 = formula({});
      expect(out1).toBe(out2);
    });

    test('should persist a double constant function expression', () => {
      const formula = testContext.createSelector({
        one: {
          '?': [],
          '=': {
            '?': [],
            '=': 1,
          },
        },
      });
      const out1 = formula({});
      const out2 = formula({});
      expect(out1).toBe(out2);
    });

    test('should persist calling function on object', () => {
      const formula = testContext.createSelector({
        project: {
          '?': ['point'],
          '=': 'point.x',
        },
        a: { $project: '$0' },
      });
      const out1 = formula({ x: 1, y: 1 });
      const out2 = formula({ x: 1, y: 1 });
      expect(out1).toBe(out2);
    });

    test('should persist value on $dot operator', () => {
      const formula = testContext.createSelector({
        a: '$0.x',
      });
      const out1 = formula({ x: 1 });
      const out2 = formula({ x: 1 });
      expect(out1).toBe(out2);
    });

    test('should persist map values', () => {
      const formula = testContext.createSelector({
        $map: ['$0', {
          '?': ['value', 'index'],
          '=': {
            v: 'value',
            i: 'index',
          },
        }],
      });
      const out1 = formula({ a: 1, b: 2 });
      const out2 = formula({ a: 1, b: 2 });
      expect(out1).toBe(out2);
    });

    test('should persist map array elements with custom caching key', () => {
      const formula = testContext.createSelector({
        $map: ['$0', {
          '?': ['x'],
          '=': { v: { $dot: ['x', { '!': 'v' }] } },
        }],
        '~key': '"id"',
      });
      const doc1 = { id: '1', v: 'a' };
      const doc2 = { id: '2', v: 'b' };
      const doc3 = { id: '3', v: 'c' };
      const out1 = formula([
        doc1,
        doc2,
        doc3,
      ]);
      const out2 = formula([
        doc3,
        doc1,
        doc2,
      ]);
      expect(out1[0]).toBe(out2[1]);
      expect(out1[1]).toBe(out2[2]);
      expect(out1[2]).toBe(out2[0]);
    });
  });
});

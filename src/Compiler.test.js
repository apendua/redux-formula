/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import Compiler from './Compiler';
import presetDefault from './presets/default';
import { identity } from './utils';

chai.should();
chai.use(sinonChai);

describe('Test Compiler', function () {
  beforeEach(function () {
    this.compiler = new Compiler({
      plugins: presetDefault,
    });
    this.createSelector = this.compiler.createSelector.bind(this.compiler);
  });

  describe('Basic formulas', function () {
    it('should select an empty object', function () {
      const formula = this.createSelector({});
      formula().should.deep.equal({});
    });

    it('should select a plain literal', function () {
      const formula = this.createSelector({
        '!': 1,
      });
      formula().should.deep.equal(1);
    });

    it('should select a literal inside an object', function () {
      const formula = this.createSelector({
        a: { '!': 1 },
        b: 2,
      });
      formula().should.deep.equal({
        a: 1,
        b: 2,
      });
    });

    it('should select a unary operator', function () {
      const formula = this.createSelector({
        '=': 1,
      });
      formula().should.deep.equal(1);
    });

    it('should select a unary operator with references to local scope', function () {
      const formula = this.createSelector({
        a: 1,
        '=': '$a',
      });
      formula().should.deep.equal(1);
    });

    it('should select a unary operator inside object', function () {
      const formula = this.createSelector({
        a: { '=': 1 },
      });
      formula().should.deep.equal({
        a: 1,
      });
    });

    it('should select a binary operator', function () {
      const formula = this.createSelector({
        $sub: [1, 2],
      });
      formula().should.deep.equal(-1);
    });

    it('should select a binary operator with references to local scope', function () {
      const formula = this.createSelector({
        a: 1,
        b: 2,
        $sub: ['$a', '$b'],
      });
      formula().should.deep.equal(-1);
    });

    it('should select a binary operator inside object', function () {
      const formula = this.createSelector({
        a: { $sub: [1, 2] },
      });
      formula().should.deep.equal({
        a: -1,
      });
    });

    it('should resolve basic dependency', function () {
      const formula = this.createSelector({
        a: 1,
        b: '$a',
      });
      formula().should.deep.equal({
        a: 1,
        b: 1,
      });
    });

    it('should select a constant function', function () {
      const formula = this.createSelector({
        '?': [],
        '=': 1,
      });
      formula()().should.deep.equal(1);
    });

    it('should select an identity function', function () {
      const formula = this.createSelector({
        '?': ['x'],
        '=': '$x',
      });
      formula()(13).should.deep.equal(13);
    });

    it('should evaluate a function', function () {
      const formula = this.createSelector({
        identity: {
          '?': ['x'],
          '=': '$x',
        },
        a: {
          $identity: 2,
        },
      });
      formula().a.should.deep.equal(2);
    });

    it('should select a "property" function', function () {
      const formula = this.createSelector({
        '?': ['y'],
        x: '$y',
      });
      formula()(13).should.deep.equal({ x: 13 });
    });

    it('should resolve a nested key from function argument', function () {
      const formula = this.createSelector({
        '?': ['y'],
        x: '$y.x',
      });
      formula()({ x: 2 }).should.deep.equal({ x: 2 });
    });
  });

  describe('Complex formulas', function () {
    it('should use an explicit selector', function () {
      const formula = this.createSelector({
        a: identity,
      });
      formula(1).should.deep.equal({
        a: 1,
      });
    });

    it('should use an explicit selector inside a function', function () {
      const formula = this.createSelector({
        '?': ['x'],
        y: identity,
        '=': { $add: ['$x', '$y'] },
      });
      formula(1)(2).should.equal(3);
    });

    it('should ignore comments', function () {
      const formula = this.createSelector({
        '#': 'This text should be ignored',
        a: 1,
      });
      formula().should.deep.equal({
        a: 1,
      });
    });

    it('should exclude hidden variables', function () {
      const formula = this.createSelector({
        a: '$b',
        '~b': 1,
      });
      formula().should.deep.equal({
        a: 1,
      });
    });

    it('should select nested properties', function () {
      const formula = this.createSelector({
        a: {
          b: 1,
        },
      });
      formula().should.deep.equal({
        a: {
          b: 1,
        },
      });
    });

    it('should resolve dependency with nested key', function () {
      const formula = this.createSelector({
        a: {
          b: 1,
        },
        c: '$a.b',
      });
      formula().should.deep.equal({
        a: {
          b: 1,
        },
        c: 1,
      });
    });

    it('should resolve dependency from parent scope', function () {
      const formula = this.createSelector({
        a: 1,
        b: {
          c: '$a',
        },
      });
      formula().should.deep.equal({
        a: 1,
        b: {
          c: 1,
        },
      });
    });

    it('should shadow dependency from parent scope', function () {
      const formula = this.createSelector({
        a: 1,
        b: {
          a: 2,
          c: '$a',
        },
      });
      formula().should.deep.equal({
        a: 1,
        b: {
          a: 2,
          c: 2,
        },
      });
    });

    it('should extract field from the first argument', function () {
      const formula = this.createSelector({
        a: '$0.x',
      });
      formula({ x: 1 }).should.deep.equal({
        a: 1,
      });
    });

    it('should extract second argument', function () {
      const formula = this.createSelector({
        a: '$1',
      });
      formula(null, 1).should.deep.equal({
        a: 1,
      });
    });

    it('should filter contents of an array', function () {
      const formula = this.createSelector({
        a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
        b: {
          $filter: ['$a', { x: 1 }],
        },
      });
      formula().should.deep.equal({
        a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
        b: [{ x: 1 }],
      });
    });

    it('should create a function based on a formula', function () {
      const formula = this.createSelector({
        a: {
          '?': ['x', 'y'],
          '=': {
            $add: ['$x', '$y'],
          },
        },
      });
      const result = formula();
      result.a(1, 2).should.deep.equal(3);
      result.a(3, 4).should.deep.equal(7);
    });

    it('should evaluate a predefined formula', function () {
      const formula = this.createSelector({
        a: {
          '?': ['x', 'y'],
          '=': {
            $add: ['$x', '$y'],
          },
        },
        b: {
          $a: [2, 3],
        },
      });
      const result = formula();
      result.b.should.deep.equal(5);
    });

    it('should evaluate comparision operator', function () {
      const formula = this.createSelector({
        a: {
          $lt: [1, 2],
        },
        b: {
          $lt: [2, 1],
        },
      });
      formula().should.deep.equal({
        a: true,
        b: false,
      });
    });

    it('should evaluate conditional formula', function () {
      const formula = this.createSelector({
        min: {
          '?': ['x', 'y'],
          '=': {
            $if: [{ $lt: ['$x', '$y'] }, '$x', '$y'],
          },
        },
      });
      const result = formula();
      result.min(1, 2).should.deep.equal(1);
      result.min(2, 1).should.deep.equal(1);
    });

    it('should evaluate a recursive function', function () {
      const formula = this.createSelector({
        triangle: {
          '?': ['x'],
          '=': {
            $if: [
              { $lt: ['$x', 1] },
              0,
              { $add: ['$x', { $this: { $add: ['$x', -1] } }] },
            ],
          },
        },
      });
      const result = formula();
      result.triangle(2).should.deep.equal(3);
    });

    it('should evaluate a complex functions composition', function () {
      const formula = this.createSelector({
        subtract: {
          '?': ['x', 'y'],
          '=': { $sub: ['$x', '$y'] },
        },
        swap: {
          '?': ['f'],
          '=': { '?': ['a', 'b'], $f: ['$b', '$a'] },
        },
        value: {
          '<<': [1, 2],
          '>>': { $swap: '$subtract' },
        },
      });
      const result = formula();
      result.value.should.equal(1);
      result.subtract(1, 2).should.equal(-1);
      // NOTE: I don't believe this one works :)
      result.swap((x, y) => x / y)(5, 10).should.equal(2);
    });

    it('should process a tree data structure', function () {
      const formula = this.createSelector({
        map: {
          '?': ['node'],
          '=': {
            $if: [
              '$node',
              {
                name: '$node.name',
                left: { $this: '$node.left' },
                right: { $this: '$node.right' },
              },
              '[unknown]',
            ],
          },
        },
        '=': {
          $map: '$0',
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
      result.should.deep.equal({
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

  describe('Value mappings', function () {
    it('should map object fields', function () {
      const formula = this.createSelector({
        '<-': '$0',
        '->': {
          '?': ['value', 'key'],
          '=': {
            v: '$value',
            k: '$key',
          },
        },
      });
      formula({ a: 1, b: 2 }).should.deep.equal({
        a: { v: 1, k: 'a' },
        b: { v: 2, k: 'b' },
      });
    });

    it('should map array elements', function () {
      const formula = this.createSelector({
        '<-': '$0',
        '->': {
          '?': ['value', 'key'],
          '=': {
            v: '$value',
            k: '$key',
          },
        },
      });
      formula([1, 2]).should.deep.equal([
        { v: 1, k: 0 },
        { v: 2, k: 1 },
      ]);
    });

    it('should map array elements with custom caching key', function () {
      const formula = this.createSelector({
        '<-': '$0',
        '->': {
          '?': ['x', 'y'],
          '=': { v: { $sum: ['$y', ',', '$x.v'] } },
        },
        '~key': 'id',
      });
      formula([
        { id: '1', v: 'a' },
        { id: '2', v: 'b' },
        { id: '3', v: 'c' },
      ]).should.deep.equal([
        { v: '1,a' },
        { v: '2,b' },
        { v: '3,c' },
      ]);
    });
  });

  describe('Native functions', function () {
    it('should embed a custom selector', function () {
      const formula = this.createSelector({
        x: (...args) => args[0],
      });
      formula(1).should.deep.equal({
        x: 1,
      });
    });

    it('should be able to embed a custom function', function () {
      const func = x => x + 1;
      const formula = this.createSelector({
        func: { '!': func },
        x: { $func: [2] },
      });
      formula(1).should.deep.equal({
        func,
        x: 3,
      });
    });

    it('should be able to to call a custom function directly', function () {
      const func = x => x + 1;
      const formula = this.createSelector({
        x: 3,
        // y: { '!': func, '>': ['$x'] },
        z: { '<<': ['$x'], '>!': func },
      });
      formula(1).should.deep.equal({
        x: 3,
        // y: 4,
        z: 4,
      });
    });
  });

  describe('Advanced functions', function () {
    it('should create a function parametrized by input', function () {
      const formula = this.createSelector({
        x: '$0.value',
        inc: {
          '?': ['y'],
          '=': {
            $add: ['$x', '$y'],
          },
        },
      });
      formula({ value: 2 }).inc(1).should.equal(3);
    });

    it('should be able to invoke a function via operator notation', function () {
      const formula = this.createSelector({
        inc: {
          '?': ['x'],
          '=': {
            $add: ['$x', 1],
          },
        },
        val: { $inc: [1] },
      });
      formula().val.should.equal(2);
    });

    it('should be able to invoke a function with one argument instead of arguments list', function () {
      const formula = this.createSelector({
        inc: {
          '?': ['x'],
          '=': {
            $add: ['$x', 1],
          },
        },
        val: {
          '<<': 1,
          '>>': '$inc',
        },
      });
      formula().val.should.equal(2);
    });

    it('should be able to invoke an operator with one argument instead of arguments list', function () {
      const formula = this.createSelector({
        a: { $not: true },
        b: { $not: [true] },
      });
      formula().should.deep.equal({
        a: false,
        b: false,
      });
    });

    it('should create constant functor', function () {
      const formula = this.createSelector({
        constant: {
          '?': ['x'],
          '=': {
            '?': [],
            '=': '$x',
          },
        },
      });
      formula().constant(2)().should.equal(2);
    });

    it('should create a nested function', function () {
      const formula = this.createSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': { $add: ['$x', '$y'] },
          },
        },
      });
      formula().add(2)(3).should.equal(5);
    });

    it('should create a double nested function', function () {
      const formula = this.createSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': {
              '?': ['z'],
              '=': { $sum: ['$x', '$y', '$z'] },
            },
          },
        },
      });
      formula().add(1)(2)(3).should.equal(6);
    });

    it('should partially apply a nested function', function () {
      const formula = this.createSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': { $add: ['$x', '$y'] },
          },
        },
        add1: { $add: [1] },
        value: { $add1: [4] },
      });
      formula().add1(2).should.equal(3);
      formula().value.should.equal(5);
    });
  });

  describe('Value persistance', function () {
    it('should persist on constant formula', function () {
      const formula = this.createSelector({
        a: 1,
      });
      formula({}).should.equal(formula({}));
    });

    it('should persist if dependencies do not change', function () {
      const formula = this.createSelector({
        a: '$0.x',
      });
      formula({ x: 1, y: 1 }).should.equal(formula({ x: 1, y: 2 }));
    });

    it('should persist a function call', function () {
      const formula = this.createSelector({
        map: {
          '?': ['x'],
          v: '$x',
        },
        a: { $map: '$0.x' },
      });
      formula({ x: 1, y: 1 }).should.equal(formula({ x: 1, y: 2 }));
    });

    it('should persist map values', function () {
      const formula = this.createSelector({
        '<-': '$0',
        '->': {
          '?': ['value', 'index'],
          '=': {
            v: '$value',
            i: '$index',
          },
        },
      });
      const out1 = formula({ a: 1, b: 2 });
      const out2 = formula({ a: 1, b: 2 });
      out1.should.equal(out2);
    });

    it('should persist map array elements with custom caching key', function () {
      const formula = this.createSelector({
        '<-': '$0',
        '->': {
          '?': ['x'],
          '=': { v: '$x.v' },
        },
        '~key': 'id',
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
      out1[0].should.equal(out2[1]);
      out1[1].should.equal(out2[2]);
      out1[2].should.equal(out2[0]);
    });
  });
});

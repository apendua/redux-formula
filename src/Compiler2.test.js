/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import Compiler from './Compiler2';

chai.should();
chai.use(sinonChai);

const constant = x => () => x;

describe('Test Compiler2', function () {
  beforeEach(function () {
    this.compiler = new Compiler();
    this.createFormulaSelector = this.compiler.createFormulaSelector.bind(this.compiler);
  });

  describe('Basic formulas', function () {
    it('should select an empty object', function () {
      const formula = this.createFormulaSelector({});
      formula().should.deep.equal({});
    });

    it('should select a plain literal', function () {
      const formula = this.createFormulaSelector({
        '!': 1,
      });
      formula().should.deep.equal(1);
    });

    it('should select a literal inside an object', function () {
      const formula = this.createFormulaSelector({
        a: { '!': 1 },
        b: 2,
      });
      formula().should.deep.equal({
        a: 1,
        b: 2,
      });
    });

    it('should select a unary operator', function () {
      const formula = this.createFormulaSelector({
        '=': 1,
      });
      formula().should.deep.equal(1);
    });

    it('should select a unary operator with references to local scope', function () {
      const formula = this.createFormulaSelector({
        a: 1,
        '=': '$a',
      });
      formula().should.deep.equal(1);
    });

    it('should select a unary operator inside object', function () {
      const formula = this.createFormulaSelector({
        a: { '=': 1 },
      });
      formula().should.deep.equal({
        a: 1,
      });
    });

    it('should select a binary operator', function () {
      const formula = this.createFormulaSelector({
        $sub: [1, 2],
      });
      formula().should.deep.equal(-1);
    });

    it('should select a binary operator with references to local scope', function () {
      const formula = this.createFormulaSelector({
        a: 1,
        b: 2,
        $sub: ['$a', '$b'],
      });
      formula().should.deep.equal(-1);
    });

    it('should select a binary operator inside object', function () {
      const formula = this.createFormulaSelector({
        a: { $sub: [1, 2] },
      });
      formula().should.deep.equal({
        a: -1,
      });
    });

    it('should resolve basic dependency', function () {
      const formula = this.createFormulaSelector({
        a: 1,
        b: '$a',
      });
      formula().should.deep.equal({
        a: 1,
        b: 1,
      });
    });

    it('should select a constant function', function () {
      const formula = this.createFormulaSelector({
        '?': [],
        '=': 1,
      });
      formula()().should.deep.equal(1);
    });

    it('should select an identity function', function () {
      const formula = this.createFormulaSelector({
        '?': ['x'],
        '=': '$x',
      });
      formula()(13).should.deep.equal(13);
    });

    it('should evaluate a function', function () {
      const formula = this.createFormulaSelector({
        identity: {
          '?': ['x'],
          '=': '$x',
        },
        a: {
          '(': ['$identity', 2],
        },
      });
      formula().a.should.deep.equal(2);
    });

    it('should select a "property" function', function () {
      const formula = this.createFormulaSelector({
        '?': ['y'],
        x: '$y',
      });
      formula()(13).should.deep.equal({ x: 13 });
    });

    it('should resolve a nested key from function argument', function () {
      const formula = this.createFormulaSelector({
        '?': ['y'],
        x: '$y.x',
      });
      formula()({ x: 2 }).should.deep.equal({ x: 2 });
    });
  });

  describe('Complex formulas', function () {
    it('should use an explicit selector', function () {
      const formula = this.createFormulaSelector({
        a: constant(1),
      });
      formula().should.deep.equal({
        a: 1,
      });
    });

    it('should ignore comments', function () {
      const formula = this.createFormulaSelector({
        '#': 'This text should be ignored',
        a: 1,
      });
      formula().should.deep.equal({
        a: 1,
      });
    });

    it('should select nested properties', function () {
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
        a: ':0.x',
      });
      formula({ x: 1 }).should.deep.equal({
        a: 1,
      });
    });

    it('should extract second argument', function () {
      const formula = this.createFormulaSelector({
        a: ':1',
      });
      formula(null, 1).should.deep.equal({
        a: 1,
      });
    });

    it.skip('should filter contents of an array', function () {
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
        a: {
          '?': ['x', 'y'],
          '=': {
            $add: ['$x', '$y'],
          },
        },
        b: {
          '(': ['$a', 2, 3],
        },
      });
      const result = formula();
      result.b.should.deep.equal(5);
    });

    it('should evaluate comparision operator', function () {
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
        triangle: {
          '?': ['x'],
          '=': {
            $if: [
              { $lt: ['$x', 1] },
              0,
              { $add: ['$x', { '(': ['$this', { $add: ['$x', -1] }] }] },
            ],
          },
        },
      });
      const result = formula();
      result.triangle(2).should.deep.equal(3);
    });

    it('should evaluate a complex functions composition', function () {
      const formula = this.createFormulaSelector({
        subtract: {
          '?': ['x', 'y'],
          '=': { $sub: ['$x', '$y'] },
        },
        swap: {
          '?': ['f'],
          '=': { '?': ['a', 'b'], '(': ['$f', '$b', '$a'] },
        },
        value: {
          '(': [
            { '(': ['$swap', '$subtract'] },
            1,
            2,
          ],
        },
      });
      const result = formula();
      result.value.should.equal(1);
      result.subtract(1, 2).should.equal(-1);
      // NOTE: I don't believe this one works :)
      result.swap((x, y) => x / y)(5, 10).should.equal(2);
    });

    it('should process a tree data structure', function () {
      const formula = this.createFormulaSelector({
        map: {
          '?': ['node'],
          '=': {
            $if: [
              '$node',
              {
                name: '$node.name',
                left: { '(': ['$this', '$node.left'] },
                right: { '(': ['$this', '$node.right'] },
              },
              '[unknown]',
            ],
          },
        },
        '=': {
          '(': ['$map', ':0'],
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

  describe('Advanced functions', function () {
    it('should create a function parametrized by input', function () {
      const formula = this.createFormulaSelector({
        x: ':0.value',
        inc: {
          '?': ['y'],
          '=': {
            $add: ['$x', '$y'],
          },
        },
      });
      formula({ value: 2 }).inc(1).should.equal(3);
    });

    it('should create constant functor', function () {
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
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
      const formula = this.createFormulaSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': {
              '?': ['z'],
              '=': { $add: ['$x', '$y', '$z'] },
            },
          },
        },
      });
      formula().add(1)(2)(3).should.equal(6);
    });

    it('should partially apply a nested function', function () {
      const formula = this.createFormulaSelector({
        add: {
          '?': ['x'],
          '=': {
            '?': ['y'],
            '=': { $add: ['$x', '$y'] },
          },
        },
        add1: { '(': ['$add', 1] },
        value: { '(': ['$add1', 4] },
      });
      formula().add1(2).should.equal(3);
      formula().value.should.equal(5);
    });
  });

  describe('Selector persistance', function () {
    it('should persist on constant formula', function () {
      const formula = this.createFormulaSelector({
        a: 1,
      });
      formula({}).should.equal(formula({}));
    });

    it('should persist if dependencies do not change', function () {
      const formula = this.createFormulaSelector({
        a: ':0.x',
      });
      formula({ x: 1, y: 1 }).should.equal(formula({ x: 1, y: 2 }));
    });

    it('should persist a function call', function () {
      const formula = this.createFormulaSelector({
        map: {
          '?': ['x'],
          v: '$x',
        },
        a: { '(': ['$map', ':0.x'] },
      });
      formula({ x: 1, y: 1 }).should.equal(formula({ x: 1, y: 2 }));
    });

    it.skip('should persist map values', function () {
      const formula = this.createFormulaSelector({
        $map: [':0', {
          '?': ['value', 'index'],
          v: '$value',
          i: '$index',
        }],
      });
      const out1 = formula([1, 2]);
      const out2 = formula([1, 2]);
      out1.should.deep.equal([
        { v: 1, i: 0 },
        { v: 2, i: 1 },
      ]);
      out1[0].should.equal(out2[0]);
    });
  });
});

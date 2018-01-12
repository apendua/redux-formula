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
        $literal: 1,
      });
      formula().should.deep.equal(1);
    });

    it('should select a literal inside an object', function () {
      const formula = this.createFormulaSelector({
        a: { $literal: 1 },
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
        $: [],
        '=': 1,
      });
      formula()().should.deep.equal(1);
    });

    it('should select an identity function', function () {
      const formula = this.createFormulaSelector({
        $: ['x'],
        '=': '$x',
      });
      formula()(13).should.deep.equal(13);
    });

    it('should evaluate a function', function () {
      const formula = this.createFormulaSelector({
        identity: {
          $: ['x'],
          '=': '$x',
        },
        a: {
          '()': ['$identity', 2],
        },
      });
      formula().a.should.deep.equal(2);
    });

    it('should select a "property" function', function () {
      const formula = this.createFormulaSelector({
        $: ['y'],
        x: '$y',
      });
      formula()(13).should.deep.equal({ x: 13 });
    });
  });

  describe('Complex formulas', function () {
    it.skip('should select an indirect property', function () {
      const formula = this.createFormulaSelector({
        a: constant(1),
      });
      formula().should.deep.equal({
        a: 1,
      });
    });

    it.skip('should select nested properties', function () {
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

    it.skip('should extract field from the first argument', function () {
      const formula = this.createFormulaSelector({
        a: { $arg: [0, 'x'] },
      });
      formula({ x: 1 }).should.deep.equal({
        a: 1,
      });
    });

    it.skip('should extract second argument', function () {
      const formula = this.createFormulaSelector({
        a: { $arg: 1 },
      });
      formula(null, 1).should.deep.equal({
        a: 1,
      });
    });

    it('should filter contents of an array', function () {
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
          $: ['x', 'y'],
          '=': {
            $add: ['$x', '$y'],
          },
        },
      });
      const result = formula();
      result.a(1, 2).should.deep.equal(3);
      result.a(3, 4).should.deep.equal(7);
    });

    it('should create a function parametrized by input', function () {
      const formula = this.createFormulaSelector({
        incValue: {
          $arg: [0, 'value'],
        },
        inc: {
          $: ['x'],
          '=': {
            $add: ['$x', '$incValue'],
          },
        },
      });
      formula({ value: 2 }).inc(1).should.equal(3);
    });

    it('should evaluate a predefined formula', function () {
      const formula = this.createFormulaSelector({
        a: {
          $: ['x', 'y'],
          '=': {
            $add: ['$x', '$y'],
          },
        },
        b: {
          '()': ['$a', 2, 3],
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

    it.skip('should evaluate conditional formula', function () {
      const formula = this.createFormulaSelector({
        min: {
          $: ['x', 'y'],
          '=': {
            $if: [{ $lt: ['$x', '$y'] }, '$x', '$y'],
          },
        },
      });
      const result = formula();
      result.min(1, 2).should.deep.equal(1);
      result.min(2, 1).should.deep.equal(1);
    });

    it.skip('should evaluate a recursive function', function () {
      const formula = this.createFormulaSelector({
        triangle: {
          $: ['f', 'x'],
          '=': {
            $if: [
              { $lt: ['$x', 1] },
              0,
              { $add: ['$x', { '()': ['$f', '$f', { $add: ['$x', -1] }] }] },
            ],
          },
        },
      });
      const result = formula();
      result.triangle(result.triangle, 2).should.deep.equal(3);
    });

    it.skip('should evaluate a complex functions composition', function () {
      const formula = this.createFormulaSelector({
        subtract: {
          $: ['x', 'y'],
          '=': { $sub: ['$x', '$y'] },
        },
        swap: {
          $: ['f'],
          '=': {
            $: ['a', 'b'],
            '=': {
              '()': ['$f', '$b', '$a'],
            },
          },
        },
        value: {
          '()': [
            { '()': ['$swap', '$subtract'] },
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
  });
});

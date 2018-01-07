/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import Compiler from './Compiler';

chai.should();
chai.use(sinonChai);

const constant = x => () => x;

describe('Test Compiler', function () {
  beforeEach(function () {
    this.compiler = new Compiler();
    this.createFormulaSelector = this.compiler.createFormulaSelector.bind(this.compiler);
  });

  it('should select an empty object', function () {
    const sheet = this.createFormulaSelector({});
    sheet().should.deep.equal({});
  });

  it('should select a literal', function () {
    const sheet = this.createFormulaSelector({
      a: { $literal: 1 },
    });
    sheet().should.deep.equal({
      a: 1,
    });
  });

  it('should select an explicit property', function () {
    const sheet = this.createFormulaSelector({
      a: 1,
    });
    sheet().should.deep.equal({
      a: 1,
    });
  });

  it('should select an indirect property', function () {
    const sheet = this.createFormulaSelector({
      a: constant(1),
    });
    sheet().should.deep.equal({
      a: 1,
    });
  });

  it('should select nested properties', function () {
    const sheet = this.createFormulaSelector({
      a: {
        b: 1,
        c: constant(2),
      },
    });
    sheet().should.deep.equal({
      a: {
        b: 1,
        c: 2,
      },
    });
  });

  it('should resolve basic dependency', function () {
    const sheet = this.createFormulaSelector({
      a: 1,
      b: '$a',
    });
    sheet().should.deep.equal({
      a: 1,
      b: 1,
    });
  });

  it('should resolve dependency with nested key', function () {
    const sheet = this.createFormulaSelector({
      a: {
        b: 1,
      },
      c: '$a.b',
    });
    sheet().should.deep.equal({
      a: {
        b: 1,
      },
      c: 1,
    });
  });

  it('should resolve dependency from parent scope', function () {
    const sheet = this.createFormulaSelector({
      a: 1,
      b: {
        c: '$a',
      },
    });
    sheet().should.deep.equal({
      a: 1,
      b: {
        c: 1,
      },
    });
  });

  it('should shadow dependency from parent scope', function () {
    const sheet = this.createFormulaSelector({
      a: 1,
      b: {
        a: 2,
        c: '$a',
      },
    });
    sheet().should.deep.equal({
      a: 1,
      b: {
        a: 2,
        c: 2,
      },
    });
  });

  it('should extract field from the first argument', function () {
    const sheet = this.createFormulaSelector({
      a: { $arg: [0, 'x'] },
    });
    sheet({ x: 1 }).should.deep.equal({
      a: 1,
    });
  });

  it('should extract second argument', function () {
    const sheet = this.createFormulaSelector({
      a: { $arg: 1 },
    });
    sheet(null, 1).should.deep.equal({
      a: 1,
    });
  });

  it('should filter contents of an array', function () {
    const sheet = this.createFormulaSelector({
      a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
      b: {
        $filter: ['$a', { x: 1 }],
      },
    });
    sheet().should.deep.equal({
      a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
      b: [{ x: 1 }],
    });
  });

  it('should create a function based on a formula', function () {
    const sheet = this.createFormulaSelector({
      a: {
        $params: ['x', 'y'],
        $value: {
          $add: ['$x', '$y'],
        },
      },
    });
    const result = sheet();
    result.a(1, 2).should.deep.equal(3);
    result.a(3, 4).should.deep.equal(7);
  });

  it('should create a function parametrized by input', function () {
    const sheet = this.createFormulaSelector({
      incValue: {
        $arg: [0, 'value'],
      },
      inc: {
        $params: ['x'],
        $value: {
          $add: ['$x', '$incValue'],
        },
      },
    });
    sheet({ value: 2 }).inc(1).should.equal(3);
  });

  it('should evaluate a predefined formula', function () {
    const sheet = this.createFormulaSelector({
      a: {
        $params: ['x', 'y'],
        $value: {
          $add: ['$x', '$y'],
        },
      },
      b: {
        $evaluate: ['$a', 2, 3],
      },
    });
    const result = sheet();
    result.b.should.deep.equal(5);
  });

  it('should evaluate comparision operator', function () {
    const sheet = this.createFormulaSelector({
      a: {
        $lt: [1, 2],
      },
      b: {
        $lt: [2, 1],
      },
    });
    sheet().should.deep.equal({
      a: true,
      b: false,
    });
  });

  it('should evaluate conditional formula', function () {
    const sheet = this.createFormulaSelector({
      min: {
        $params: ['x', 'y'],
        $value: {
          $if: [{ $lt: ['$x', '$y'] }, '$x', '$y'],
        },
      },
    });
    const result = sheet();
    result.min(1, 2).should.deep.equal(1);
    result.min(2, 1).should.deep.equal(1);
  });

  it('should evaluate a recursive function', function () {
    const sheet = this.createFormulaSelector({
      triangle: {
        $params: ['f', 'x'],
        $value: {
          $if: [
            { $lt: ['$x', 1] },
            0,
            { $add: ['$x', { $evaluate: ['$f', '$f', { $add: ['$x', -1] }] }] },
          ],
        },
      },
    });
    const result = sheet();
    result.triangle(result.triangle, 2).should.deep.equal(3);
  });

  it('should evaluate a complex functions composition', function () {
    const sheet = this.createFormulaSelector({
      subtract: {
        $params: ['x', 'y'],
        $value: { $sub: ['$x', '$y'] },
      },
      swap: {
        $params: ['f'],
        $value: {
          $params: ['a', 'b'],
          $value: {
            $evaluate: ['$f', '$b', '$a'],
          },
        },
      },
      value: {
        $evaluate: [
          { $evaluate: ['$swap', '$subtract'] },
          1,
          2,
        ],
      },
    });
    const result = sheet();
    result.value.should.equal(1);
    result.subtract(1, 2).should.equal(-1);
    // NOTE: I don't believe this one works :)
    result.swap((x, y) => x / y)(5, 10).should.equal(2);
  });
});

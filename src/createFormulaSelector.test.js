/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import createFormulaSelector from './createFormulaSelector';

chai.should();
chai.use(sinonChai);

const constant = x => () => x;

describe('Test createFormulaSelector', function () {
  it('should select an empty object', function () {
    const sheet = createFormulaSelector({});
    sheet().should.deep.equal({});
  });

  it('should select an explicit property', function () {
    const sheet = createFormulaSelector({
      a: 1,
    });
    sheet().should.deep.equal({
      a: 1,
    });
  });

  it('should select an indirect property', function () {
    const sheet = createFormulaSelector({
      a: constant(1),
    });
    sheet().should.deep.equal({
      a: 1,
    });
  });

  it('should select nested properties', function () {
    const sheet = createFormulaSelector({
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
    const sheet = createFormulaSelector({
      a: 1,
      b: '$a',
    });
    sheet().should.deep.equal({
      a: 1,
      b: 1,
    });
  });

  it('should resolve dependency with nested key', function () {
    const sheet = createFormulaSelector({
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
    const sheet = createFormulaSelector({
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
    const sheet = createFormulaSelector({
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
    const sheet = createFormulaSelector({
      a: { $field: 'x' },
    });
    sheet({ x: 1 }).should.deep.equal({
      a: 1,
    });
  });

  it('should extract second argument', function () {
    const sheet = createFormulaSelector({
      a: { $field: '', $index: 1 },
    });
    sheet(null, 1).should.deep.equal({
      a: 1,
    });
  });

  it('should filter contents of an array', function () {
    const sheet = createFormulaSelector({
      a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
      b: {
        $filter: '$a',
        $predicate: {
          x: 1,
        },
      },
    });
    sheet().should.deep.equal({
      a: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }],
      b: [{ x: 1 }],
    });
  });

  it('should create a function based on a formula', function () {
    const sheet = createFormulaSelector({
      a: {
        $variables: ['x', 'y'],
        $formula: {
          $add: ['$x', '$y'],
        },
      },
    });
    const result = sheet();
    result.a(1, 2).should.deep.equal(3);
    result.a(3, 4).should.deep.equal(7);
  });

  it('should create a function parametrized by input', function () {
    const sheet = createFormulaSelector({
      incValue: {
        $field: 'value',
      },
      inc: {
        $variables: ['x'],
        $formula: {
          $add: ['$x', '$incValue'],
        },
      },
    });
    sheet({ value: 2 }).inc(1).should.equal(3);
  });

  it('should evaluate a predefined formula', function () {
    const sheet = createFormulaSelector({
      a: {
        $variables: ['x', 'y'],
        $formula: {
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
    const sheet = createFormulaSelector({
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
    const sheet = createFormulaSelector({
      min: {
        $variables: ['x', 'y'],
        $formula: {
          $if: [{ $lt: ['$x', '$y'] }, '$x', '$y'],
        },
      },
    });
    const result = sheet();
    result.min(1, 2).should.deep.equal(1);
    result.min(2, 1).should.deep.equal(1);
  });

  it('should evaluate indirect reference', function () {
    const sheet = createFormulaSelector({
      name: 'a',
      a: 1,
      b: { $ref: '$name' },
    });
    sheet().should.deep.equal({
      name: 'a',
      a: 1,
      b: 1,
    });
  });

  it('should evaluate a recursive function', function () {
    const sheet = createFormulaSelector({
      triangle: {
        $variables: ['x'],
        $formula: {
          $if: [
            { $lt: ['$x', 1] },
            0,
            { $add: ['$x', { $evaluate: [{ $ref: 'triangle' }, { $add: ['$x', -1] }] }] },
          ],
        },
      },
    });
    const result = sheet();
    result.triangle(2).should.deep.equal(3);
  });

  it('should evaluate a complex functions composition', function () {
    const sheet = createFormulaSelector({
      subtract: {
        $variables: ['x', 'y'],
        $formula: { $sub: ['$x', '$y'] },
      },
      swap: {
        $variables: ['f'],
        $formula: {
          $variables: ['a', 'b'],
          $formula: {
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

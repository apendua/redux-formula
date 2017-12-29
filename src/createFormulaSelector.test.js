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
});

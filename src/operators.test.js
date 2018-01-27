/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import Compiler from './Compiler';

chai.should();
chai.use(sinonChai);

describe('Test Operators', function () {
  beforeEach(function () {
    this.compiler = new Compiler();
    this.createFormulaSelector = this.compiler.createFormulaSelector.bind(this.compiler);
  });

  it('should evaluate $sum', function () {
    const formula = this.createFormulaSelector({
      $sum: [1, 2, 3],
    });
    formula().should.deep.equal(6);
  });

  it('should evaluate $prod', function () {
    const formula = this.createFormulaSelector({
      $prod: [2, 2, 2],
    });
    formula().should.deep.equal(8);
  });

  it('should evaluate $add', function () {
    const formula = this.createFormulaSelector({
      $add: [1, 2],
    });
    formula().should.deep.equal(3);
  });

  it('should evaluate $sub', function () {
    const formula = this.createFormulaSelector({
      $sub: [1, 2],
    });
    formula().should.deep.equal(-1);
  });

  it('should evaluate $mul', function () {
    const formula = this.createFormulaSelector({
      $mul: [5, 2],
    });
    formula().should.deep.equal(10);
  });

  it('should evaluate $pow', function () {
    const formula = this.createFormulaSelector({
      $pow: [5, 2],
    });
    formula().should.deep.equal(25);
  });

  it('should evaluate $div', function () {
    const formula = this.createFormulaSelector({
      $div: [6, 2],
    });
    formula().should.deep.equal(3);
  });

  it('should evaluate $mod', function () {
    const formula = this.createFormulaSelector({
      $mod: [5, 2],
    });
    formula().should.deep.equal(1);
  });

  it('should evaluate $eq', function () {
    const formula = this.createFormulaSelector({
      $eq: [5, 2],
    });
    formula().should.deep.equal(false);
  });

  it('should evaluate $neq', function () {
    const formula = this.createFormulaSelector({
      $neq: [5, 2],
    });
    formula().should.deep.equal(true);
  });

  it('should evaluate $lt', function () {
    const formula = this.createFormulaSelector({
      $lt: [5, 2],
    });
    formula().should.deep.equal(false);
  });

  it('should evaluate $gt', function () {
    const formula = this.createFormulaSelector({
      $gt: [5, 2],
    });
    formula().should.deep.equal(true);
  });

  it('should evaluate $lte', function () {
    const formula = this.createFormulaSelector({
      $lte: [2, 2],
    });
    formula().should.deep.equal(true);
  });

  it('should evaluate $gte', function () {
    const formula = this.createFormulaSelector({
      $gte: [1, 2],
    });
    formula().should.deep.equal(false);
  });

  it('should evaluate $not', function () {
    const formula = this.createFormulaSelector({
      $not: [true],
    });
    formula().should.deep.equal(false);
  });

  it('should evaluate $xor (1)', function () {
    const formula = this.createFormulaSelector({
      $xor: [true, false],
    });
    formula().should.deep.equal(true);
  });

  it('should evaluate $xor (2)', function () {
    const formula = this.createFormulaSelector({
      $xor: [true, true],
    });
    formula().should.deep.equal(false);
  });

  it('should use short circuit for $and', function () {
    const formula = this.createFormulaSelector({
      $and: [false, {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    formula().should.deep.equal(false);
  });

  it('should use short circuit for $or', function () {
    const formula = this.createFormulaSelector({
      $or: [true, {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    formula().should.deep.equal(true);
  });
});

/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import Compiler from '../Compiler';

chai.should();
chai.use(sinonChai);

describe('Test Default Operators', function () {
  beforeEach(function () {
    this.compiler = new Compiler();
    this.createSelector = this.compiler.createSelector.bind(this.compiler);
  });

  it('should evaluate $sum', function () {
    const formula = this.createSelector({
      $sum: [1, 2, 3],
    });
    formula().should.equal(6);
  });

  it('should evaluate $prod', function () {
    const formula = this.createSelector({
      $prod: [2, 2, 2],
    });
    formula().should.equal(8);
  });

  it('should evaluate $add', function () {
    const formula = this.createSelector({
      $add: [1, 2],
    });
    formula().should.equal(3);
  });

  it('should evaluate $sub', function () {
    const formula = this.createSelector({
      $sub: [1, 2],
    });
    formula().should.equal(-1);
  });

  it('should evaluate $mul', function () {
    const formula = this.createSelector({
      $mul: [5, 2],
    });
    formula().should.equal(10);
  });

  it('should evaluate $pow', function () {
    const formula = this.createSelector({
      $pow: [5, 2],
    });
    formula().should.equal(25);
  });

  it('should evaluate $div', function () {
    const formula = this.createSelector({
      $div: [6, 2],
    });
    formula().should.equal(3);
  });

  it('should evaluate $mod', function () {
    const formula = this.createSelector({
      $mod: [5, 2],
    });
    formula().should.equal(1);
  });

  it('should evaluate $eq', function () {
    const formula = this.createSelector({
      $eq: ['$0', '$1'],
    });
    formula(1, 2).should.equal(false);
    formula(2, 2).should.equal(true);
  });

  it('should evaluate $neq', function () {
    const formula = this.createSelector({
      $neq: ['$0', '$1'],
    });
    formula(1, 2).should.equal(true);
    formula(2, 2).should.equal(false);
  });

  it('should evaluate $lt', function () {
    const formula = this.createSelector({
      $lt: ['$0', '$1'],
    });
    formula(1, 2).should.equal(true);
    formula(2, 2).should.equal(false);
    formula(3, 2).should.equal(false);
  });

  it('should evaluate $gt', function () {
    const formula = this.createSelector({
      $gt: ['$0', '$1'],
    });
    formula(1, 2).should.equal(false);
    formula(2, 2).should.equal(false);
    formula(3, 2).should.equal(true);
  });

  it('should evaluate $lte', function () {
    const formula = this.createSelector({
      $lte: ['$0', '$1'],
    });
    formula(1, 2).should.equal(true);
    formula(2, 2).should.equal(true);
    formula(3, 2).should.equal(false);
  });

  it('should evaluate $gte', function () {
    const formula = this.createSelector({
      $gte: ['$0', '$1'],
    });
    formula(1, 2).should.equal(false);
    formula(2, 2).should.equal(true);
    formula(3, 2).should.equal(true);
  });

  it('should evaluate $not', function () {
    const formula = this.createSelector({
      $not: ['$0'],
    });
    formula(true).should.equal(false);
    formula(false).should.equal(true);
  });

  it('should evaluate $xor', function () {
    const formula = this.createSelector({
      $xor: ['$0', '$1'],
    });
    formula(true, true).should.equal(false);
    formula(true, false).should.equal(true);
    formula(false, true).should.equal(true);
    formula(false, false).should.equal(false);
  });

  it('should use short circuit for $and', function () {
    const formula = this.createSelector({
      $and: ['$0', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    formula(false).should.equal(false);
    (() => {
      formula(true);
    }).should.throw(/Should not reach this line/);
  });

  it('should use short circuit for $or', function () {
    const formula = this.createSelector({
      $or: ['$0', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    formula(true).should.equal(true);
    (() => {
      formula(false);
    }).should.throw(/Should not reach this line/);
  });

  it('should evaluate $if', function () {
    const formula = this.createSelector({
      $if: ['$0', 1, 2],
    });
    formula(true).should.equal(1);
    formula(false).should.equal(2);
  });

  it('should evaluate $unless', function () {
    const formula = this.createSelector({
      $unless: ['$0', 1, 2],
    });
    formula(false).should.equal(1);
    formula(true).should.equal(2);
  });

  it('should use short circuit for $if', function () {
    const formula = this.createSelector({
      $if: ['$0', '$1', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    formula(true, 2).should.equal(2);
    (() => {
      formula(false);
    }).should.throw(/Should not reach this line/);
  });

  it('should use short circuit for $unless', function () {
    const formula = this.createSelector({
      $unless: ['$0', '$1', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    formula(false, 2).should.equal(2);
    (() => {
      formula(true);
    }).should.throw(/Should not reach this line/);
  });
});

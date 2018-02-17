/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */

import Scope from './Scope';

// const constant = x => () => x;
// const identity = x => x;

describe('Test Scope', () => {
  describe('Given a scope without unknowns', () => {
    beforeEach(function () {
      this.scope = new Scope();
    });
    it('should not have any own unknowns', function () {
      this.scope.hasOwnUnknowns().should.be.false;
    });
  });

  describe('Given a scope with unknowns', () => {
    beforeEach(function () {
      this.scope = new Scope(null, ['x', 'y']);
    });
    it('should have own unknowns', function () {
      this.scope.hasOwnUnknowns().should.be.true;
    });
  });
});

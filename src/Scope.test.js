/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import Scope from './Scope';

const should = chai.should();
chai.use(sinonChai);

const constant = x => () => x;

describe('Test Scope', function () {
  describe('Given basic scope', function () {
    beforeEach(function () {
      this.scope = new Scope();
    });

    it('should define a simple variable', function () {
      this.scope.define('a', [], constant(1));
      this.scope.getValue('a').should.equal(1);
    });

    it('should throw if variable is unknown', function () {
      (() => {
        this.scope.getValue('a');
      }).should.throw('Unknown');
    });

    it('should define an unknown', function () {
      this.scope.define('a');
      should.not.exist(this.scope.getValue('a'));
      this.scope.isUnknown('a').should.be.true;
    });

    it('should throw if circular dependency is detected', function () {
      (() => {
        this.scope.define('a', ['b'], constant('a'));
        this.scope.define('b', ['a'], constant('b'));
        this.scope.getValue('a');
      }).should.throw('a -> b -> a');
    });
  });

  describe('Given hierarchical scope', function () {
    beforeEach(function () {
      this.scope1 = new Scope();
      this.scope2 = new Scope(this.scope1);
    });

    it('should resolve value from parent scope', function () {
      this.scope1.define('a', [], constant(1));
      this.scope2.getValue('a').should.equal(1);
    });

    it('should not include parent scope values', function () {
      this.scope1.define('a', [], constant(1));
      this.scope2.define('b', ['a'], constant(2));
      this.scope2.getAllValues().should.deep.equal({
        b: 2,
      });
    });
  });
});

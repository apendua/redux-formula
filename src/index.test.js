/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import formulaSelector, {
  Compiler,
  presetDefault,
  formulaSelectorFactory,
} from './index';

chai.should();
chai.use(sinonChai);

describe('Test Public Api', function () {
  describe('Basic formulas', function () {
    it('should select an empty object', function () {
      const selector = formulaSelector({});
      selector().should.deep.equal({});
    });

    it('should select a plain literal', function () {
      const selector = formulaSelector({
        '!': 1,
      });
      selector().should.deep.equal(1);
    });
  });

  describe('Selector factory', function () {
    it('should select an empty object', function () {
      const factory = formulaSelectorFactory({});
      factory()().should.deep.equal({});
    });

    it('should select a plain literal', function () {
      const factory = formulaSelectorFactory({
        '!': 1,
      });
      factory()().should.deep.equal(1);
    });
  });

  describe('Plugins', function () {
    beforeEach(function () {
      this.compiler = new Compiler({
        plugins: presetDefault,
      });
    });

    it('should dynamically add a new plugin', function () {
      this.compiler.addPlugin({
        createOperators: () => ({
          $value: scope => () => selectX => scope.relative(selectX),
        }),
      });
      const selector = this.compiler.createSelector({
        $value: 1,
      });
      selector().should.deep.equal(1);
    });
  });
});

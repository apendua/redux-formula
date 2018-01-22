/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import formula from './index';

chai.should();
chai.use(sinonChai);

describe('Test Public Api', function () {
  describe('Basic formulas', function () {
    it('should select an empty object', function () {
      const selector = formula({});
      selector().should.deep.equal({});
    });

    it('should select a plain literal', function () {
      const selector = formula({
        '!': 1,
      });
      selector().should.deep.equal(1);
    });
  });
});

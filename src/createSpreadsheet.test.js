/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import sinonChai from 'sinon-chai';
import createSpreadsheet from './createSpreadsheet';

chai.should();
chai.use(sinonChai);

describe('Test createSpreadsheet', function () {
  beforeEach(function () {
    this.sheet = createSpreadsheet({

    });
  });

  it('should select an empty object', function () {
    this.sheet().should.deep.equal({});
  });
});

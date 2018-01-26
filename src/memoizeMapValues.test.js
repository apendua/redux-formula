/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */

import memoizeMapValues from './memoizeMapValues';

const constant = x => () => x;
const identity = x => x;

describe('Test utility - memoizeMapValues', () => {
  beforeEach(function () {
    this.object = {};
    this.identity = memoizeMapValues(identity);
    this.constant = memoizeMapValues(constant(this.object));
  });

  describe('Given an empty object', () => {
    it('should not be changed by identity mapping', function () {
      const x = {};
      const y = this.identity(x);
      this.identity(x).should.equal(y);
    });

    it('should not be changed by constant mapping', function () {
      const x = {};
      const y = this.constant(x);
      this.constant(x).should.equal(y);
    });

    it('should return the same result when called with similar argument', function () {
      const x = {};
      const y = {};
      this.constant(x).should.equal(this.constant(y));
    });
  });

  describe('Given a non-empty object', () => {
    it('should not be changed by identity mapping', function () {
      const x = {
        a: {},
        b: {},
      };
      this.identity(x).should.equal(x);
    });
    it('should be changed by constant mapping', function () {
      const x = {
        a: {},
        b: {},
      };
      this.constant(x).should.not.equal(x);
    });
    it('should return the same result when called with similar argument', function () {
      const x = {
        a: {},
        b: {},
      };
      const y = {
        ...x,
      };
      this.constant(x).should.equal(this.constant(y));
    });
  });
});

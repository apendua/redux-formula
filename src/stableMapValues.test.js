/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
import stableMapValues from './stableMapValues';

// TODO: Implement more tests.
describe('Test utility - stableMapValues', () => {
  it('should remove keys and map object at the same time', () => {
    stableMapValues({
      1: 1,
      2: 2,
      3: 3,
      4: 4,
    }, (value, key, remove) => {
      if (value % 2 === 0) {
        return remove;
      }
      return value + 1;
    }).should.deep.equal({
      1: 2,
      3: 4,
    });
  });

  it('should remove elements and map array at the same time', () => {
    stableMapValues([
      1,
      2,
      3,
      4,
    ], (value, key, remove) => {
      if (value % 2 === 0) {
        return remove;
      }
      return value + 1;
    }).should.deep.equal([2, 4]);
  });
});

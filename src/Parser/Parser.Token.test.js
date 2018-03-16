/* eslint-env jest */

import Token from './Parser.Token';

describe('Test Token; ', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(() => {
    testContext.s1 = new Token();
    testContext.s1.ifUsedAsPrefix(i => (i === 1 ? 'prefix_1' : null));
    testContext.s1.ifUsedAsPrefix(i => (i === 2 ? 'prefix_2' : null));
    testContext.s1.ifUsedAsInfix(i => (i === 1 ? 'infix_1' : null));
    testContext.s1.ifUsedAsInfix(i => (i === 2 ? 'infix_2' : null));

    testContext.s2 = new Token();
  });

  test('should know if it can be used as prefix', () => {
    expect(testContext.s1.canBeUsedAsPrefix()).toBe(true);
  });

  test('should know if it can be used as infix', () => {
    expect(testContext.s1.canBeUsedAsInfix()).toBe(true);
  });

  test('should know if it cannot be used as prefix', () => {
    expect(testContext.s2.canBeUsedAsPrefix()).toBe(false);
  });

  test('should know if it cannot be used as infix', () => {
    expect(testContext.s2.canBeUsedAsInfix()).toBe(false);
  });

  test('should resolve at prefix postion', () => {
    expect(testContext.s1.resolve('prefix', 1)).toBe('prefix_1');
  });

  test('should resolve at infix postion', () => {
    expect(testContext.s1.resolve('infix', 1)).toBe('infix_1');
  });

  test('should find alternative path at prefix postion', () => {
    expect(testContext.s1.resolve('prefix', 2)).toBe('prefix_2');
  });

  test('should find alternative path infix postion', () => {
    expect(testContext.s1.resolve('infix', 2)).toBe('infix_2');
  });

  test('should throw if resolved in unknown context', () => {
    expect(() => {
      testContext.s1.resolve('unknown');
    }).toThrowError(/Unexpected/);
  });

  test('should throw if no resulution path is find', () => {
    expect(() => {
      testContext.s1.resolve('infix', 3);
    }).toThrowError(/Unexpected/);
  });
});

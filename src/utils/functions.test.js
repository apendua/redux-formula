/* eslint-env jest */

import {
  lift,
  createConstantFunctor,
} from './functions';

describe('Test function utilities', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('Given constant functor', () => {
    beforeEach(() => {
      testContext.obj = {};
    });
    test('should create constant of order 0', () => {
      expect(createConstantFunctor(0)(testContext.obj)).toBe(testContext.obj);
    });
    test('should create constant of order 1', () => {
      expect(createConstantFunctor(1)(testContext.obj)()).toBe(testContext.obj);
    });
    test('should create constant of order 2', () => {
      expect(createConstantFunctor(2)(testContext.obj)()()).toBe(testContext.obj);
    });
    test('should create constant of order 2', () => {
      expect(createConstantFunctor(3)(testContext.obj)()()()).toBe(testContext.obj);
    });
  });

  describe('Given lift functor', () => {
    beforeEach(() => {
      testContext.obj = {};
      testContext.s1 = x => x;
      testContext.s2 = x => y => x + y;
      testContext.s3 = x => y => z => x + y + z;
    });
    test('should create lift of order 0, 0', () => {
      expect(lift(0, 0)(testContext.s1)(1)).toBe(1);
    });
    test('should create lift of order 0, 1', () => {
      expect(lift(0, 1)(testContext.s1)()(1)).toBe(1);
    });
    test('should create lift of order 0, 2', () => {
      expect(lift(0, 2)(testContext.s1)()()(1)).toBe(1);
    });
    test('should create lift of order 1, 0', () => {
      expect(lift(1, 0)(testContext.s2)(1)(2)).toBe(3);
    });
    test('should create lift of order 1, 1', () => {
      expect(lift(1, 1)(testContext.s2)(1)()(2)).toBe(3);
    });
    test('should create lift of order 1, 2', () => {
      expect(lift(1, 2)(testContext.s2)(1)()()(2)).toBe(3);
    });
    test('should create lift of order 2, 0', () => {
      expect(lift(2, 0)(testContext.s2)(1)(2)).toBe(3);
    });
    test('should create lift of order 2, 1', () => {
      expect(lift(2, 1)(testContext.s2)(1)(2)()).toBe(3);
    });
    test('should create lift of order 2, 2', () => {
      expect(lift(2, 2)(testContext.s2)(1)(2)()()).toBe(3);
    });
  });
});

/* eslint-env jest */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */
/* eslint prefer-arrow-callback: "off" */

import Compiler from '../Compiler';
import presetDefault from '../presets/default';

describe('Test Default Operators', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(() => {
    testContext.compiler = new Compiler({
      plugins: presetDefault,
    });
    testContext.createSelector = testContext.compiler.createSelector.bind(testContext.compiler);
  });

  test('should evaluate $dot', () => {
    const formula = testContext.createSelector({
      a: 'x',
      $dot: ['$0', '$a'],
    });
    expect(formula({ x: 1 })).toBe(1);
  });

  test('should evaluate $sum', () => {
    const formula = testContext.createSelector({
      $sum: [1, 2, 3],
    });
    expect(formula()).toBe(6);
  });

  test('should evaluate $prod', () => {
    const formula = testContext.createSelector({
      $prod: [2, 2, 2],
    });
    expect(formula()).toBe(8);
  });

  test('should evaluate $neg', () => {
    const formula = testContext.createSelector({
      $neg: 1,
    });
    expect(formula()).toBe(-1);
  });

  test('should evaluate $add', () => {
    const formula = testContext.createSelector({
      $add: [1, 2],
    });
    expect(formula()).toBe(3);
  });

  test('should evaluate $sub', () => {
    const formula = testContext.createSelector({
      $sub: [1, 2],
    });
    expect(formula()).toBe(-1);
  });

  test('should evaluate $mul', () => {
    const formula = testContext.createSelector({
      $mul: [5, 2],
    });
    expect(formula()).toBe(10);
  });

  test('should evaluate $pow', () => {
    const formula = testContext.createSelector({
      $pow: [5, 2],
    });
    expect(formula()).toBe(25);
  });

  test('should evaluate $div', () => {
    const formula = testContext.createSelector({
      $div: [6, 2],
    });
    expect(formula()).toBe(3);
  });

  test('should evaluate $mod', () => {
    const formula = testContext.createSelector({
      $mod: [5, 2],
    });
    expect(formula()).toBe(1);
  });

  test('should evaluate $eq', () => {
    const formula = testContext.createSelector({
      $eq: ['$0', '$1'],
    });
    expect(formula(1, 2)).toBe(false);
    expect(formula(2, 2)).toBe(true);
  });

  test('should evaluate $neq', () => {
    const formula = testContext.createSelector({
      $neq: ['$0', '$1'],
    });
    expect(formula(1, 2)).toBe(true);
    expect(formula(2, 2)).toBe(false);
  });

  test('should evaluate $lt', () => {
    const formula = testContext.createSelector({
      $lt: ['$0', '$1'],
    });
    expect(formula(1, 2)).toBe(true);
    expect(formula(2, 2)).toBe(false);
    expect(formula(3, 2)).toBe(false);
  });

  test('should evaluate $gt', () => {
    const formula = testContext.createSelector({
      $gt: ['$0', '$1'],
    });
    expect(formula(1, 2)).toBe(false);
    expect(formula(2, 2)).toBe(false);
    expect(formula(3, 2)).toBe(true);
  });

  test('should evaluate $lte', () => {
    const formula = testContext.createSelector({
      $lte: ['$0', '$1'],
    });
    expect(formula(1, 2)).toBe(true);
    expect(formula(2, 2)).toBe(true);
    expect(formula(3, 2)).toBe(false);
  });

  test('should evaluate $gte', () => {
    const formula = testContext.createSelector({
      $gte: ['$0', '$1'],
    });
    expect(formula(1, 2)).toBe(false);
    expect(formula(2, 2)).toBe(true);
    expect(formula(3, 2)).toBe(true);
  });

  test('should evaluate $not', () => {
    const formula = testContext.createSelector({
      $not: ['$0'],
    });
    expect(formula(true)).toBe(false);
    expect(formula(false)).toBe(true);
  });

  test('should evaluate $xor', () => {
    const formula = testContext.createSelector({
      $xor: ['$0', '$1'],
    });
    expect(formula(true, true)).toBe(false);
    expect(formula(true, false)).toBe(true);
    expect(formula(false, true)).toBe(true);
    expect(formula(false, false)).toBe(false);
  });

  test('should use short circuit for $and', () => {
    const formula = testContext.createSelector({
      $and: ['$0', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    expect(formula(false)).toBe(false);
    expect(() => {
      formula(true);
    }).toThrowError(/Should not reach this line/);
  });

  test('should use short circuit for $or', () => {
    const formula = testContext.createSelector({
      $or: ['$0', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    expect(formula(true)).toBe(true);
    expect(() => {
      formula(false);
    }).toThrowError(/Should not reach this line/);
  });

  test('should evaluate $if', () => {
    const formula = testContext.createSelector({
      $if: ['$0', 1, 2],
    });
    expect(formula(true)).toBe(1);
    expect(formula(false)).toBe(2);
  });

  test('should evaluate $unless', () => {
    const formula = testContext.createSelector({
      $unless: ['$0', 1, 2],
    });
    expect(formula(false)).toBe(1);
    expect(formula(true)).toBe(2);
  });

  test('should use short circuit for $if', () => {
    const formula = testContext.createSelector({
      $if: ['$0', '$1', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    expect(formula(true, 2)).toBe(2);
    expect(() => {
      formula(false);
    }).toThrowError(/Should not reach this line/);
  });

  test('should use short circuit for $unless', () => {
    const formula = testContext.createSelector({
      $unless: ['$0', '$1', {
        '>!': function () {
          throw new Error('Should not reach this line.');
        },
        '?:': [],
      }],
    });
    expect(formula(false, 2)).toBe(2);
    expect(() => {
      formula(true);
    }).toThrowError(/Should not reach this line/);
  });
});

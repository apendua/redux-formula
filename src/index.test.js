/* eslint-env jest */

import {
  Compiler,
  formulaSelector,
  formulaSelectorFactory,
} from './index';
import presetDefault from './Compiler/presets/default';

describe('Test Public Api', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('Basic formulas', () => {
    test('should select an empty object', () => {
      const selector = formulaSelector({});
      expect(selector()).toEqual({});
    });

    test('should select a plain literal', () => {
      const selector = formulaSelector({
        '!': 1,
      });
      expect(selector()).toEqual(1);
    });
  });

  describe('Selector factory', () => {
    test('should select an empty object', () => {
      const factory = formulaSelectorFactory({});
      expect(factory()()).toEqual({});
    });

    test('should select a plain literal', () => {
      const factory = formulaSelectorFactory({
        '!': 1,
      });
      expect(factory()()).toEqual(1);
    });
  });

  describe('Plugins', () => {
    beforeEach(() => {
      testContext.compiler = new Compiler({
        plugins: presetDefault,
      });
    });

    test('should dynamically add a new plugin', () => {
      testContext.compiler.addPlugin({
        createOperators: () => ({
          $value: scope => () => selectX => scope.relative(selectX),
        }),
      });
      const selector = testContext.compiler.createSelector({
        $value: 1,
      });
      expect(selector()).toEqual(1);
    });
  });
});

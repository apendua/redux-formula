/* eslint-env jest */

import string from './string';
import {
  TOKEN_TYPE_LITERAL,
  VALUE_TYPE_STRING,
} from '../../core/constants';

describe('Test String parser', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(() => {
    testContext.parser = string();
  });

  test('should accept starting quotes', () => {
    const state = {};
    expect(testContext.parser.accept({
      state,
      index: 0,
      value: '',
      ahead: 'a',
    }, '"')).toBe(true);
  });

  test('should not accept other characters at the beginning', () => {
    const state = {};
    expect(testContext.parser.accept({
      state,
      index: 0,
      value: '',
      ahead: '',
    }, 'a')).toBe(false);
  });

  test('should accept escaping slash', () => {
    const state = {};
    expect(testContext.parser.accept({
      state,
      index: 1,
      value: '"',
      ahead: '"',
    }, '\\')).toBe(true);
    expect(state.escape).toEqual(1);
  });

  test('should accept escaped quotes', () => {
    const state = { escape: true };
    expect(testContext.parser.accept({
      state,
      index: 1,
      value: '"\\',
      ahead: '"',
    }, '"')).toBe(true);
    expect(state.escape).toEqual(0);
    expect(state.done).not.toBe(true);
  });

  test('should finish if at ending quotes', () => {
    const state = {};
    expect(testContext.parser.accept({
      state,
      index: 1,
      value: '"',
      ahead: '',
    }, '"')).toBe(true);
    expect(state.done).toBe(true);
  });

  test('should not accept anything agter it is done', () => {
    const state = { done: true };
    expect(testContext.parser.accept({
      state,
      index: 2,
      value: '""',
      ahead: '',
    }, 'x')).toBe(false);
  });

  test('should parse the resulting string', () => {
    const text = 'This is a text\n "containing" escaped characters';
    expect(testContext.parser.create({
      value: JSON.stringify(text),
      ahead: '',
    })).toEqual({
      type: TOKEN_TYPE_LITERAL,
      value: text,
      valueType: VALUE_TYPE_STRING,
    });
  });
});

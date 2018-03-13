/* eslint-env jest */

import Context from './Tokenizer.Context';

describe('Test Tokenizer.Context', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('Given "abc" string', () => {
    beforeEach(() => {
      testContext.context = new Context('abc', 0, { lineNo: 1 });
    });

    describe('after first advance()', () => {
      beforeEach(() => {
        testContext.character = testContext.context.advance();
      });

      test('the returned value should be "a"', () => {
        expect(testContext.character).toBe('a');
      });

      test('get() should return current state', () => {
        expect(testContext.context.get()).toEqual({
          index: 0,
          value: '',
          ahead: 'b',
          state: {},
        });
      });

      test('wrap() should return current position', () => {
        expect(testContext.context.wrap({})).toEqual({
          from: 0,
          to: -1,
          line: 1,
        });
      });
    });

    describe('after second advance()', () => {
      beforeEach(() => {
        testContext.context.advance();
        testContext.character = testContext.context.advance();
      });

      test('the returned value should be "b"', () => {
        expect(testContext.character).toBe('b');
      });

      test('get() should return current state', () => {
        expect(testContext.context.get()).toEqual({
          index: 1,
          value: 'a',
          ahead: 'c',
          state: {},
        });
      });

      test('wrap() should return current position', () => {
        expect(testContext.context.wrap({})).toEqual({
          from: 0,
          to: 0,
          line: 1,
        });
      });
    });

    describe('after third advance()', () => {
      beforeEach(() => {
        testContext.context.advance();
        testContext.context.advance();
        testContext.character = testContext.context.advance();
      });

      test('the returned value should be "c"', () => {
        expect(testContext.character).toBe('c');
      });

      test('get() should return current state', () => {
        expect(testContext.context.get()).toEqual({
          index: 2,
          value: 'ab',
          ahead: '',
          state: {},
        });
      });

      test('wrap() should return current position', () => {
        expect(testContext.context.wrap({})).toEqual({
          from: 0,
          to: 1,
          line: 1,
        });
      });
    });
  });
});

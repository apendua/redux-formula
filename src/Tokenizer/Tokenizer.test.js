/* eslint-env jest */

import Tokenizer from './Tokenizer';
import {
  identifier,
  number,
  operator,
  string,
  whitespace,
  lineComment,
} from './tokens';
import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_KEYWORD,
  TOKEN_TYPE_WHITESPACE,
  TOKEN_TYPE_LINE_COMMENT,

  VALUE_TYPE_INTEGER,
  VALUE_TYPE_DECIMAL,
  VALUE_TYPE_STRING,
} from './../constants';

const createTokenizer = () => {
  const tokenizer = new Tokenizer({
    options: {
      keywords: ['AND', 'OR', 'NOT'],
    },
  });
  [
    identifier,
    number,
    operator,
    string,
    whitespace,
    lineComment,
  ].forEach(plugin => tokenizer.addPlugin(plugin));
  return tokenizer;
};

export default createTokenizer;

describe('Test Tokenizer', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(() => {
    testContext.tokenizer = createTokenizer();
  });

  test('should reckognize an identifier', () => {
    expect(testContext.tokenizer.readToken('any', 0)).toEqual({
      type: TOKEN_TYPE_IDENTIFIER,
      value: 'any',
      from: 0,
      to: 2,
      line: 0,
    });
  });

  test('should reckognize an identifier prefixed with lodash', () => {
    expect(testContext.tokenizer.readToken('_any', 0)).toEqual({
      type: TOKEN_TYPE_IDENTIFIER,
      value: '_any',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  test('should reckognize an identifier containing digits', () => {
    expect(testContext.tokenizer.readToken('x12', 0)).toEqual({
      type: TOKEN_TYPE_IDENTIFIER,
      value: 'x12',
      from: 0,
      to: 2,
      line: 0,
    });
  });

  test('should not reckognize an identifier started with a digit', () => {
    expect(testContext.tokenizer.readToken('1x', 0)).toEqual({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_INTEGER,
      value: 1,
      from: 0,
      to: 0,
      line: 0,
    });
  });

  test('should reckognize an integer number', () => {
    expect(testContext.tokenizer.readToken('123', 0)).toEqual({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_INTEGER,
      value: 123,
      from: 0,
      to: 2,
      line: 0,
    });
  });

  test('should reckognize a decimal number', () => {
    expect(testContext.tokenizer.readToken('1234.5', 0)).toEqual({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_DECIMAL,
      value: 1234.5,
      from: 0,
      to: 5,
      line: 0,
    });
  });

  test('should reckognize a basic operator', () => {
    expect(testContext.tokenizer.readToken('+', 0)).toEqual({
      type: TOKEN_TYPE_OPERATOR,
      value: '+',
      from: 0,
      to: 0,
      line: 0,
    });
  });

  test('should reckognize a compound operator', () => {
    expect(testContext.tokenizer.readToken('==', 0)).toEqual({
      type: TOKEN_TYPE_OPERATOR,
      value: '==',
      from: 0,
      to: 1,
      line: 0,
    });
  });

  test('should reckognize a string literal', () => {
    expect(testContext.tokenizer.readToken('"abc"', 0)).toEqual({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_STRING,
      value: 'abc',
      from: 0,
      to: 4,
      line: 0,
    });
  });

  test('should reckognize a string literal with escaped "', () => {
    expect(testContext.tokenizer.readToken('"\\""', 0)).toEqual({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_STRING,
      value: '"',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  test('should reckognize a string literal with escaped \\', () => {
    expect(testContext.tokenizer.readToken('"\\\\"', 0)).toEqual({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_STRING,
      value: '\\',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  test('should reckognize a whitespace token', () => {
    expect(testContext.tokenizer.readToken(' \t\t ', 0)).toEqual({
      type: TOKEN_TYPE_WHITESPACE,
      value: ' \t\t ',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  test('should reckognize a line comment', () => {
    expect(testContext.tokenizer.readToken('# abc\n1', 0)).toEqual({
      type: TOKEN_TYPE_LINE_COMMENT,
      value: '# abc',
      from: 0,
      to: 4,
      line: 0,
    });
  });

  test('should reckognize a keyword', () => {
    expect(testContext.tokenizer.readToken('AND', 0)).toEqual({
      type: TOKEN_TYPE_KEYWORD,
      value: 'AND',
      from: 0,
      to: 2,
      line: 0,
    });
  });

  test('should throw error on unexpected character', () => {
    expect(() => {
      testContext.tokenizer.tokenize('`');
    }).toThrowError(/character/);
  });
});

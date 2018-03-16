/* eslint-env jest */

import jsc from 'jsverify';
import sample from 'lodash/sample';
import shortid from 'shortid';
import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_WHITESPACE,
  VALUE_TYPE_INTEGER,
  VALUE_TYPE_STRING,
  DEFAULT_OPERATORS,
} from './../constants';
import createTokenizer from './Tokenizer.test';

const arbitrary = {};

arbitrary.name = jsc.bless({
  generator() {
    const name = shortid.generate();
    const ch = name.charAt(0);
    if (ch >= '0' && ch <= '9') {
      return `_${ch}`;
    }
    return ch;
  },
});

arbitrary.operator = jsc.bless({
  generator() {
    return sample(DEFAULT_OPERATORS);
  },
});

arbitrary.token = jsc.oneof([
  jsc.record({
    type: jsc.constant(TOKEN_TYPE_IDENTIFIER),
    value: arbitrary.name,
  }),

  jsc.record({
    type: jsc.constant(TOKEN_TYPE_LITERAL),
    value: jsc.asciinestring,
    valueType: jsc.constant(VALUE_TYPE_STRING),
  }),

  jsc.record({
    type: jsc.constant(TOKEN_TYPE_LITERAL),
    value: jsc.nat,
    valueType: jsc.constant(VALUE_TYPE_INTEGER),
  }),

  jsc.record({
    type: jsc.constant(TOKEN_TYPE_OPERATOR),
    value: arbitrary.operator,
  }),
]);


function property(arb, verify) {
  let error = null;
  const test = jsc.forall(arb, (...args) => {
    try {
      return verify(...args);
    } catch (err) {
      error = err;
    }
    return false;
  });
  return () => {
    try {
      jsc.assert(test);
    } catch (err) {
      if (error) {
        error.message = `${err.message}; Original message: ${error.message}`;
        throw error;
      }
      throw err;
    }
  };
}

function compile(rawTokens) {
  const tokens = [];
  let prev = TOKEN_TYPE_WHITESPACE;
  let prevValueType;
  let code = '';
  rawTokens.forEach(({ value, valueType, type }) => {
    let str = '';
    let sep = '';
    switch (type) {
      case TOKEN_TYPE_IDENTIFIER:
        str = value;
        if (prev !== TOKEN_TYPE_OPERATOR &&
            prev !== TOKEN_TYPE_WHITESPACE) {
          sep = ' ';
        }
        break;

      case TOKEN_TYPE_LITERAL: {
        if (valueType === VALUE_TYPE_INTEGER) {
          str = value.toString();
          if (prev !== TOKEN_TYPE_OPERATOR &&
              prev !== TOKEN_TYPE_WHITESPACE) {
            sep = ' ';
          }
        } else if (valueType === VALUE_TYPE_STRING) {
          str = JSON.stringify(value);
        }
        break;
      }

      case TOKEN_TYPE_OPERATOR:
        str = value;
        if (
          prev === TOKEN_TYPE_OPERATOR || (
            value === '.' &&
            prev === TOKEN_TYPE_LITERAL &&
            prevValueType === VALUE_TYPE_INTEGER
          )
        ) {
          sep = ' ';
        }
        break;

      default:
        // do nothing
    }
    if (sep) {
      tokens.push({
        type: TOKEN_TYPE_WHITESPACE,
        value: sep,
        line: 0,
        from: code.length,
        to: (code.length + sep.length) - 1,
      });
    }
    tokens.push({
      value,
      ...(valueType && { valueType }),
      type,
      line: 0,
      from: code.length + sep.length,
      to: (code.length + sep.length + str.length) - 1,
    });
    code += sep + str;
    prev = type;
    prevValueType = valueType;
  });
  return { code, tokens };
}

describe('Test Tokenizer', () => {
  const tokenizer = createTokenizer();

  test('should properly tokenize random chains of tokens', property(
    jsc.array(arbitrary.token),
    (tokens) => {
      const compiled = compile(tokens);
      const parsedTokens = tokenizer.tokenize(compiled.code).tokens;
      expect(parsedTokens).toEqual(compiled.tokens);
      return true;
    }));
});

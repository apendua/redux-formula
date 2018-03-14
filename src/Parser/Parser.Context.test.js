/* eslint-env jest */

import Scope from './Parser.Scope';
import Context from './Parser.Context';
import Token from './Parser.Token';
import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_LINE_COMMENT,
  TOKEN_TYPE_WHITESPACE,
  TOKEN_TYPE_END,
} from '../core/constants';

function binary(parse, { value }, left) {
  return {
    value,
    left,
    right: parse.expression(1),
  };
}

function createGrammar(constants) {
  const literal = new Token(TOKEN_TYPE_LITERAL)
    .ifUsedAsPrefix((parse, token) => ({ value: token.value }));

  const variable = new Token(TOKEN_TYPE_IDENTIFIER)
    .ifUsedAsPrefix((parse, token) => {
      if (constants[token.value] === undefined) {
        return { name: token.value };
      }
      return { value: constants[token.value] };
    });

  const add = new Token('+')
    .setBindingPower(1)
    .ifUsedAsInfix(binary);

  const mul = new Token('*')
    .setBindingPower(2)
    .ifUsedAsInfix(binary);

  const definition = new Token('let').ifUsedAsStatement((parse) => {
    const left =
      parse.advance(TOKEN_TYPE_IDENTIFIER).value;
    parse.advance('=');
    const right =
      parse.expression(0);
    parse.advance(';');
    return { value: 'let', left, right };
  });

  return {
    [TOKEN_TYPE_LITERAL]: literal,
    [TOKEN_TYPE_WHITESPACE]: new Token(TOKEN_TYPE_WHITESPACE, { ignored: true }),
    [TOKEN_TYPE_LINE_COMMENT]: new Token(TOKEN_TYPE_LINE_COMMENT, { ignored: true }),
    [TOKEN_TYPE_IDENTIFIER]: variable,
    [TOKEN_TYPE_END]: new Token(TOKEN_TYPE_END),
    '=': new Token('='),
    ';': new Token(';'),
    ',': new Token(','),
    '{': new Token('{'),
    '}': new Token('}'),
    let: definition,
    and: new Token('and'),
    '+': add,
    '*': mul,
  };
}

describe('Test Parser.Context;', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  describe('given a dummy context object', () => {
    beforeEach(() => {
      testContext.context = new Context();
    });
    test('should return "end" after the first advance', () => {
      expect(testContext.context.advance().id).toBe(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a IDENTIFIER', () => {
    beforeEach(() => {
      testContext.tokens = [{ type: TOKEN_TYPE_IDENTIFIER, value: 'name' }];
      testContext.context = new Context({
        tokens: testContext.tokens,
      });
    });
    test('should return "identifier" after the first advance', () => {
      expect(testContext.context.advance().id).toBe(TOKEN_TYPE_IDENTIFIER);
    });
    test('should throw if we are expecting another token', () => {
      expect(() => {
        testContext.context.advance(TOKEN_TYPE_END);
      }).toThrowError(/Expected/);
    });
    test('should return "end" after the second advance', () => {
      testContext.context.advance();
      expect(testContext.context.advance().id).toBe(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a LITERAL', () => {
    beforeEach(() => {
      testContext.tokens = [{ type: TOKEN_TYPE_LITERAL }];
      testContext.context = new Context({
        tokens: testContext.tokens,
      });
    });
    test('should return "literal" after the first advance', () => {
      expect(testContext.context.advance().id).toBe(TOKEN_TYPE_LITERAL);
    });
    test('should throw if we are expecting another token', () => {
      expect(() => {
        testContext.context.advance(TOKEN_TYPE_END);
      }).toThrowError(/Expected/);
    });
    test('should return "end" after the second advance', () => {
      testContext.context.advance();
      expect(testContext.context.advance().id).toBe(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and an unknown OPERATOR', () => {
    beforeEach(() => {
      testContext.tokens = [{ type: TOKEN_TYPE_OPERATOR, value: '+' }];
      testContext.context = new Context({
        tokens: testContext.tokens,
      });
    });
    test('should throw if we are expecting another token', () => {
      expect(() => {
        testContext.context.advance(TOKEN_TYPE_END);
      }).toThrowError(/Expected/);
    });
    test('should throw after the first advance', () => {
      expect(() => {
        testContext.context.advance();
      }).toThrowError(/Unknown symbol/);
    });
  });

  describe('given a dymmy context and a WHITESPACE', () => {
    beforeEach(() => {
      testContext.tokens = [{ type: TOKEN_TYPE_WHITESPACE }];
      testContext.context = new Context({
        tokens: testContext.tokens,
      });
    });
    test('should return "end" after the first advance', () => {
      expect(testContext.context.advance().id).toBe(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a COMMENT', () => {
    beforeEach(() => {
      testContext.tokens = [{ type: TOKEN_TYPE_LINE_COMMENT }];
      testContext.context = new Context({
        tokens: testContext.tokens,
      });
    });
    test('should return "end" after the first advance', () => {
      expect(testContext.context.advance().id).toBe(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a bunch of tokens', () => {
    beforeEach(() => {
      testContext.tokens = [
        { type: TOKEN_TYPE_WHITESPACE },
        { type: TOKEN_TYPE_OPERATOR, value: '(' },
        { type: TOKEN_TYPE_IDENTIFIER },
        { type: TOKEN_TYPE_WHITESPACE },
        { type: TOKEN_TYPE_OPERATOR, value: ',' },
      ];
      testContext.context = new Context({
        order: 3,
        tokens: testContext.tokens,
      });
    });
    test('should properly match the upcoming tokens', () => {
      expect(testContext.context.match('(', TOKEN_TYPE_IDENTIFIER, ',')).toBe(true);
    });
    test('should recognize that tokens do not match', () => {
      expect(testContext.context.match('(', TOKEN_TYPE_LITERAL, ',')).toBe(false);
    });
    test('should match if nothing is expected', () => {
      expect(testContext.context.match()).toBe(true);
    });
    test('should throw if match list is too long', () => {
      expect(() => {
        testContext.context.match('(', TOKEN_TYPE_LITERAL, ',', TOKEN_TYPE_LITERAL);
      }).toThrowError(/of order/);
    });
  });

  describe('given different types of tokens', () => {
    beforeEach(() => {
      testContext.grammar = createGrammar();
      testContext.context = new Context({
        tokens: [],
        symbols: new Scope(null, testContext.grammar),
      });
    });

    test('should recognize a number LITERAL', () => {
      expect(testContext.context.token({ type: TOKEN_TYPE_LITERAL, value: 1 }))
        .toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
    });

    test('should recognize a string LITERAL', () => {
      expect(testContext.context.token({ type: TOKEN_TYPE_LITERAL, value: 'a' }))
        .toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
    });

    test('should recognize WHITESPACE', () => {
      expect(testContext.context.token({ type: TOKEN_TYPE_WHITESPACE, value: ' ' }))
        .toBe(testContext.grammar[TOKEN_TYPE_WHITESPACE]);
    });

    test('should recognize COMMENT', () => {
      expect(testContext.context.token({ type: TOKEN_TYPE_LINE_COMMENT, value: '' }))
        .toBe(testContext.grammar[TOKEN_TYPE_LINE_COMMENT]);
    });

    test('should recognize OPERATOR', () => {
      expect(testContext.context.token({ type: TOKEN_TYPE_OPERATOR, value: '+' }))
        .toBe(testContext.grammar['+']);
    });

    test('should recognize IDENTIFIER', () => {
      expect(testContext.context.token({ type: TOKEN_TYPE_IDENTIFIER, value: 'name' }))
        .toBe(testContext.grammar[TOKEN_TYPE_IDENTIFIER]);
    });

    test('should recognize IDENTIFIER that is an operator', () => {
      expect(testContext.context.token({ type: TOKEN_TYPE_IDENTIFIER, value: 'and' }))
        .toBe(testContext.grammar.and);
    });

    test('should throw if token type is unknown', () => {
      expect(() => {
        testContext.context.token({ type: '(unknown)' });
      }).toThrowError('Unknown');
    });
  });

  describe('given a simple grammar', () => {
    beforeEach(() => {
      testContext.grammar = createGrammar({
        one: 1, two: 2, three: 3,
      });
    });

    describe('and a parser context', () => {
      beforeEach(() => {
        testContext.tokens = [
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value: 1 },
          { type: TOKEN_TYPE_WHITESPACE, value: ' ' },
        ];
        testContext.context = new Context({
          tokens: testContext.tokens,
          symbols: new Scope(null, testContext.grammar),
        });
      });

      describe('after 1x advance()', () => {
        beforeEach(() => {
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar[TOKEN_TYPE_IDENTIFIER]);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar[TOKEN_TYPE_IDENTIFIER]);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1).original).toBe(testContext.grammar['+']);
        });
        test('look(2) should throw an error', () => {
          expect(() => {
            testContext.context.look(2);
          }).toThrowError(/too large/);
        });
      });

      describe('after 2x advance()', () => {
        beforeEach(() => {
          testContext.context.advance();
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar['+']);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar['+']);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1).original).toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
        });
      });

      describe('after 3x advance()', () => {
        beforeEach(() => {
          testContext.context.advance();
          testContext.context.advance();
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1).original).toBe(testContext.grammar[TOKEN_TYPE_END]);
        });
      });

      describe('after 4x advance()', () => {
        beforeEach(() => {
          testContext.context.advance();
          testContext.context.advance();
          testContext.context.advance();
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar[TOKEN_TYPE_END]);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar[TOKEN_TYPE_END]);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1)).toBeNull();
        });
        test('should throw on the next advance()', () => {
          expect(() => {
            testContext.context.advance();
          }).toThrowError(/end of input/);
        });
      });
    });

    describe('and a parser context of order 2', () => {
      beforeEach(() => {
        testContext.tokens = [
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value: 1 },
          { type: TOKEN_TYPE_WHITESPACE, value: ' ' },
        ];
        testContext.context = new Context({
          order: 2,
          tokens: testContext.tokens,
          symbols: new Scope(null, testContext.grammar),
        });
      });

      describe('after 1x advance()', () => {
        beforeEach(() => {
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar[TOKEN_TYPE_IDENTIFIER]);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar[TOKEN_TYPE_IDENTIFIER]);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1).original).toBe(testContext.grammar['+']);
        });
        test('look(2) should return this right symbol', () => {
          expect(testContext.context.look(2).original).toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
        });
      });

      describe('after 2x advance()', () => {
        beforeEach(() => {
          testContext.context.advance();
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar['+']);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar['+']);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1).original).toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
        });
        test('look(2) should return this right symbol', () => {
          expect(testContext.context.look(2).original).toBe(testContext.grammar[TOKEN_TYPE_END]);
        });
      });

      describe('after 3x advance()', () => {
        beforeEach(() => {
          testContext.context.advance();
          testContext.context.advance();
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar[TOKEN_TYPE_LITERAL]);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1).original).toBe(testContext.grammar[TOKEN_TYPE_END]);
        });
        test('look(2) should return this right symbol', () => {
          expect(testContext.context.look(2)).toBeNull();
        });
      });

      describe('after 4x advance()', () => {
        beforeEach(() => {
          testContext.context.advance();
          testContext.context.advance();
          testContext.context.advance();
          testContext.symbol = testContext.context.advance();
        });
        test('should return the right symbol', () => {
          expect(testContext.symbol.original).toBe(testContext.grammar[TOKEN_TYPE_END]);
        });
        test('look(0) should return this right symbol', () => {
          expect(testContext.context.look(0).original).toBe(testContext.grammar[TOKEN_TYPE_END]);
        });
        test('look(1) should return this right symbol', () => {
          expect(testContext.context.look(1)).toBeNull();
        });
        test('look(2) should return this right symbol', () => {
          expect(testContext.context.look(1)).toBeNull();
        });
        test('should throw on the next advance()', () => {
          expect(() => {
            testContext.context.advance();
          }).toThrowError(/end of input/);
        });
      });
    });

    describe('and given tokens: [one, +, two]', () => {
      beforeEach(() => {
        testContext.tokens = [
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'two' },
        ];
        testContext.context = new Context({
          tokens: testContext.tokens,
          symbols: new Scope(null, testContext.grammar),
        });
      });
      test('should be able to parse expression', () => {
        expect(testContext.context.expression()).toEqual({
          value: '+',
          left: { value: 1 },
          right: { value: 2 },
        });
      });
    });

    describe('and given tokens: [one, +, two, *, 4]', () => {
      beforeEach(() => {
        testContext.tokens = [
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'two' },
          { type: TOKEN_TYPE_OPERATOR, value: '*' },
          { type: TOKEN_TYPE_LITERAL, value: 4 },
        ];
        testContext.context = new Context({
          tokens: testContext.tokens,
          symbols: new Scope(null, testContext.grammar),
        });
      });
      test('should be able to parse expression', () => {
        expect(testContext.context.expression()).toEqual({
          value: '+',
          left: { value: 1 },
          right: { value: '*', left: { value: 2 }, right: { value: 4 } },
        });
      });
    });

    describe('given an empty tuple', () => {
      beforeEach(() => {
        testContext.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        testContext.context = new Context({
          tokens: testContext.tokens,
          symbols: new Scope(null, testContext.grammar),
        });
      });
      test('should be able to parse all items', () => {
        testContext.context.advance('{');
        expect(
          testContext.context.tuple({ separator: ',', end: '}', id: TOKEN_TYPE_IDENTIFIER }),
        ).toEqual([]);
      });
    });

    describe('given a tuple of identifiers', () => {
      beforeEach(() => {
        testContext.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_OPERATOR, value: ',' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        testContext.context = new Context({
          tokens: testContext.tokens,
          symbols: new Scope(null, testContext.grammar),
        });
      });
      test('should be able to parse all items', () => {
        testContext.context.advance('{');
        expect(
          testContext.context.tuple({ separator: ',', end: '}', id: TOKEN_TYPE_IDENTIFIER }),
        ).toEqual([
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
        ]);
      });
      test('should be able to parse all items until non-identifier token', () => {
        testContext.context.advance('{');
        expect(
          testContext.context.tuple({ separator: ',', end: null, id: TOKEN_TYPE_IDENTIFIER }),
        ).toEqual([
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
        ]);
      });
    });

    describe('given a tuple of expressions', () => {
      beforeEach(() => {
        testContext.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_LITERAL, value: 1 },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value: 1 },
          { type: TOKEN_TYPE_OPERATOR, value: ',' },
          { type: TOKEN_TYPE_LITERAL, value: 2 },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value: 2 },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        testContext.context = new Context({
          tokens: testContext.tokens,
          symbols: new Scope(null, testContext.grammar),
        });
      });
      test('should throw if identifiers are expected', () => {
        testContext.context.advance('{');
        expect(() => {
          testContext.context.tuple({ separator: ',', end: '}', id: TOKEN_TYPE_IDENTIFIER });
        }).toThrowError(/Expected/);
      });
      test('should be able to parse all expressions', () => {
        testContext.context.advance('{');
        expect(testContext.context.tuple({ separator: ',', end: '}' })).toEqual([
          {
            value: '+',
            left: { value: 1 },
            right: { value: 1 },
          },
          {
            value: '+',
            left: { value: 2 },
            right: { value: 2 },
          },
        ]);
      });
    });
  });
});


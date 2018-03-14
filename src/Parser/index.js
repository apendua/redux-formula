import Parser from './Parser';
import {
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_IDENTIFIER,
} from '../constants';

const parser = new Parser();

const parenthesis = () => (grammar) => {
  grammar
    .token(')');

  grammar
    .token('(')
    .ifUsedAsPrefix((parse) => {
      const e = parse.expression(0);
      parse.advance(')');
      return e;
    });
};

const unary = (id, alias, bp) => grammar =>
  grammar
    .token(id)
    .ifUsedAsPrefix(parse => ({
      [`$${alias}`]: [parse.expression(bp)],
    }));

const binary = (id, alias, bp) => grammar =>
  grammar
    .token(id)
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      [`$${alias}`]: [left, parse.expression(bp)],
    }));

const property = (id, alias, bp) => grammar =>
  grammar
    .token(id)
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => {
      const name = parse.advance(TOKEN_TYPE_IDENTIFIER);
      return {
        [`$${alias}`]: [
          left,
          { '!': name.value },
        ],
      };
    });

const scopeObject = () => (grammar) => {
  grammar.token('}');
  grammar.token('=');
  grammar.token(',');
  grammar.token('?');

  grammar
    .token('{')
    .ifUsedAsPrefix((parse) => {
      const object = {};
      while (parse.look(1).id !== '}') {
        let key;
        if (parse.look(1).id === '?') {
          key = '?';
          parse.advance('?');
          object[key] = parse.tuple({
            id: TOKEN_TYPE_IDENTIFIER,
            separator: ',',
            map: token => token.value,
          });
        } else {
          if (parse.look(1).id === '=') {
            key = '=';
          } else if (parse.look(1).id === TOKEN_TYPE_LITERAL) {
            key = parse.advance(TOKEN_TYPE_LITERAL).value;
          } else {
            key = parse.advance(TOKEN_TYPE_IDENTIFIER).value;
          }
          parse.advance('=');
          object[key] = parse.expression();
        }
      }
      parse.advance('}');
      return object;
    });
};

const index = (alias, bp) => (grammar) => {
  grammar
    .token(']');

  grammar
    .token('.[')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => {
      const parsed = parse.expression();
      parse.advance(']');
      return {
        [`$${alias}`]: [left, parsed],
      };
    });
};

const call = bp => (grammar) => {
  grammar
    .token(')');

  // TODO: Add support for "method call"
  grammar
    .token('(')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      '>>': left,
      '<<': parse.tuple({
        separator: ',',
        end: ')',
      }),
    }));
};

const list = () => (grammar) => {
  grammar
    .token(']');

  grammar
    .token('[')
    .ifUsedAsPrefix(parse => parse.tuple({
      separator: null,
      end: ']',
    }));
};

const binaryRight = (id, alias, bp) => grammar =>
  grammar
    .token(id)
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      [`$${alias}`]: [left, parse.expression(bp - 1)],
    }));

parser.token(TOKEN_TYPE_LITERAL)
  .ifUsedAsPrefix((parse, token) => ({
    '!': token.value,
  }));

parser.token(TOKEN_TYPE_IDENTIFIER)
  .ifUsedAsPrefix((parse, token) => ({
    $: token.value,
  }));

parser.token(TOKEN_TYPE_IDENTIFIER)
  .ifUsedAsPrefix((parse, token) => ({
    $: token.value,
  }));

[
  unary('-', 'neg', 70),
  unary('NOT', 'not', 70),

  binary('+', 'add', 20),
  binary('-', 'sub', 20),
  binary('*', 'mul', 40),
  binary('/', 'div', 40),

  property('.', 'dot', 90),

  binaryRight('AND', 'and', 60),
  binaryRight('XOR', 'xor', 50),
  binaryRight('OR', 'or', 50),

  index('dot', 80),
  call(80),
  parenthesis(),
  scopeObject(),
  list(),

].forEach(plugin => plugin(parser));

const parse = code => parser.parse(code);

export default Parser;
export {
  parser,
  parse,
};

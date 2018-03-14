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
  grammar.token('..');
  grammar.token('->');

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
        } else if (parse.look(1).id === '..' || parse.look(1).id === '->') {
          key = parse.advance().value;
          object[key] = parse.expression();
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
  grammar.token(')');
  grammar.token('|');

  // TODO: Add support for "method call"
  grammar
    .token('(')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      '()': left,
      '??': parse.tuple({
        separator: ',',
        end: ')',
      }),
    }));

  grammar
    .token(',')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => {
      const args = [
        left,
        ...parse.tuple({
          bp,
          separator: ',',
          end: '|',
        }),
      ];
      return {
        '??': args,
        '()': parse.expression(bp),
      };
    });

  grammar
    .token('|')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      '??': [left],
      '()': parse.expression(bp),
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

const condition = () => (grammar) => {
  grammar.token('=>');
  grammar.token('else');

  grammar
    .token('if')
    .ifUsedAsPrefix((parse) => {
      const $match = [];
      do {
        $match.push(parse.expression());
        parse.advance('=>');
        $match.push(parse.expression());
        if (parse.look(1).id === 'if') {
          parse.advance('if');
        }
      } while (parse.look(0).id === 'if');
      if (parse.look(1).id === 'else') {
        parse.advance('else');
        $match.push({ '!': true });
        $match.push(parse.expression());
      }
      return {
        $match,
      };
    });
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

  binary('<=', 'lte', 10),
  binary('>=', 'gte', 10),
  binary('<', 'lt', 10),
  binary('>', 'gt', 10),
  binary('==', 'eq', 10),
  binary('!=', 'neq', 10),

  property('.', 'dot', 90),

  binaryRight('AND', 'and', 60),
  binaryRight('XOR', 'xor', 50),
  binaryRight('OR', 'or', 50),

  index('dot', 80),
  call(80),
  parenthesis(),
  scopeObject(),
  list(),
  condition(),

].forEach(plugin => plugin(parser));

const parse = code => parser.parse(code);

export default Parser;
export {
  parser,
  parse,
};

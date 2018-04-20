import Parser from './Parser';
import {
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_IDENTIFIER,

  VALUE_TYPE_INTEGER,
  VALUE_TYPE_STRING,
} from '../constants';
import pluginBlock from './plugins/block';
import pluginParams from './plugins/params';

const parser = new Parser({
  plugins: [
    pluginBlock,
    pluginParams,
  ],
});

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
      [`@${alias}`]: [parse.expression(bp)],
    }));

const binary = (id, alias, bp) => grammar =>
  grammar
    .token(id)
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      [`@${alias}`]: [left, parse.expression(bp)],
    }));

const property = bp => (grammar) => {
  grammar
    .token(':')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => {
      let name;
      if (parse.look(1).id === TOKEN_TYPE_IDENTIFIER) {
        name = parse.advance();
      } else if (parse.look(1).id === TOKEN_TYPE_LITERAL) {
        if (parse.look(1).valueType !== VALUE_TYPE_INTEGER && parse.look(1).valueType !== VALUE_TYPE_STRING) {
          throw parse.error(`Expected integer or string, got ${parse.look(1).valueType}`);
        } else {
          name = parse.advance();
        }
      } else {
        throw parse.error(`Expected identifier, integer or string, got ${parse.look(1).id}`);
      }
      return {
        '&': left['&'] && !left[':'] ? left['&'] : left,
        ':': name.value.toString(),
      };
    });

  grammar
    .token('.')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => {
      const name = parse.advance(TOKEN_TYPE_IDENTIFIER);
      return {
        '@dot': [
          left,
          { '!': name.value },
        ],
      };
    });
};

const scopeObject = () => (grammar) => {
  grammar.token('}');
  grammar.token('=');
  grammar.token(',');
  grammar.token('?');

  grammar
    .token('{')
    .ifUsedAsPrefix(parse => parse.block({ end: '}' }));
};

const index = (alias, bp) => (grammar) => {
  grammar.token(']');

  grammar
    .token('.[')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => {
      const right = parse.expression();
      parse.advance(']');
      return {
        [`@${alias}`]: [left, right],
      };
    });
};

const genericOperator = bp => (grammar) => {
  grammar.token('@');
  grammar.token(',');
  grammar.token('(');
  grammar.token(')');
  grammar.token('[');
  grammar.token(']');
  grammar.token('--');

  grammar
    .token('@')
    .setBindingPower(bp)
    .ifUsedAsPrefix((parse) => {
      if (parse.look(1).id === '[') {
        parse.advance('[');
        const operator = parse.expression();
        parse.advance(']');
        const params = parse.params({
          array: true,
          separator: ',',
        });
        return {
          ...params.object,
          '@': [
            operator,
            ...params.array,
          ],
        };
      } else if (parse.look(1).id === TOKEN_TYPE_IDENTIFIER) {
        const names = parse.tuple({
          separator: ':',
          id: [TOKEN_TYPE_IDENTIFIER, TOKEN_TYPE_LITERAL],
          map: (token) => {
            if (
              token.id !== TOKEN_TYPE_IDENTIFIER &&
              token.valueType !== VALUE_TYPE_INTEGER &&
              token.valueType !== VALUE_TYPE_STRING
            ) {
              throw parse.error(`Expected integer or string, got ${token.valueType}`);
            }
            return token.value.toString();
          },
        });
        const namespace = names.reduce((object, name) => ({
          '&': object,
          ':': name,
        }));
        const params = parse.params({
          array: true,
          separator: ',',
        });
        return {
          ...params.object,
          '@': [namespace, ...params.array],
        };
      } if (parse.look(1).id === TOKEN_TYPE_IDENTIFIER ||
            parse.look(1).id === TOKEN_TYPE_LITERAL) {
        const name = parse.advance().value;
        const params = parse.params({
          array: true,
          separator: ',',
        });
        return {
          ...params.object,
          [`@${name}`]: params.array,
        };
      }
      throw parse.error(`Expected "[" or identifier after @, got "${parse.look(1).id}".`);
    })
    .ifUsedAsInfix((parse, token, left) => {
      if (parse.look(1).id === '[') {
        parse.advance('[');
        const operator = parse.expression();
        parse.advance(']');
        const params = parse.params({ array: false });
        return {
          ...params.object,
          '@call': [
            operator,
            left,
            ...parse.expression(bp),
          ],
        };
      } else if (parse.look(1).id === TOKEN_TYPE_IDENTIFIER ||
                 parse.look(1).id === TOKEN_TYPE_LITERAL) {
        const name = parse.advance().value;
        const params = parse.params({ array: false });
        return {
          ...params.object,
          '@': [name, left, parse.expression(bp)],
        };
      }
      throw parse.error(`Expected "[" or identifier after @, got "${parse.look(1).id}".`);
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
      '@call': [
        left,
        ...parse.tuple({
          separator: ',',
          end: ')',
        }),
      ],
    }));

  grammar
    .token('|')
    .setBindingPower(bp)
    .ifUsedAsPrefix((parse) => {
      const args = parse.tuple({
        bp,
        separator: ',',
        end: '|',
      });
      return {
        '@call': [
          parse.expression(bp),
          ...args,
        ],
      };
    });

  grammar
    .token('|')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      '@call': [
        parse.expression(bp),
        left,
      ],
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

const ellipsis = bp => (grammar) => {
  grammar
    .token('<<')
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => {
      const key = parse.advance(TOKEN_TYPE_IDENTIFIER).value;
      return {
        key,
        '<<': left,
      };
    });

  grammar
    .token('...')
    .ifUsedAsPrefix(() => ({
      '...': true,
    }));
};

const binaryRight = (id, alias, bp) => grammar =>
  grammar
    .token(id)
    .setBindingPower(bp)
    .ifUsedAsInfix((parse, token, left) => ({
      [`@${alias}`]: [left, parse.expression(bp - 1)],
    }));

parser.token(TOKEN_TYPE_LITERAL)
  .ifUsedAsPrefix((parse, token) => ({
    '!': token.value,
  }));

parser.token(TOKEN_TYPE_IDENTIFIER)
  .ifUsedAsPrefix((parse, token) => ({
    '&': token.value,
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

  property(90),

  binaryRight('AND', 'and', 60),
  binaryRight('XOR', 'xor', 50),
  binaryRight('OR', 'or', 50),

  index('dot', 80),
  call(80),
  parenthesis(),
  scopeObject(),
  list(),
  ellipsis(80),
  genericOperator(80),

].forEach(plugin => plugin(parser));

const parse = code => parser.parse(code);

export default Parser;
export {
  parser,
  parse,
};

import {
  // TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_IDENTIFIER,
} from '../../constants';

const pluginBlock = (grammar) => {
  grammar.token('=');
  grammar.token(',');
  grammar.token('?');

  grammar.utility('block', (parse, {
    end = '}',
    pure = false,
  }) => {
    const object = {};
    while (parse.look(1).id !== end) {
      let key;
      let target;
      if (parse.look(1).id === '?') {
        if (pure) {
          throw parse.error('Expected pure object, but received "?".', parse.look(1));
        }
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
          if (pure) {
            throw parse.error('Expected pure object, but received "=".', parse.look(1));
          }
        } else {
          const assignment = parse.expression();
          if (assignment['<<']) {
            key = assignment.key; // eslint-disable-line
            target = assignment['<<'];
          } else if (assignment['&'] && typeof assignment['&'] === 'string') {
            key = assignment['&'];
          } else {
            throw parse.error('Expected identifier or string literal, got an expression.');
          }
        }
        /*
        } else if (parse.look(1).id === TOKEN_TYPE_LITERAL) {
          key = parse.advance(TOKEN_TYPE_LITERAL).value;
        } else {
          key = parse.advance(TOKEN_TYPE_IDENTIFIER).value;
        }
        */
        parse.advance('=');
        if (!target) {
          object[key] = parse.expression();
        } else {
          object[key] = {
            '>': target,
            '=': parse.expression(),
          };
        }
      }
    }
    parse.advance(end);
    return object;
  });
};

export default pluginBlock;

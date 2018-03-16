
const pluginParams = (grammar) => {
  grammar.token(',');
  grammar.token('--');
  grammar.token('(');
  grammar.token(')');

  grammar.utility('params', (parse, {
    bp,
    array = true,
    separator = ',',
  }) => {
    const params = {};
    if (parse.look(1).id === '--') {
      parse.advance('--');
      params.object = parse.block({
        end: '--',
        pure: true,
      });
    }
    if (array) {
      if (parse.look(1).id === '(') {
        parse.advance('(');
        params.array = parse.tuple({
          separator: null,
          end: ')',
        });
      } else {
        params.array = parse.tuple({
          bp,
          separator,
        });
      }
    }
    return params;
  });
};

export default pluginParams;


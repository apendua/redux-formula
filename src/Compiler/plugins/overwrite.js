import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const constant = x => () => x;
const identity = x => x;

const pluginOverwrite = {
  createCompiler: ({ subExpression }) => (next) => {
    if (!subExpression) {
      throw new Error('Plugin "overwrite" depends on "sub expression"');
    }
    return (expression) => {
      if (!isPlainObject(expression)) {
        return next(expression);
      }
      if (has(expression, '=')) {
        const { '=': valueExpr, ...varsExpr } = expression;
        return subExpression(
          varsExpr,
          [valueExpr],
          constant(constant(identity)),
        );
      }
      return next(expression);
    };
  },
};

export default pluginOverwrite;

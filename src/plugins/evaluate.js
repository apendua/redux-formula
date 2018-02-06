import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const pluginEvaluate = {
  createCompiler: ({ subExpression }) => (next) => {
    if (!subExpression) {
      throw new Error('Plugin "evaluate" depends on "sub expression"');
    }
    return (expression) => {
      if (!isPlainObject(expression)) {
        return next(expression);
      }
      if (has(expression, '<<')) {
        const {
          '<<': argsExpr,
          '>!': func,
          '>>': funcExpr,
          ...varsExpr
        } = expression;
        if (func && typeof func !== 'function') {
          throw new Error('Expected a function at ">!"');
        }
        if (func && funcExpr) {
          throw new Error('You cannot use both ">>" and ">!" in the same expression');
        }
        return subExpression(
          varsExpr,
          [funcExpr || { '!': func }, ...(isArray(argsExpr) ? argsExpr : [argsExpr])],
          scope => () => (...selectors) =>
            scope.boundSelector(...selectors, (f, ...args) => f(...args)),
        );
      }
      return next(expression);
    };
  },
};

export default pluginEvaluate;

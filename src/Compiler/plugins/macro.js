import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const pluginMacro = {
  createCompiler: ({ createSelector, subExpression }) => (next) => {
    if (!subExpression) {
      throw new Error('Plugin "macro" depends on "sub expression"');
    }
    return (expression) => {
      if (!isPlainObject(expression)) {
        return next(expression);
      }
      if (has(expression, ':=')) {
        const { ':=': valueExpr, ...varsExpr } = expression;
        return subExpression(
          varsExpr,
          [valueExpr],
          () => scope => selectValue => scope.boundSelector(
            scope.boundSelector(
              selectValue,
              value => createSelector(value),
            ),
            (...args) => args,
            (valueSelector, args) => valueSelector(...args),
          ),
        );
      }
      return next(expression);
    };
  },
};

export default pluginMacro;

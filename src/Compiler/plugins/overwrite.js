import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const constant = x => () => x;
const identity = x => x;

const pluginOverwrite = {
  createCompiler: ({ compile, subExpression }) => (next) => {
    if (!subExpression) {
      throw new Error('Plugin "overwrite" depends on "sub expression"');
    }
    return (expression) => {
      if (!isPlainObject(expression)) {
        return next(expression);
      }
      if (has(expression, '=')) {
        const {
          '=': valueExpr,
          '>': portalExpr,
          ...varsExpr
        } = expression;
        const compiled = subExpression(
          varsExpr,
          [valueExpr],
          constant(constant(identity)),
        );
        if (portalExpr) {
          const portal = compile(portalExpr);
          if (!portal.createTeleport) {
            const type = portal.meta && portal.meta.type;
            throw new Error(`Cannot use ${type || 'value'} as teleport`);
          }
          return {
            ...compiled,
            createSelector: (scope) => {
              const teleport = portal.createTeleport(scope);
              const selector = compiled.createSelector(scope);
              teleport(selector);
              return selector;
            },
          };
        }
        return compiled;
      }
      return next(expression);
    };
  },
};

export default pluginOverwrite;

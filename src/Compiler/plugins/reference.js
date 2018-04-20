import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const pluginReference = {
  createCompiler: () => next => (expression) => {
    if (!isPlainObject(expression) || !has(expression, '&')) {
      return next(expression);
    }
    const name = expression['&'];
    return {
      deps: { [name]: name },
      meta: {
        name,
        type: 'reference',
      },
      createSelector: scope => scope.relative(scope.resolve(name).selector),
      createTeleport: scope => scope.resolve(name).teleport,
      createOperator: originalScope => (scope, options) => {
        const variable = originalScope.resolve(name);
        const operator = variable.operator(scope, options);
        return (...selectors) => scope.relative(operator(...selectors));
      },
      createGetProperty: (scope) => {
        const variable = scope.resolve(name);
        return (key) => {
          if (!variable.getProperty) {
            throw new Error(`Variable ${name} cannot be used as namespace`);
          }
          return variable.getProperty(key);
        };
      },
    };
  },
};

export default pluginReference;

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
      createOperator: (scope, options) => {
        const variable = scope.resolve(name);
        if (!variable.createOperator) {
          throw new Error(`Variable ${name} cannot be used as operator`);
        }
        const operator = variable.createOperator(scope, options);
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

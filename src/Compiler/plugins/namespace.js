import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const pluginNamespace = {
  createCompiler: ({ compile }) => next => (expression) => {
    if (!isPlainObject(expression) || !has(expression, ':')) {
      return next(expression);
    }
    const {
      deps,
      createGetProperty,
    } = compile(expression['&']);
    const name = expression[':'];
    if (typeof name !== 'string') {
      throw new Error('Expected property name to be a string');
    }
    if (!createGetProperty) {
      throw new Error('Value cannot be used as namespace');
    }
    return {
      deps,
      meta: {
        name,
        type: 'namespace',
      },
      createSelector: scope => scope.relative(createGetProperty(scope)(name).selector),
      createOperator: (scope) => {
        const property = createGetProperty(scope)(name);
        if (!property.createOperator) {
          throw new Error(`Property ${name} cannot be used as operator`);
        }
        const operator = property.createOperator(scope);
        return (...selectors) => scope.relative(operator(...selectors));
      },
      createGetProperty: (scope) => {
        const property = createGetProperty(scope)(name);
        let getProperty;
        return (key) => {
          if (!getProperty) {
            if (!property.createGetProperty) {
              throw new Error(`Property ${name} cannot be used as namespace`);
            }
            getProperty = property.createGetProperty(scope);
          }
          return getProperty(key);
        };
      },
    };
  },
};

export default pluginNamespace;

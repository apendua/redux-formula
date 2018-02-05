import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const constant = x => () => x;

const pluginLiteral = {
  createApi: () => ({
    literal: value => ({ bindTo: scope => scope.bind(constant(value)) }),
  }),
  createCompiler: ({ literal }) => next => (expression) => {
    switch (typeof expression) {
      case 'number':
      case 'boolean':
      case 'undefined':
        return literal(expression);
      case 'object': {
        if (expression === null) {
          return literal(expression);
        }
        if (!isPlainObject(expression) || !has(expression, '!')) {
          return next(expression);
        }
        return literal(expression['!']);
      }
      default:
        return next(expression);
    }
  },
};

export default pluginLiteral;

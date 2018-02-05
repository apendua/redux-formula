import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const constant = x => () => x;

const pluginLiteral = {
  createCompiler: ({ compile }) => next => (expression) => {
    switch (typeof expression) {
      case 'number':
      case 'boolean':
      case 'undefined':
        return compile({ '!': expression });
      case 'object': {
        if (expression === null) {
          return compile({ '!': expression });
        }
        if (!isPlainObject(expression) || !has(expression, '!')) {
          return next(expression);
        }
        const value = expression['!'];
        return { bindTo: scope => scope.bind(constant(value)) };
      }
      default:
        return next(expression);
    }
  },
};

export default pluginLiteral;

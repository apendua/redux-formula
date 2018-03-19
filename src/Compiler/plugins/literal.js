import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const pluginLiteral = {
  createApi: () => ({
    literal: value => ({
      meta: {
        type: 'literal',
      },
      createSelector: scope => scope.createConstantSelector(value),
    }),
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
        if (isPlainObject(expression) && has(expression, '!')) {
          return literal(expression['!']);
        }
        return next(expression);
      }
      default:
        return next(expression);
    }
  },
};

export default pluginLiteral;

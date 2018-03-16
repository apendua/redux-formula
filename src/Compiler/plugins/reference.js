import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';

const pluginReference = {
  createCompiler: () => next => (expression) => {
    if (!isPlainObject(expression) || !has(expression, '$')) {
      return next(expression);
    }
    const name = expression.$;
    return {
      deps: { [name]: name },
      bindTo: scope => scope.relative(scope.resolve(name).selector),
    };
  },
};

export default pluginReference;

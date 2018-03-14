import invokeMap from 'lodash/invokeMap';
import isArray from 'lodash/isArray';
import map from 'lodash/map';

const pluginArray = {
  createCompiler: ({ compile }) => next => (expression) => {
    if (!isArray(expression)) {
      return next(expression);
    }
    const array = map(expression, compile);
    const deps = Object.assign(
      {},
      ...map(array, 'deps'),
    );
    return {
      deps,
      bindTo: (scope) => {
        const selectors = invokeMap(array, 'bindTo', scope);
        return scope.boundSelector(
          ...selectors,
          (...values) => values,
        );
      },
    };
  },
};

export default pluginArray;

import isPlainObject from 'lodash/isPlainObject';

const pluginEllipsis = {
  createCompiler: () => next => (expression) => {
    if (!isPlainObject(expression) || !expression['...']) {
      return next(expression);
    }
    const selectors = [];
    return {
      createTeleport: scope => (selector) => {
        selectors.push(scope.relative(selector));
      },
      createSelector: (scope) => {
        let lazySelector = null;
        return (...args) => {
          if (!lazySelector) {
            lazySelector = scope.boundSelector(
              selectors,
              (...values) => values,
            );
          }
          return lazySelector.evaluate(...args);
        };
      },
    };
  },
};

export default pluginEllipsis;

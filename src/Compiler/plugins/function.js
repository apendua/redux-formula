import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';
import omit from 'lodash/omit';
import forEach from 'lodash/forEach';

const pluginFunction = {
  createCompiler: ({ compile }) => next => (expression) => {
    if (!isPlainObject(expression) || !has(expression, '?')) {
      return next(expression);
    }
    const { '?': params, ...valueExpr } = expression;
    const value = compile(valueExpr);
    const unknowns = [...params, 'this'];
    const variable = {
      deps: omit(value.deps, unknowns),
      meta: {
        type: 'function',
      },
      createSelector: (scope) => {
        const newScope = scope.create(unknowns);
        return scope.boundSelector(
          value.createSelector(newScope),
          (evaluate) => {
            const f = (...args) => {
              const data = { this: f };
              forEach(args, (v, i) => {
                data[params[i]] = v;
              });
              return evaluate(data);
            };
            return f;
          },
        );
      },
      createOperator: scope => (...selectors) => {
        if (selectors.length > params.length) {
          throw new Error('Too many arguments provided.');
        }
        return scope.boundSelector(
          variable.createSelector(scope),
          ...selectors,
          (func, ...values) => {
            const f = (...args) => func(...values, ...args);
            if (selectors.length === params.length) {
              return f();
            }
            return f;
          },
        );
      },
    };
    return variable;
  },
};

export default pluginFunction;

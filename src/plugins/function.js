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
    return {
      deps: omit(value.deps, unknowns),
      bindTo: (scope) => {
        const newScope = scope.create(unknowns);
        return scope.boundSelector(
          value.bindTo(newScope),
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
    };
  },
};

export default pluginFunction;

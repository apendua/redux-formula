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
      createOperator: originalScope => scope => (...selectors) => {
        if (selectors.length > params.length) {
          throw new Error('Too many arguments provided.');
        }
        const newScope = originalScope.create(params.slice(selectors.length), scope);
        forEach(selectors, (selector, i) => {
          newScope.define(params[i], {
            createSelector: targetScope => targetScope.relative(selector),
          });
        });
        // NOTE: Re-using this as operator can result in infinite call loop.
        newScope.define('this', omit(variable, 'createOperator'));
        //--------------------------------------------------------
        if (!newScope.hasOwnUnknowns()) {
          return scope.relative(value.createSelector(newScope));
        }
        return scope.boundSelector(
          value.createSelector(newScope),
          (evaluate) => {
            const f = (...args) => {
              const data = {};
              forEach(args, (v, i) => {
                data[params[selectors.length + i]] = v;
              });
              return evaluate(data);
            };
            return f;
          },
        );
      },
    };
    return variable;
  },
};

export default pluginFunction;

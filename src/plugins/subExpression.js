import isPlainObject from 'lodash/isPlainObject';
import map from 'lodash/map';
import has from 'lodash/has';
import mapValues from 'lodash/mapValues';
import invokeMap from 'lodash/invokeMap';
import keys from 'lodash/keys';
import omit from 'lodash/omit';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import {
  destructure,
} from '../utils';

const constant = x => () => x;
const identity = x => x;

const pluginSubExpression = {
  createApi: ({ compile }) => ({
    subExpression: (varsExpr, argsExpr, bindOperator, operatorName) => {
      const vars = mapValues(varsExpr, compile);
      const args = argsExpr
        ? map(argsExpr, compile)
        : null;
      const deps = Object.assign(
        {},
        ...map(vars, 'deps'),
        ...map(args, 'deps'),
      );
      const allKeys = keys(vars);
      const namesPublic = allKeys.filter(name => name.charAt(0) !== '~');
      const namesPrivate = invokeMap(allKeys.filter(name => name.charAt(0) === '~'), String.prototype.substr, 1);
      return {
        deps: omit(deps, ...namesPublic, ...namesPrivate),
        bindTo: (scope) => {
          const newScope = scope.create();
          forEach(vars, (variable, name) => {
            newScope.define(
              name[0] === '~' ? name.substr(1) : name,
              variable.deps,
              variable.bindTo,
            );
          });
          if (operatorName) {
            let selectEvaluate;
            try {
              selectEvaluate = newScope.getSelector(operatorName);
              return newScope.boundSelector(
                selectEvaluate,
                ...invokeMap(args, 'bindTo', newScope),
                (evaluate, ...rest) => evaluate(...rest),
              );
            } catch (err) {
              const msg = err.toString();
              if (!/Unknown dependency/.test(msg) &&
                  !/Circular dependency/.test(msg)
              ) {
                throw err;
              }
            }
          }
          if (bindOperator) {
            return bindOperator(newScope)(newScope.variablesSelector(namesPrivate))(...invokeMap(args, 'bindTo', newScope));
          }
          return newScope.variablesSelector(namesPublic);
        },
      };
    },
  }),
  createCompiler: ({ subExpression, operators }) => next => (expression) => {
    if (!isPlainObject(expression)) {
      return next(expression);
    }
    if (has(expression, '=')) {
      const { '=': valueExpr, ...varsExpr } = expression;
      return subExpression(
        varsExpr,
        [valueExpr],
        constant(constant(identity)),
      );
    }
    if (has(expression, '<<')) {
      const {
        '<<': argsExpr,
        '>!': func,
        '>>': funcExpr,
        ...varsExpr
      } = expression;
      if (func && typeof func !== 'function') {
        throw new Error('Expected a function at ">!"');
      }
      if (func && funcExpr) {
        throw new Error('You cannot use both ">>" and ">!" in the same expression');
      }
      return subExpression(
        varsExpr,
        [funcExpr || { '!': func }, ...(isArray(argsExpr) ? argsExpr : [argsExpr])],
        scope => () => (...selectors) =>
          scope.boundSelector(...selectors, (f, ...args) => f(...args)),
      );
    }
    const {
      varsExpr,
      operator,
      argsExpr,
    } = destructure(expression);
    return subExpression(
      varsExpr,
      operator && !isArray(argsExpr) ? [argsExpr] : argsExpr,
      operator && operators[operator],
      operator && operator.substr(1),
    );
  },
};

export default pluginSubExpression;

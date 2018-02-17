import isPlainObject from 'lodash/isPlainObject';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import invokeMap from 'lodash/invokeMap';
import keys from 'lodash/keys';
import omit from 'lodash/omit';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';

const destructure = (expression) => {
  const varsExpr = {};
  let operator;
  let argsExpr;
  forEach(expression, (value, key) => {
    if (key.charAt(0) === '$') {
      if (operator) {
        throw new Error(`Multiple operators used in one scope: ${operator}, ${key}`);
      } else {
        operator = key;
        argsExpr = (isArray(value) ? value : [value]);
      }
    } else if (key[0] !== '#') {
      varsExpr[key] = value;
    }
  });
  return {
    operator,
    argsExpr,
    varsExpr,
  };
};

const pluginSubExpression = {
  createApi: ({ compile }) => ({
    subExpression: (varsExpr, argsExpr, bindOperator, operatorName) => {
      const vars = mapValues(varsExpr, compile);
      const args = argsExpr
        ? map(argsExpr, compile)
        : null;
      const allKeys = keys(vars);
      const namesPublic = allKeys.filter(name => name.charAt(0) !== '~');
      const namesPrivate = invokeMap(allKeys.filter(name => name.charAt(0) === '~'), String.prototype.substr, 1);
      const preDeps = omit(Object.assign(
        {},
        ...map(vars, 'deps'),
        ...map(args, 'deps'),
      ), ...namesPublic, ...namesPrivate);
      const deps = {};
      forEach(preDeps, (name) => {
        const match = /^(\^*)(.*)/.exec(name);
        if (match && match[1] && (vars[match[2]] || vars[`~${match[2]}`])) {
          const newName = name.substr(1);
          deps[newName] = newName;
        } else {
          deps[name] = name;
        }
      });
      return {
        deps,
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

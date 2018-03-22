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
    subExpression: (varsExpr, argsExpr, createOperator, operator) => {
      const vars = mapValues(varsExpr, compile);
      const args = argsExpr
        ? map(argsExpr, compile)
        : null;
      const allKeys = keys(vars);
      const namesPublic = allKeys
        .filter(name => name.charAt(0) !== '~')
        .map(name => (name.charAt(0) === '_' ? name.substr(1) : name));
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
        meta: {
          type: 'sub-expression',
        },
        createGetProperty: (scope) => {
          const newScope = scope.create();
          forEach(vars, (variable, name) => {
            newScope.define(
              (name.charAt(0) === '~' || name.charAt(0) === '_') ? name.substr(1) : name,
              variable,
            );
          });
          return (name) => {
            if (namesPublic.indexOf(name) < 0) {
              throw new Error(`Unknown property ${name}`);
            }
            return newScope.resolve(name);
          };
        },
        createSelector: (scope) => {
          const newScope = scope.create();
          forEach(vars, (variable, name) => {
            newScope.define(
              (name.charAt(0) === '~' || name.charAt(0) === '_') ? name.substr(1) : name,
              variable,
            );
          });
          const options = newScope.variablesSelector([...namesPublic, ...namesPrivate]);
          if (createOperator) {
            return createOperator(
              scope,
              options,
            )(...invokeMap(args, 'createSelector', newScope));
          }
          if (operator === '$') {
            if (!args[0].createOperator) {
              throw new Error('Value cannot be used as operator.');
            }
            return scope.relative(
              args[0].createOperator(
                newScope,
                options,
              )(...invokeMap(args.slice(1), 'createSelector', newScope)),
            );
          }
          return newScope.variablesSelector(namesPublic, scope);
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
    const name = operator && operator.substr(1);
    return subExpression(
      varsExpr,
      operator && !isArray(argsExpr) ? [argsExpr] : argsExpr,
      operator && operators[name],
      operator,
    );
  },
};

export default pluginSubExpression;

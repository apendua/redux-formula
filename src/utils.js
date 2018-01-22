import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';

export const constant = x => () => x;
export const identity = x => x;

export const split = (path) => {
  const index = path.indexOf('.');
  if (index < 0) {
    return [path];
  }
  return [path.substr(0, index), path.substr(index + 1)];
};

export const destructure = (expression) => {
  if (isArray(expression)) {
    return { variablesExpr: mapValues(expression, identity) };
  }
  const variablesExpr = {};
  let operator;
  let argsExpr;
  forEach(expression, (value, key) => {
    if (key[0] === '$' || key === '=' || key === '(') {
      if (operator) {
        throw new Error(`Multiple operators used in one scope: ${operator}, ${key}`);
      } else {
        operator = key;
        argsExpr = (isArray(value) ? value : [value]);
      }
    } else if (key[0] !== '#') {
      variablesExpr[key] = value;
    }
  });
  return {
    operator,
    argsExpr,
    variablesExpr,
  };
};

import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';

export const constant = x => () => x;
export const identity = x => x;

export const split = (path) => {
  const index = path.indexOf('.');
  if (index < 0) {
    return [path];
  }
  return [path.substr(0, index), path.substr(index + 1)];
};

export const defaultIsEqual = (a, b) => a === b;

export const shallowEqual = (a, b) => {
  const aIsArray = isArray(a);
  const bIsArray = isArray(b);
  if (aIsArray && bIsArray) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((v, i) => v === b[i]);
  }
  if (!aIsArray && !bIsArray) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every(k => a[k] === b[k]);
  }
  return false;
};

export const destructure = (expression) => {
  const varsExpr = {};
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
      varsExpr[key] = value;
    }
  });
  return {
    operator,
    argsExpr,
    varsExpr,
  };
};

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
    return { variables: mapValues(expression, identity) };
  }
  const variables = {};
  let operator;
  let operatorArgs;
  forEach(expression, (value, key) => {
    if (key[0] === '$') {
      if (operator) {
        throw new Error(`Multiple operators used in one scope: ${operator}, ${key}`);
      } else {
        operator = key;
        operatorArgs = (isArray(value) ? value : [value]);
      }
    } else {
      variables[key] = value;
    }
  });
  return {
    operator,
    operatorArgs,
    variables,
  };
};

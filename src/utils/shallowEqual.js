import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';

const shallowEqual = (a, b) => {
  if (!isObject(a) || !isObject(b)) {
    return a === b;
  }
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

export default shallowEqual;

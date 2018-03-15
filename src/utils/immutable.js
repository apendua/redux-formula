import has from 'lodash/has';
import omit from 'lodash/omit';
import indexOf from 'lodash/indexOf';
import isNil from 'lodash/isNil';
import isNaN from 'lodash/isNaN';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';

export const splitKey = (key) => {
  if (typeof key !== 'string') {
    return [null, null];
  }
  const i = key.indexOf('.');
  if (i >= 0) {
    return [key.substr(0, i), key.substr(i + 1)];
  }
  return [key, null];
};

export const createModifyAtKey = (modify) => {
  const modifyAtKey = (object, key, value) => {
    if (!key) {
      return modify(object, value);
    }
    const [k, tail] = splitKey(key);
    if (isNil(object)) {
      return {
        [k]: modifyAtKey(null, tail, value),
      };
    } else if (isArray(object)) {
      const i = parseInt(k, 10);
      if (!isNaN(i) && i >= 0 && i <= object.length) {
        const v = modifyAtKey(object[i], tail, value);
        if (v !== object[i]) {
          return [...object.slice(0, i), v, ...object.slice(i + 1)];
        }
      }
    } else if (isPlainObject(object)) {
      const v = modifyAtKey(object[k], tail, value);
      if (v !== object[k]) {
        return {
          ...object,
          [k]: v,
        };
      }
    }
    return object;
  };
  return modifyAtKey;
};

export const setAtKey = createModifyAtKey((currentValue, newValue) => newValue);
export const pushAtKey = createModifyAtKey((currentValue, valueToAdd) => {
  if (isArray(currentValue)) {
    return [...currentValue, valueToAdd];
  } else if (isNil(currentValue)) {
    return [valueToAdd];
  }
  return currentValue;
});

export const pullAtKey = createModifyAtKey((currentValue, valueToRemove) => {
  if (!isArray(currentValue)) {
    return currentValue;
  }
  const i = indexOf(currentValue, valueToRemove);
  if (i >= 0) {
    return [...currentValue.slice(0, i), ...currentValue.slice(i + 1)];
  }
  return currentValue;
});

export const delAtKey = (object, key, defaultValue) => {
  if (!key) {
    return defaultValue;
  }
  if (!object) {
    return object;
  }
  const [k, tail] = splitKey(key);
  if (tail) {
    return {
      ...object,
      [k]: delAtKey(object[k], tail),
    };
  }
  if (isArray(object)) {
    const i = parseInt(k, 10);
    if (!isNaN(i) && i >= 0 && i < object.length) {
      return [...object.slice(0, i), ...object.slice(i + 1)];
    }
  } else if (isPlainObject(object)) {
    if (has(object, k)) {
      return omit(object, k);
    }
  }
  return object;
};

import omit from 'lodash/omit';
import mapValues from 'lodash/mapValues';

const defaultIsEqual = (a, b) => a === b;

/**
 * Like lodash/mapValues, but with more caution, e.g. when new value is the
 * the same as the old one, do not create a new object. Also adds an ability
 * to remove selected fields by returning a special value.
 * @param {object} object to map
 * @param {function} mapValue
 * @param {function} isEqual
 * @returns {object}
 */
const stableMapValues = (object, mapValue, isEqual = defaultIsEqual) => {
  let modified = false;

  const toRemove = [];
  const remove = {};

  const newObject = mapValues(object, (v, k) => {
    const newValue = mapValue(v, k, remove);
    if (newValue === remove) {
      toRemove.push(k);
    } else if (isEqual(newValue, v)) {
      return v;
    }
    modified = true;
    return newValue;
  });
  if (toRemove.length > 0) {
    return omit(newObject, toRemove);
  }
  if (!modified) {
    return object;
  }
  return newObject;
};

export default stableMapValues;

import stableMapValues from './stableMapValues';

const defaultIsEqual = (a, b) => a === b;
const shallowEqual = (a, b) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  return keysA.every(k => a[k] === b[k]);
};

const memoizeMapValues = (mapOneValue, isEqual = defaultIsEqual) => {
  let lastInput = null;
  let lastResult = null;
  return (input) => {
    if (!lastResult) {
      lastResult = input;
    }
    const result = stableMapValues(input, (value, key) => {
      const lastValue = lastResult && lastResult[key];
      if (lastInput && lastInput[key] === value) {
        return lastValue;
      }
      return mapOneValue(value, key);
    }, isEqual);
    lastInput = input;
    if (!shallowEqual(result, lastResult)) {
      lastResult = result;
    }
    return lastResult;
  };
};

export default memoizeMapValues;

import stableMapValues from './stableMapValues';
import {
  shallowEqual,
  defaultIsEqual,
} from './utils';

const memoizeMapValues = (mapOneValue, isEqual = defaultIsEqual) => {
  let lastInput = null;
  let lastResult = null;
  return (input) => {
    if (!lastResult) {
      lastResult = {};
    }
    const newResult = stableMapValues(input, (value, key) => {
      const lastValue = lastResult && lastResult[key];
      if (lastInput && lastInput[key] === value) {
        return lastValue;
      }
      return mapOneValue(value, key);
    }, isEqual);
    lastInput = input;
    if (!shallowEqual(newResult, lastResult)) {
      lastResult = newResult;
    }
    return lastResult;
  };
};

export default memoizeMapValues;

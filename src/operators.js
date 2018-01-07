import get from 'lodash/get';
import filter from 'lodash/filter';
import {
  createSelector,
} from 'reselect';
import {
  constant,
  identity,
} from './utils';

export const $add = (...selectors) => createSelector(
  ...selectors,
  (...args) => args.reduce((x, y) => x + y, 0),
);

export const $sub = (selectX, selectY) => createSelector(
  selectX,
  selectY,
  (x, y) => x - y,
);

export const $lt = (selectX, selectY) => createSelector(
  selectX,
  selectY,
  (x, y) => x < y,
);

export const $gt = (selectX, selectY) => createSelector(
  selectX,
  selectY,
  (x, y) => x > y,
);

export const $if = (selectX, selectY, selectZ) => (...args) => {
  const condition = selectX(...args);
  if (condition) {
    return selectY(...args);
  }
  return selectZ(...args);
};

export const $filter = (selectX, selectY) => createSelector(
  selectX,
  selectY,
  (x, y) => filter(x, y),
);

export const $value = identity;
export const $evaluate = (...selectors) => createSelector(
  ...selectors,
  (func, ...args) => func(...args),
);

export const $arg = (selectIndex, selectKey = constant(null)) => createSelector(
  (...args) => args,
  selectIndex,
  selectKey,
  (args, index, key) => (key ? get(args[index], key) : args[index]),
);

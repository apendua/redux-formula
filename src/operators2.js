import map from 'lodash/map';
import filter from 'lodash/filter';
import {
  identity,
} from './utils';

export const createUnary = op => scope => selectX => scope.createSelector2(selectX, op);
export const createBinary = op => scope => (selectX, selectY) => scope.createSelector2(selectX, selectY, op);

export const createAssociative = op => scope => (...argsSelectors) => scope.createSelector2(
  ...argsSelectors,
  (...args) => args.reduce(op),
);

export const $add = createAssociative((x, y) => x + y, 0);
export const $sub = createBinary((x, y) => x - y);
export const $lt = createBinary((x, y) => x < y);
export const $gt = createBinary((x, y) => x < y);

export const $if = scope => (selectX, selectY, selectZ) => scope.createSelector3(
  scope.invert(selectX),
  scope.invert(selectY),
  scope.invert(selectZ),
  (x, y, z) => (x() ? y() : z()),
);

export const $filter = createBinary((x, y) => filter(x, y));
export const $map = createBinary((x, y) => map(x, y));
export const $value = createUnary(identity);

export const $evaluate = scope => (...inputSelectors) => scope.createSelector2(
  ...inputSelectors,
  (f, ...args) => f(...args),
);

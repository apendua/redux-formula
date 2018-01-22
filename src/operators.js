import map from 'lodash/map';
import filter from 'lodash/filter';
import {
  identity,
} from './utils';

export const createUnary = op => scope =>
  selectX => scope.boundSelector(selectX, op);

export const createBinary = op => scope =>
  (selectX, selectY) => scope.boundSelector(selectX, selectY, op);

export const createAssociative = op => scope =>
  (...selectors) => scope.boundSelector(
    ...selectors,
    (...args) => args.reduce(op),
  );

export const $add = createAssociative((x, y) => x + y, 0);
export const $sub = createBinary((x, y) => x - y);
export const $lt = createBinary((x, y) => x < y);
export const $gt = createBinary((x, y) => x < y);

export const $if = scope => (selectX, selectY, selectZ) => scope.boundSelector(
  scope.indirect(selectX),
  scope.indirect(selectY),
  scope.indirect(selectZ),
  (x, y, z) => (x() ? y() : z()),
);

export const $filter = createBinary((x, y) => filter(x, y));
export const $map = createBinary((x, y) => map(x, y));
export const $value = createUnary(identity);

export const $evaluate = scope => (...selectors) => scope.boundSelector(
  ...selectors,
  (f, ...args) => f(...args),
);

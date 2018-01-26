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

export const $sum = createAssociative((x, y) => x + y);
export const $prod = createAssociative((x, y) => x * y);
export const $pow = createBinary((x, y) => x ** y);
export const $add = createBinary((x, y) => x + y);
export const $sub = createBinary((x, y) => x - y);
export const $mul = createBinary((x, y) => x * y);
export const $div = createBinary((x, y) => x / y);
export const $mod = createBinary((x, y) => x % y);
export const $eq = createBinary((x, y) => x === y);
export const $neq = createBinary((x, y) => x !== y);
export const $lt = createBinary((x, y) => x < y);
export const $gt = createBinary((x, y) => x > y);
export const $lte = createBinary((x, y) => x <= y);
export const $gte = createBinary((x, y) => x >= y);
export const $not = createUnary(x => !x);
export const $xor = createBinary((x, y) => (x && !y) || (!x && y));
export const $and = scope => (
  selectX,
  selectY,
) => scope.boundSelector(
  scope.indirect(selectX),
  scope.indirect(selectY),
  (x, y) => x() && y(),
);
export const $or = scope => (
  selectX,
  selectY,
) => scope.boundSelector(
  scope.indirect(selectX),
  scope.indirect(selectY),
  (x, y) => x() || y(),
);

export const $if = scope => (
  selectX,
  selectY,
  selectZ,
) => scope.boundSelector(
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

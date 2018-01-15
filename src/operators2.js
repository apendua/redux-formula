import get from 'lodash/get';
import filter from 'lodash/filter';
import {
  createSelector,
} from 'reselect';
import {
  identity,
} from './utils';

export const createUnary = op => scope => (selectX) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      selectX,
      x => op(x),
    );
  }
  return createSelector(
    selectX,
    x => (...args) => op(x(...args)),
  );
};

export const createBinary = op => scope => (selectX, selectY) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      selectX,
      selectY,
      (x, y) => op(x, y),
    );
  }
  return createSelector(
    selectX,
    selectY,
    (x, y) => (...args) => op(x(...args), y(...args)),
  );
};

export const createAssociative = (op, initial) => scope => (...argsSelectors) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      ...argsSelectors,
      (...args) => args.reduce((x, y) => x + y, initial),
    );
  }
  return createSelector(
    ...argsSelectors,
    (...args) => ((...a) => args.reduce((total, x) => op(total, x(...a)), initial)),
  );
};

export const $add = createAssociative((x, y) => x + y, 0);
export const $sub = createBinary((x, y) => x - y);
export const $lt = createBinary((x, y) => x < y);
export const $gt = createBinary((x, y) => x < y);

export const $if = scope => (selectX, selectY, selectZ) => {
  if (!scope.hasUnknowns()) {
    return (...args) => {
      const condition = selectX(...args);
      if (condition) {
        return selectY(...args);
      }
      return selectZ(...args);
    };
  }
  return (...args) => {
    const condition = selectX(...args);
    return (...a) => {
      if (condition(...a)) {
        return selectY(...args)(...a);
      }
      return selectZ(...args)(...a);
    };
  };
};

export const $filter = createBinary((x, y) => filter(x, y));
export const $value = createUnary(identity);

export const $arg = scope => (selectX, selectY) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      (...args) => args,
      selectX,
      selectY,
      (args, x, y) => (y ? get(args[x], y) : args[x]),
    );
  }
  return createSelector(
    (...args) => args,
    selectX,
    selectY,
    (args, x, y) => (...a) => (y ? get(args[x(...a)], y(...a)) : args[x(...a)]),
  );
};

export const $evaluate = scope => (selectFunc, ...argsSelectors) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      selectFunc,
      ...argsSelectors,
      (f, ...args) => f(...args),
    );
  }
  return createSelector(
    selectFunc,
    ...argsSelectors,
    (f, ...args) => (...a) => f(...a)(...args.map(arg => arg(...a))),
  );
};

import map from 'lodash/map';
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
    x => unknowns => op(x(unknowns)),
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
    (...args) => (unknowns => args.reduce((total, x) => op(total, x(unknowns)), initial)),
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
    return (unknowns) => {
      if (condition(unknowns)) {
        return selectY(...args)(unknowns);
      }
      return selectZ(...args)(unknowns);
    };
  };
};

export const $filter = createBinary((x, y) => filter(x, y));
export const $map = createBinary((x, y) => map(x, y));
export const $value = createUnary(identity);

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
    (f, ...args) => unknowns => f(unknowns)(...args.map(arg => arg(unknowns))),
  );
};

import get from 'lodash/get';
import filter from 'lodash/filter';
import {
  createSelector,
} from 'reselect';
import {
  identity,
} from './utils';

export const createUnary = op => scope => createSelectX => (stack) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      createSelectX(stack),
      x => op(x),
    );
  }
  return createSelector(
    createSelectX(stack),
    x => (...args) => op(x(...args)),
  );
};

export const createBinary = op => scope => (createSelectX, createSelectY) => (stack) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      createSelectX(),
      createSelectY(),
      (x, y) => op(x, y),
    );
  }
  return createSelector(
    createSelectX(stack),
    createSelectY(stack),
    (x, y) => (...args) => op(x(...args), y(...args)),
  );
};

export const createAssociative = (op, initial) => scope => (...selectArgsCreators) => (stack) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      ...selectArgsCreators.map(create => create(scope)),
      (...args) => args.reduce((x, y) => x + y, initial),
    );
  }
  return createSelector(
    ...selectArgsCreators.map(create => create(stack)),
    (...args) => ((...a) => args.reduce((total, x) => op(total, x(...a)), initial)),
  );
};

export const $add = createAssociative((x, y) => x + y, 0);
export const $sub = createBinary((x, y) => x - y);
export const $lt = createBinary((x, y) => x < y);
export const $gt = createBinary((x, y) => x < y);

// export const $if = (selectX, selectY, selectZ) => (...args) => {
//   const condition = selectX(...args);
//   if (condition) {
//     return selectY(...args);
//   }
//   return selectZ(...args);
// };

export const $filter = createBinary((x, y) => filter(x, y));
export const $value = createUnary(identity);

export const $arg = scope => (createSelectX, createSelectY) => (stack) => {
  if (!scope.hasUnknowns()) {
    return createSelector(
      (...args) => args,
      createSelectX(),
      createSelectY(),
      (args, x, y) => (y ? get(args[x], y) : args[x]),
    );
  }
  return createSelector(
    (...args) => args,
    createSelectX(stack),
    createSelectY(stack),
    (args, x, y) => (...a) => (y ? get(args[x(...a)], y(...a)) : args[x(...a)]),
  );
};

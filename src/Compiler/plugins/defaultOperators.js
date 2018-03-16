import filter from 'lodash/filter';
import reduce from 'lodash/reduce';
import sortBy from 'lodash/sortBy';
import memoizeMapValues from '../../utils/memoizeMapValues';

export const createUnary = op => scope =>
  () => selectX => scope.boundSelector(selectX, op);

export const createBinary = op => scope =>
  () => (selectX, selectY) => scope.boundSelector(selectX, selectY, op);

export const createAssociative = op => scope =>
  () => (...selectors) => scope.boundSelector(
    ...selectors,
    (...args) => args.reduce(op),
  );

export const $dot = createAssociative((x, y) => x && x[y]);
export const $sum = createAssociative((x, y) => x + y);
export const $prod = createAssociative((x, y) => x * y);
export const $pow = createBinary((x, y) => x ** y);
export const $neg = createUnary(x => -x);
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
export const $and = scope => () => (
  selectX,
  selectY,
) => scope.boundSelector(
  scope.indirect(selectX),
  scope.indirect(selectY),
  (x, y) => x() && y(),
);
export const $or = scope => () => (
  selectX,
  selectY,
) => scope.boundSelector(
  scope.indirect(selectX),
  scope.indirect(selectY),
  (x, y) => x() || y(),
);

export const $if = scope => () => (
  selectX,
  selectY,
  selectZ,
) => scope.boundSelector(
  scope.indirect(selectX),
  scope.indirect(selectY),
  scope.indirect(selectZ),
  (x, y, z) => (x() ? y() : z()),
);

export const $unless = scope => () => (
  selectX,
  selectY,
  selectZ,
) => scope.boundSelector(
  scope.indirect(selectX),
  scope.indirect(selectY),
  scope.indirect(selectZ),
  (x, y, z) => (x() ? z() : y()),
);

export const $filter = createBinary((x, y) => filter(x, y));
export const $reduce = createBinary((x, y) => reduce(x, y));
export const $sort = scope => selectOptions => selectX => scope.boundSelector(
  selectX,
  selectOptions,
  (x, options) => sortBy(x, options.key),
);

export const $map = scope => selectOptions => (selectInput, selectMapValue) => {
  const selectMapping = scope.boundSelector(
    selectMapValue,
    scope.boundSelector(
      selectOptions,
      options => options.key,
    ),
    (mapOneValue, getKey) => memoizeMapValues(mapOneValue, getKey),
  );
  return scope.boundSelector(
    selectMapping,
    selectInput,
    (x, y) => x(y),
  );
};

export const $call = scope => () => (selectFunc, ...argsSelectors) => scope.boundSelector(
  selectFunc,
  ...argsSelectors,
  (func, ...args) => func(...args),
);

const pluginDefaultOperators = {
  createOperators: ({ opearatos }) => ({
    $dot,
    $sum,
    $prod,
    $pow,
    $neg,
    $add,
    $sub,
    $mul,
    $div,
    $mod,
    $eq,
    $neq,
    $lt,
    $gt,
    $lte,
    $gte,
    $not,
    $xor,
    $and,
    $or,
    $if,
    $unless,
    $reduce,
    $filter,
    $map,
    $sort,
    $call,
    ...opearatos,
  }),
};

export default pluginDefaultOperators;

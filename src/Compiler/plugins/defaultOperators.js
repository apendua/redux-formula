import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';

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

export const $match = scope => () => (...selectors) => scope.boundSelector(
  ...selectors.map(selector => scope.indirect(selector)),
  (...args) => {
    const n = args.length;
    for (let i = 0; i < n; i += 2) {
      if (args[i] && args[i]()) {
        return args[i + 1] ? args[i + 1]() : null;
      }
    }
    return null;
  },
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
export const $sort = scope => selectOptions => selectX => scope.boundSelector(
  selectX,
  selectOptions,
  (x, options) => sortBy(x, options.key),
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
    $filter,
    $sort,
    $match,
    ...opearatos,
  }),
};

export default pluginDefaultOperators;

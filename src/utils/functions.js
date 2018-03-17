export const identity = x => x;
export const constant = x => () => x;
export const argument = i => (...args) => args[i];

export const createConstantFunctor = (order) => {
  if (order === 0) {
    return identity;
  }
  const next = createConstantFunctor(order - 1);
  return x => constant(next(x));
};

export const lift = (a, b) => {
  if (b === 0) {
    return identity;
  }
  if (a === 0) {
    return f => createConstantFunctor(b)(f);
  }
  const next = lift(a - 1, b);
  return f => (...args) => next(f(...args));
};

export const lift2 = g => (...args) => {
  const v = g(...args);
  return unknowns => () => v()(unknowns);
};

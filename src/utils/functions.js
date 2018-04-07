export const identity = x => x;
export const constant = x => () => x;
export const argument = (i, k) => {
  if (!k) {
    return (...args) => args[i];
  }
  return (...args) => args[i] && args[i][k];
};

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

/*
  F0(f) = v => f
  F1(f) = v => () => f(v)                          // v => F0(f(v))
  F2(f) = v => x => () => f(v)(x)                  // v => F1(f(v))
  F3(f) = v => x => y => () => f(v)(x)(y)          // v => F2(f(v))
  F4(f) = v => x => y => z => () => f(v)(x)(y)(z)
*/
export const liftA = (a) => {
  if (a === 1) {
    return f => (...args) => () => f(...args);
  }
  return f => (...args) => liftA(a - 1)(f(...args));
};

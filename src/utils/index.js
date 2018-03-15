export const constant = x => () => x;
export const identity = x => x;

export const split = (path) => {
  const index = path.indexOf('.');
  if (index < 0) {
    return [path];
  }
  return [path.substr(0, index), path.substr(index + 1)];
};

export const defaultIsEqual = (a, b) => a === b;

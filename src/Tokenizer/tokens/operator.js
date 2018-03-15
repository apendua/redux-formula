import {
  TOKEN_TYPE_OPERATOR,
  DEFAULT_OPERATORS,
} from '../../constants';

export default function operator({
  operators = DEFAULT_OPERATORS,
} = {}) {
  const prefixes = {};
  operators.forEach((str) => {
    const n = str.length;
    for (let i = 1; i <= n; i += 1) {
      const k = str.substr(0, i);
      if (!prefixes[i]) {
        prefixes[i] = {};
      }
      prefixes[i][k] = true;
    }
  });
  return {
    accept({ index, value }, c) {
      return !!prefixes[index + 1] && prefixes[index + 1][value + c];
    },
    create({ value }) {
      return {
        value,
        type: TOKEN_TYPE_OPERATOR,
      };
    },
  };
}

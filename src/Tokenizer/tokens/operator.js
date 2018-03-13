import {
  TOKEN_TYPE_OPERATOR,
  DEFAULT_OPERATOR_PREFIXES,
  DEFAULT_OPERATOR_SUFFIXES,
} from '../../core/constants';

export default function operator({
  operators: [prefixes, suffixes] = [
    DEFAULT_OPERATOR_PREFIXES,
    DEFAULT_OPERATOR_SUFFIXES,
  ],
} = {}) {
  const map1 = {};
  prefixes.split('').forEach((c) => {
    map1[c] = true;
  });
  const map2 = {};
  suffixes.split('').forEach((c) => {
    map2[c] = true;
  });
  return {
    accept({ index }, c) {
      if (index === 0) {
        return !!map1[c];
      }
      return !!map2[c];
    },
    create({ value }) {
      return {
        value,
        type: TOKEN_TYPE_OPERATOR,
      };
    },
  };
}

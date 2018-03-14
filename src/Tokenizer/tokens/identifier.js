import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_KEYWORD,
} from '../../constants';

export default function identifier({
  keywords = [],
} = {}) {
  const keys = {};
  keywords.forEach((k) => {
    keys[k] = k;
  });
  return {
    accept({ index }, c) {
      if (c === '_' || c === '$' || c === '@' || c === '^' || c === '~') {
        return true;
      }
      if (index > 0 && c >= '0' && c <= '9') {
        return true;
      }
      return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    },
    create({ value }) {
      if (keys[value]) {
        return {
          value,
          type: TOKEN_TYPE_KEYWORD,
        };
      }
      return {
        value,
        type: TOKEN_TYPE_IDENTIFIER,
      };
    },
  };
}

/* eslint no-param-reassign: "off" */
import {
  TOKEN_TYPE_LITERAL,
  VALUE_TYPE_DECIMAL,
  VALUE_TYPE_INTEGER,
} from '../../constants';

export default function number() {
  return {
    accept({ index, state, ahead }, c) {
      if (index === 0) {
        // Either starts with a positive digit, or with 0
        // followed by non-digit.
        return (c >= '1' && c <= '9') ||
          (c === '0' && !(ahead >= '0' && ahead <= '9'));
      }
      if (!state.dot) {
        if (c === '.' && ahead >= '0' && ahead <= '9') {
          state.dot = true;
          return true;
        }
      }
      return c >= '0' && c <= '9';
    },
    create(ctx) {
      const value = parseFloat(ctx.value);
      return {
        value,
        valueType: ctx.state.dot
          ? VALUE_TYPE_DECIMAL
          : VALUE_TYPE_INTEGER,
        type: TOKEN_TYPE_LITERAL,
      };
    },
  };
}

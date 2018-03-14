import {
  TOKEN_TYPE_WHITESPACE,
} from '../../constants';

export default function whitespace() {
  return {
    accept(ctx, c) {
      return c === ' ' || c === '\t' || c === '\n' || c === '\r';
    },
    create(ctx) {
      return {
        type: TOKEN_TYPE_WHITESPACE,
        value: ctx.value,
      };
    },
  };
}

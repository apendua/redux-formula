import {
  parser,
} from '../Parser';
import {
  tokenizer,
} from '../Tokenizer';
import { TOKEN_TYPE_LITERAL } from '../constants';

const parse = (code) => {
  const tokens = tokenizer.tokenize(code);
  return parser.parse(tokens);
};

const P = (strings, ...values) => {
  const tokens = [];
  const n = strings.length;
  for (let i = 0; i < n; i += 1) {
    if (strings[i]) {
      tokens.push(...tokenizer.tokenize(strings[i]));
    }
    if (i < values.length) {
      tokens.push({
        type: TOKEN_TYPE_LITERAL,
        value: values[i],
      });
    }
  }
  return parser.parse(tokens);
};

const F = (args, func) => ({
  '<<': args,
  '>!': func,
});

export default parse;
export {
  F,
  P,
};

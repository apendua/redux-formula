import Tokenizer from './Tokenizer';
import {
  identifier,
  number,
  operator,
  string,
  whitespace,
  lineComment,
} from './tokens';

const tokenizer = new Tokenizer({
  plugins: [
    identifier,
    number,
    operator,
    string,
    whitespace,
    lineComment,
  ],
});

const tokenize = text => tokenizer.tokenize(text);

export {
  tokenizer,
  tokenize,
};

export default Tokenizer;

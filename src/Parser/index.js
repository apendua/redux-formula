import Parser from './Parser';

const parser = new Parser();
const parse = code => parser.parse(code);

export default Parser;
export {
  parser,
  parse,
};

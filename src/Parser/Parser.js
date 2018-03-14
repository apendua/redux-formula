import Scope from './Parser.Scope';
import Token from './Parser.Token';
import Context from './Parser.Context';
import { TOKEN_TYPE_END } from '../core/constants';
import { ParseError } from '../core/errors';

export default class Parser {
  constructor(plugins = []) {
    this.plugins = plugins;
    this.grammar = new Scope();
    this.Context = class ParserContext extends this.constructor.Context {};
    this.plugins.forEach(plugin => plugin(this));
  }

  token(id) {
    const token = this.grammar.get(id);
    if (token) {
      return token;
    }
    return this.grammar.define(id, new Token(id));
  }

  parse(tokens, globals) {
    const symbols = this.grammar.child(globals);
    const context = new this.Context({
      tokens,
      symbols,
    });
    const parsed = context.expression();
    if (context.look(1).id !== TOKEN_TYPE_END) {
      throw new ParseError(`Expected end, got ${context.look(1).id}`);
    }
    return parsed;
  }
}

Parser.Scope = Scope;
Parser.Token = Token;
Parser.Context = Context;

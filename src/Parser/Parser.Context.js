import isArray from 'lodash/isArray';
import indexOf from 'lodash/indexOf';

import { ParseError } from '../errors';
import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_KEYWORD,
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_WHITESPACE,
  TOKEN_TYPE_LINE_COMMENT,
  TOKEN_TYPE_END,
} from '../constants';

import Token from './Parser.Token';
import Scope from './Parser.Scope';

class Context {
  constructor({
    order = 1,
    lines = [],
    tokens = [],
    symbols = new Scope(),
  } = {}) {
    Object.assign(this, {
      order,
      lines,
      tokens,
      symbols,
    });

    this.index = -1;
    this.queue = [null];

    for (let i = 0; i < order; i += 1) {
      this.queue.push(null);
    }

    for (let i = 0; i < order; i += 1) {
      this.advance();
    }
  }

  /**
   * Return one of the upcoming symbols.
   */
  look(offset) {
    if (offset > this.order) {
      throw new Error('Look ahead offset too large.');
    }
    return this.queue[offset];
  }

  tuple({
    separator = ',',
    end,
    id,
    bp,
    map = ({ value, type }) => ({ value, type }),
  }) {
    if (!end && !id && !separator) {
      throw new Error('Tuple requires either "end", "separator" or "id" specified');
    }
    const tuple = [];
    let isEnd;
    if (end) {
      isEnd = () => this.look(1).id === end;
    } else if (id) {
      if (isArray(id)) {
        isEnd = () => indexOf(id, this.look(1).id) < 0;
      } else {
        isEnd = () => this.look(1).id !== id;
      }
    } else {
      isEnd = () => false;
    }
    while (!isEnd()) {
      if (id) {
        if (isArray(id)) {
          tuple.push(map(this.advance()));
        } else {
          tuple.push(map(this.advance(id)));
        }
      } else {
        tuple.push(this.expression(bp));
      }
      if (separator) {
        if (this.look(1).id === separator) {
          this.advance(separator);
        } else {
          break;
        }
      }
    }
    if (end) {
      this.advance(end);
    }
    return tuple;
  }

  /**
   * Consume the expression based on operator precedence.
   * @param {Number} rbp - right binding power
   * @returns {*} - parsed ast
   */
  expression(rbp = 0) {
    let left = this
      .advance()
      .resolve('prefix', this, this.look(0));

    while (rbp < this.look(1).lbp) {
      left = this
        .advance()
        .resolve('infix', this, this.look(0), left);
    }
    return left;
  }

  /**
   * Try to find a language symbol representation of
   * the given token. If no symbol is found generate
   * a new one. This would probably result in further
   * parser error, but that's fine.
   *
   * Throws parse error if token is of unknown type.
   */
  recognizeToken({ type, value, ...other }) {
    let base;

    switch (type) {
      case TOKEN_TYPE_KEYWORD:
      case TOKEN_TYPE_IDENTIFIER:
        base = this.symbols.lookup(value) ||
               this.symbols.lookup(TOKEN_TYPE_IDENTIFIER) ||
               new Token(TOKEN_TYPE_IDENTIFIER);
        break;

      case TOKEN_TYPE_LITERAL:
        base = this.symbols.lookup(TOKEN_TYPE_LITERAL) ||
               new Token(TOKEN_TYPE_LITERAL);
        break;

      case TOKEN_TYPE_OPERATOR:
        base = this.symbols.lookup(value) ||
               new Token(value, { unknown: true });
        break;

      case TOKEN_TYPE_LINE_COMMENT:
        base = this.symbols.lookup(TOKEN_TYPE_LINE_COMMENT) ||
               new Token(TOKEN_TYPE_LINE_COMMENT, { ignored: true });
        break;

      case TOKEN_TYPE_WHITESPACE:
        base = this.symbols.lookup(TOKEN_TYPE_WHITESPACE) ||
               new Token(TOKEN_TYPE_WHITESPACE, { ignored: true });
        break;

      default:
        throw this.error(`Unknown token ${type}: ${value}`, other);
    }

    return Object.assign(Object.create(base), { type, value, context: this }, other);
  }

  /**
   * Test this list of upcoming symbols against the provided
   * identifiers. Only return true, if all symbols matches
   * the given identifiers. Testing starts from the next
   * symbol, not from the current one.
   */
  match(...IDs) {
    if (IDs.length > this.order) {
      throw new Error(`A parser of order ${this.order} cannot lookahead ${IDs.length} tokens.`);
    }

    // NOTE: `this.queue` is of length `this.order+1`
    for (let i = 0; i < IDs.length; i += 1) {
      if (this.queue[i + 1].id !== IDs[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Advance is the main building block of the parsing strategy.
   * It moves the "cursor" forward by one and returns the current
   * symbol as long as it can be properly recognized. It also
   * updates the "ahead" property.
   */
  advance(id) {
    this.index += 1;

    // The following condition should be equivalent to saying that
    // this.look(0).id === TOKEN_TYPE_END
    if (this.index > this.tokens.length + this.order) {
      throw this.error('Unexpected end of input.');
    }

    // Analize the new token
    let token;
    if (this.index < this.tokens.length) {
      token = this.recognizeToken(this.tokens[this.index]);
    } else if (this.index === this.tokens.length) {
      token = this.symbols.lookup(TOKEN_TYPE_END) || new Token(TOKEN_TYPE_END);
    } else {
      token = null;
    }

    // Skip this symbol if it's ignored
    if (token && token.ignored) {
      return this.advance(id);
    }

    // Perform a "move" in the symbols queue
    this.queue.push(token);
    this.queue.shift();

    if (this.queue[0]) {
      if (id && this.queue[0].id !== id) {
        throw this.error(`Expected ${id}, got ${this.queue[0].id}.`);
      }

      if (this.queue[0].unknown) {
        throw this.error(`Unknown symbol: ${this.queue[0].value}.`);
      }
    }
    return this.queue[0];
  }

  /**
   * Creates an instance of ParseError with token metadata.
   * @param {String} message
   * @param {Object} options
   * @param {Number} options.from
   * @param {Number} options.to
   * @param {Number} options.line
   * @returns {ParseError}
   */
  error(message, { from, to, line } = this.look(0) || {}) {
    return new ParseError(message, {
      from,
      to,
      line,
      lineContent: this.lines[line],
    });
  }
}

export default Context;

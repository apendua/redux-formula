import { ParseError } from '../errors';

export default class Token {
  constructor(id, {

    lbp = 0,
    rules = {},
    unknown = false,
    ignored = false,
    type = null,
    value = null,
    original = null,

  } = {}) {
    Object.assign(this, {
      id,
      lbp,
      rules,
      unknown,
      ignored,
      type,
      value,
      original,
    });
  }

  error(message) {
    if (this.context) {
      return this.context.error(message, this);
    }
    return new ParseError(message);
  }

  /**
   * Use rules attached to this token to parse it in the given
   * position. Return the first valid "ast".
   */
  resolve(pos, ...args) {
    if (this.rules[pos]) {
      const n = this.rules[pos].length;
      for (let i = 0; i < n; i += 1) {
        const rule = this.rules[pos][i];
        const ast = rule(...args);
        if (ast) {
          return ast;
        }
      }
    }
    throw this.error(`Unexpected ${pos} symbol ${this.id}.`);
  }

  // TODO: Add tests for this method!
  copy({ type = this.type, value = this.value } = {}) {
    const {
      id,
      lbp,
      rules,
      unknown,
      ignored,
    } = this;
    return new this.constructor(id, {
      lbp,
      rules,
      unknown,
      ignored,
      type,
      value,
      original: this,
    });
  }

  setBindingPower(lbp) {
    this.lbp = Math.max(this.lbp, lbp);
    return this;
  }

  ifUsedAsPrefix(rule) {
    return this.ifUsedAs('prefix', rule);
  }

  ifUsedAsInfix(rule) {
    return this.ifUsedAs('infix', rule);
  }

  canBeUsedAsPrefix() {
    return this.canBeUsedAs('prefix');
  }

  canBeUsedAsInfix() {
    return this.canBeUsedAs('infix');
  }

  canBeUsedAs(pos) {
    return !!this.rules[pos] && this.rules[pos].length > 0;
  }

  ifUsedAs(pos, rule) {
    if (!this.rules[pos]) {
      this.rules[pos] = [];
    }
    this.rules[pos].push(rule);
    return this;
  }
}

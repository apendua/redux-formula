export default class Scope {
  constructor(parent, newSymbols) {
    this.symbols = {};
    if (newSymbols) {
      Object.assign(this.symbols, newSymbols);
    }
    if (parent && !(parent instanceof Scope)) {
      throw new Error('Scope parent must be an instanceof Scope.');
    }
    this.parent = parent;
  }

  get(key) {
    return this.symbols[key];
  }

  remove(key) {
    delete this.symbols[key];
  }

  define(key, value) {
    this.symbols[key] = value;
    return value;
  }

  lookup(name) {
    let scope = this;
    while (scope) {
      if (scope.symbols[name]) {
        return scope.symbols[name];
      }
      scope = scope.parent;
    }
    return undefined;
  }

  child(newSymbols) {
    return new this.constructor(this, newSymbols);
  }
}

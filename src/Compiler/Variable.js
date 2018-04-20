import Selector from './Selector';

class Variable {
  constructor(definition) {
    Object.assign(this, definition);
  }

  get selector() {
    if (!this.createSelector) {
      throw new Error(`Variable ${this.name} cannot be used as selector`);
    }
    let selector = this.createSelector(this.scope);
    if (typeof selector === 'function') {
      selector = this.scope.relative(selector);
    } else if (!(selector instanceof Selector)) {
      throw new Error(`Expected selector, got ${typeof selector}`);
    }
    Object.defineProperty(this, 'selector', { value: selector });
    return this.selector;
  }

  get teleport() {
    if (!this.createTeleport) {
      throw new Error(`Variable ${this.name} cannot be used as teleport`);
    }
    const teleport = this.createTeleport(this.scope);
    Object.defineProperty(this, 'teleport', { value: teleport });
    return this.teleport;
  }

  get operator() {
    if (!this.createOperator) {
      throw new Error(`Variable ${this.name} cannot be used as operator`);
    }
    const operator = this.createOperator(this.scope);
    Object.defineProperty(this, 'operator', { value: operator });
    return this.operator;
  }

  get getProperty() {
    if (!this.createGetProperty) {
      throw new Error(`Variable ${this.name} cannot be used as namepsace`);
    }
    const getProperty = this.createGetProperty(this.scope);
    Object.defineProperty(this, 'getProperty', { value: getProperty });
    return this.getProperty;
  }
}

export default Variable;

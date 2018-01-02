import mapValues from 'lodash/mapValues';

class Scope {
  constructor(parent) {
    this.parent = parent;
    this.variables = {};
  }

  create(props) {
    const newScope = new this.constructor(this);
    return Object.assign(newScope, props);
  }

  lookup(name) {
    let scope = this;
    while (scope) {
      if (scope.variables[name]) {
        return scope.variables[name];
      }
      scope = scope.parent;
    }
    return null;
  }

  define(name, deps, factory) {
    if (this.variables[name]) {
      throw new Error(`${name} defined multiple times`);
    }
    this.variables[name] = {
      name,
      deps,
      factory,
      scope: this,
      state: 'initial',
    };
  }

  resolve(name, stack = [name]) {
    const variable = this.lookup(name);
    if (!variable) {
      throw new Error(`Unknown dependency: ${name}`);
    }
    if (variable.scope !== this) {
      // Ensure variable is resolved by the original scope of definition.
      return variable.scope.resolve(name);
    }
    if (variable.state === 'resolving') {
      throw new Error(`Circular dependency: ${stack.join(' -> ')}`);
    }
    if (variable.state === 'initial') {
      variable.state = 'resolving';
      variable.value = variable.factory(mapValues(
        variable.deps,
        depName => this.getValue(depName, [...stack, depName]),
      ));
      variable.state = 'resolved';
    }
    return variable;
  }

  getVariableValue(variable) {
    return this.constructor.defaultGetVariableValue(variable);
  }

  getValue(name, stack) {
    const variable = this.resolve(name, stack);
    if (!variable) {
      return null;
    }
    return this.getVariableValue(variable);
  }

  getAllValues() {
    return mapValues(this.variables, (variable, name) => this.getValue(name));
  }

  static defaultGetVariableValue(variable) {
    return variable.value;
  }
}

export default Scope;

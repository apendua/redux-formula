import filter from 'lodash/filter';
import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import {
  createSelector,
  createStructuredSelector,
} from 'reselect';

class Scope {
  constructor(parent) {
    this.parent = parent;
    this.variables = {};
  }

  create() {
    return new this.constructor(this);
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
    if (deps && deps.length > 0 && !factory) {
      throw new Error(`Unknown "${name}" cannot have any dependencies`);
    }
    this.variables[name] = {
      name,
      deps,
      factory,
      scope: this,
      state: factory ? 'initial' : 'resolved',
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

  getValue(name, stack) {
    const variable = this.resolve(name, stack);
    if (!variable) {
      return null;
    }
    return variable.value;
  }

  getUnknownNames() {
    const inherited = filter(
      this.parent &&
      this.parent.getUnknownNames(),
      name => !this.variables[name],
    );
    return [
      ...inherited,
      ...Object.keys(this.variables).filter(name => !this.variables[name].factory),
    ];
  }

  createSelector(mapUnknowns) {
    const selectors = {};
    this.getUnknownNames().forEach((name) => {
      selectors[name] = unknowns => unknowns[name];
    });
    return createSelector(
      createStructuredSelector(selectors),
      mapUnknowns,
    );
  }

  isUnknown(name) {
    const variable = this.resolve(name);
    return !variable.factory;
  }

  hasUnknowns() {
    const unknowns = this.getUnknownNames();
    return unknowns.length > 0;
  }

  getAllValues() {
    const values = {};
    forEach(this.variables, (variable, name) => {
      if (!this.isUnknown(name)) {
        values[name] = this.getValue(name);
      }
    });
    return values;
  }
}

export default Scope;

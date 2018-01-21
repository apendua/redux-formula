import forEach from 'lodash/forEach';
import some from 'lodash/some';
import mapValues from 'lodash/mapValues';
import {
  createSelector,
} from 'reselect';

const constant = x => () => x;

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
        depName => this.getSelector(depName, [...stack, depName]),
      ));
      variable.state = 'resolved';
    }
    return variable;
  }

  getSelector(name, stack) {
    const variable = this.resolve(name, stack);
    if (!variable) {
      return null;
    }
    if (variable.scope === this) {
      if (variable.factory) {
        return variable.value;
      }
      let selector = constant(unknowns => unknowns[name]);
      let scope = this.parent;
      while (scope) {
        if (scope.hasOwnUnknowns()) {
          selector = constant(selector);
        }
        scope = scope.parent;
      }
      return selector;
    }
    const selector = this.parent.getSelector(name, stack);
    // TODO: Refactor this to "this.createSelector2"
    if (!this.hasOwnUnknowns()) {
      return selector;
    }
    return this.createSelector3(
      selector,
      value => constant(value),
    );
  }

  createSelector3(...args) {
    if (this.parent) {
      return this.parent.createSelector2(...args);
    }
    return createSelector(...args);
  }

  createSelector2(...args) {
    if (this.hasOwnUnknowns()) {
      const funcSelectors = args.slice(0, args.length - 1);
      const generateValue = args[args.length - 1];
      return this.createSelector3(
        ...funcSelectors,
        (...functions) => unknowns => generateValue(...functions.map(f => f(unknowns))),
      );
    }
    return this.createSelector3(...args);
  }

  invert(selector) {
    let f = (...args) => () => selector(...args);
    let scope = this;

    const upgrade = g => (...args) => {
      const v = g(...args);
      return unknowns => () => v()(unknowns);
    };

    while (scope) {
      if (scope.hasOwnUnknowns()) {
        f = upgrade(f);
      }
      scope = scope.parent;
    }
    return f;
  }

  hasOwnUnknowns() {
    return some(this.variables, variable => !variable.factory);
  }

  getAllValues() {
    const values = {};
    forEach(this.variables, (variable, name) => {
      if (variable.factory) {
        values[name] = this.getSelector(name);
      }
    });
    return values;
  }
}

export default Scope;

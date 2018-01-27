import forEach from 'lodash/forEach';
import keys from 'lodash/keys';
import map from 'lodash/map';
import some from 'lodash/some';
import mapValues from 'lodash/mapValues';
import {
  createSelector,
} from 'reselect';
import memoizeMapValues from './memoizeMapValues';

const constant = x => () => x;

const upgrade = g => (...args) => {
  const v = g(...args);
  return unknowns => () => v()(unknowns);
};

const upgrade2 = g => (...args) => constant(g(...args));

class Scope {
  constructor(parent, unknowns = []) {
    this.parent = parent;
    this.variables = {};
    forEach(unknowns, name => this.define(name));
  }

  hasOwnUnknowns() {
    return some(this.variables, variable => variable.unknown);
  }

  create(unknowns) {
    return new this.constructor(this, unknowns);
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

  indirect(selector) {
    let f = (...args) => () => selector(...args);
    let scope = this;
    while (scope) {
      if (scope.hasOwnUnknowns()) {
        f = upgrade(f);
      }
      scope = scope.parent;
    }
    return f;
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
      unknown: !factory,
      scope: this,
      state: factory ? 'initial' : 'resolved',
      value: factory ? null : this.createUnknownSelector(name),
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
      variable.value = variable.factory(this, mapValues(
        variable.deps,
        depName => this.getSelector(depName, [...stack, depName]),
      ));
      variable.state = 'resolved';
    }
    return variable;
  }

  bind(originalSelector) {
    let selector = originalSelector;
    let scope = this;
    while (scope) {
      if (scope.hasOwnUnknowns()) {
        selector = upgrade2(selector);
      }
      scope = scope.parent;
    }
    return selector;
  }

  createUnknownSelector(name) {
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

  parentBoundSelector(...args) {
    if (this.parent) {
      return this.parent.boundSelector(...args);
    }
    return createSelector(...args);
  }

  boundSelector(...args) {
    if (this.hasOwnUnknowns()) {
      const selectors = args.slice(0, args.length - 1);
      const evaluate = args[args.length - 1];
      return this.parentBoundSelector(
        ...selectors,
        (...values) => unknowns => evaluate(...values.map(f => f(unknowns))),
      );
    }
    return this.parentBoundSelector(...args);
  }

  variablesSelector(variables) {
    const selectors = map(variables, name => this.getSelector(name));
    return this.boundSelector(
      ...selectors,
      (...values) => {
        // NOTE: This function is only re-computed if any of the values changes,
        //       so we never create a new object if it's not necessary.
        const object = {};
        forEach(values, (value, index) => {
          const name = variables[index];
          object[name] = value;
        });
        return object;
      },
    );
  }

  getSelector(name, stack) {
    const variable = this.resolve(name, stack);
    if (!variable) {
      return null;
    }
    if (variable.scope === this) {
      return variable.value;
    }
    const selector = this.parent.getSelector(name, stack);
    if (!this.hasOwnUnknowns()) {
      return selector;
    }
    // TODO: Try to understand why "parent bound" and not simply "bound"
    return this.parentBoundSelector(
      selector,
      value => constant(value),
    );
  }
}

export default Scope;

import forEach from 'lodash/forEach';
import map from 'lodash/map';
import some from 'lodash/some';
import mapValues from 'lodash/mapValues';
import Selector, { constant } from './Selector';

class Scope {
  constructor(parent, unknowns = []) {
    this.parent = parent;
    this.variables = {};

    const parentOrder = (parent && parent.order) || 0;
    if (unknowns && unknowns.length > 0) {
      this.order = parentOrder + 1;
    } else {
      this.order = parentOrder;
    }

    forEach(unknowns, name => this.define(name));
  }

  hasOwnUnknowns() {
    return some(this.variables, variable => variable.unknown);
  }

  /**
   * Check if current scope is descendant of the given scope.
   * A scope is not considered a descendant of itself.
   * @param {Scope} parentScope
   */
  isDescendantOf(parentScope) {
    if (!parentScope) {
      return true;
    }
    let scope = this.parent;
    while (scope) {
      if (scope === parentScope) {
        return true;
      }
      scope = scope.parent;
    }
    return false;
  }

  isAncestorOf(scope) {
    return !!(scope && scope.isDescendantOf(this));
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
    return Selector.relativeTo(this, selector).indirect();
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

  bind(selector) {
    return Selector.relativeTo(this, selector);
  }

  createUnknownSelector(name) {
    return new Selector(
      this,
      constant(this.order)(unknowns => unknowns[name]),
    );
  }

  boundSelector(...args) {
    return Selector.create(this, ...args);
  }

  variablesSelector(variables) {
    return this.boundSelector(
      map(variables, name => this.getSelector(name)),
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
    return variable.value;
  }
}

export default Scope;

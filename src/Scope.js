import forEach from 'lodash/forEach';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import Selector, { constant } from './Selector';

const constant1 = constant(1);

class Scope {
  constructor(parent, unknowns = []) {
    this.parent = parent;
    this.variables = {};

    this.parentOrder = (parent && parent.order) || 0;
    if (unknowns && unknowns.length > 0) {
      this.order = this.parentOrder + 1;
    } else {
      this.order = this.parentOrder;
    }

    forEach(unknowns, (name) => {
      this.variables[name] = {
        name,
        scope: this,
        state: 'resolved',
        selector: this.createUnknownSelector(name),
      };
    });
  }

  hasOwnUnknowns() {
    return this.order > this.parentOrder;
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

  lookup(name, lookupLevel = 0) {
    let level = lookupLevel;
    let scope = this;
    while (scope) {
      if (scope.variables[name]) {
        if (level === 0) {
          return scope.variables[name];
        }
        level -= 1;
      }
      scope = scope.parent;
    }
    return null;
  }

  indirect(selector) {
    return Selector.relativeTo(this, selector).indirect();
  }

  relative(selector) {
    return Selector.relativeTo(this, selector);
  }

  define(name, deps, factory) {
    if (!factory) {
      throw new Error(`Missing factory function for variable ${name}`);
    }
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
      state: 'initial',
    };
  }

  resolve(name, stack = [name]) {
    const match = /^(\^*)(.*)/.exec(name);
    if (!match) {
      return null;
    }
    const variable = this.lookup(match[2], match[1].length);
    if (!variable) {
      throw new Error(`Unknown dependency: ${name}`);
    }
    if (variable.scope !== this) {
      // Ensure variable is resolved by the original scope of definition.
      return variable.scope.resolve(variable.name);
    }
    if (variable.state === 'resolving') {
      throw new Error(`Circular dependency: ${stack.join(' -> ')}`);
    }
    if (variable.state === 'initial') {
      variable.state = 'resolving';
      variable.selector = variable.factory(this, mapValues(
        variable.deps,
        depName => this.resolve(depName, [...stack, depName]),
      ));
      variable.state = 'resolved';
    }
    return variable;
  }

  createConstantSelector(value) {
    return Selector.relativeTo(this, constant1(value));
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
      map(variables, name => this.resolve(name).selector),
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
}

export default Scope;

import forEach from 'lodash/forEach';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import Selector, { constant } from './Selector';

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
        value: this.createUnknownSelector(name),
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

  lookup(name, targetLevel = 0) {
    let level = targetLevel;
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
      state: factory ? 'initial' : 'resolved',
      value: factory ? null : this.createUnknownSelector(name),
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

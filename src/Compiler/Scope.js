import forEach from 'lodash/forEach';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import Selector from './Selector';
import {
  constant,
  createConstantFunctor,
} from '../utils/functions';

class Scope {
  constructor(parent, unknowns = [], operators = {}) {
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
        meta: {
          type: 'unknown',
        },
        name,
        scope: this,
        state: 'resolved',
        selector: this.createUnknownSelector(name),
      };
    });

    forEach(operators, (operator, name) => this.operator(name, operator));
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

  create(...args) {
    return new this.constructor(this, ...args);
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

  external(name, selector) {
    this.define(name, {
      createSelector: constant(this.relative(selector)),
    });
  }

  operator(name, createOperator) {
    if (!createOperator) {
      throw new Error(`Missing operator creator for "${name}"`);
    }
    if (this.variables[name] && this.variables[name].createOperator) {
      throw new Error(`Operator "${name}" defined multiple times`);
    }
    if (!this.variables[name]) {
      this.variables[name] = {
        meta: {
          type: 'operator',
        },
        name,
        scope: this,
        state: 'resolved',
        selector: () => {
          throw new Error(`Cannot use operator ${name} as value`);
        },
      };
    }
    this.variables[name].createOperator = createOperator;
  }

  namespace(name, createProperties) {
    if (this.variables[name] && this.variables[name].createOperator) {
      throw new Error(`Operator "${name}" defined multiple times`);
    }
    this.define(name, {
      meta: {
        type: 'namespace',
      },
      createSelector: () => () => {
        throw new Error('Namespace cannot be used as value');
      },
      createGetProperty: (scope) => {
        const newScope = scope.create();
        createProperties(newScope);
        return (propName) => {
          if (!newScope.variables[propName]) {
            throw new Error(`Unknown property ${propName}`);
          }
          return newScope.resolve(propName);
        };
      },     
    });    
  }

  define(name, variable) {
    if (!variable) {
      throw new Error(`Missing configuration object for variable ${name}`);
    }
    // we allow overwriting unknown variable
    if (this.variables[name]) {
      throw new Error(`${name} defined multiple times`);
    }
    this.variables[name] = {
      name,
      scope: this,
      state: 'initial',
      ...variable,
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

      if (variable.createSelector) {
        variable.selector = variable.createSelector(this, mapValues(
          variable.deps,
          depName => this.resolve(depName, [...stack, depName]),
        ));
      }

      if (variable.createGetProperty) {
        variable.getProperty = variable.createGetProperty(this);
      }

      if (typeof variable.selector === 'function') {
        variable.selector = this.relative(variable.selector);
      } else if (!(variable.selector instanceof Selector)) {
        throw new Error(`Variable requires selector, got ${typeof variable.selector}`);
      }

      variable.state = 'resolved';
    }
    return variable;
  }

  createConstantSelector(value) {
    return Selector.relativeTo(this, constant(value));
  }

  createUnknownSelector(name) {
    return new Selector(
      this,
      createConstantFunctor(this.order)(unknowns => unknowns[name]),
    );
  }

  boundSelector(...args) {
    return Selector.create(this, ...args);
  }

  variablesSelector(variables, relativeTo = this) {
    return relativeTo.boundSelector(
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

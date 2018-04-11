import forEach from 'lodash/forEach';
import map from 'lodash/map';
import Selector from './Selector';
import Variable from './Variable';
import {
  constant,
  createConstantFunctor,
} from '../utils/functions';

class Scope {
  constructor(parent, unknowns = [], context) {
    this.parent = parent;
    this.context = context;
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

  lookup(name, level = 0) {
    if (this.context && name.charAt(0) === '$') {
      return this.context.lookup(name, level);
    }
    if (this.variables[name]) {
      if (level === 0) {
        return this.variables[name];
      } else if (this.parent) {
        return this.parent.lookup(name, level - 1);
      }
    } else if (this.parent) {
      return this.parent.lookup(name, level);
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
      this.variables[name] = this.createVariable({
        name,
        meta: {
          type: 'operator',
        },
        state: 'resolved',
      });
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
        throw new Error('Namespace cannot be used as selector');
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
    this.variables[name] = this.createVariable({
      ...variable,
      name,
      state: 'initial',
    });
    return this.variables[name];
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

      // First, ensure all dependencies can be resolved ...
      forEach(
        variable.deps,
        depName => this.resolve(
          depName,
          [...stack, depName],
        ),
      );

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

  createVariable(definition) {
    const scope = this;
    return new Variable({
      scope,
      ...definition,
    });
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

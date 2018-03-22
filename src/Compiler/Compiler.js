import omit from 'lodash/omit';
import forEach from 'lodash/forEach';
import keys from 'lodash/keys';
import isNaN from 'lodash/isNaN';
import Scope from './Scope';
import Selector from './Selector';
import parse from './Compiler.parse';
import {
  argument,
} from '../utils/functions';

const createCompiler = api => () => (expression) => {
  switch (typeof expression) {
    case 'function':
      return {
        meta: {
          type: 'native',
        },
        createSelector: scope => scope.relative(expression),
      };
    case 'string':
      return api.compile(api.parse(expression));
    default: {
      if (api.literal) {
        return api.literal(expression);
      }
      return {
        meta: {
          type: 'unknown',
        },
        createSelector: scope => scope.createConstantSelector(expression),
      };
    }
  }
};

const identity = x => x;

class Compiler {
  constructor({
    scope = new Scope(),
    plugins = [],
    operators = {},
  } = {}) {
    Object.assign(this, {
      scope,
      plugins,
    });
    this.operators = { ...operators };
    this.compilers = [];
    this.api = {
      parse: this.parse.bind(this),
      compile: this.compile.bind(this),
      operators: this.operators,
      createSelector: this.createSelector.bind(this),
    };
    forEach(plugins, this.extendApi.bind(this));
    forEach(plugins, this.extendOperators.bind(this));
    forEach(plugins, this.extendCompiler.bind(this));
  }

  addPlugin(plugin) {
    this.extendApi(plugin);
    this.extendOperators(plugin);
    this.extendCompiler(plugin);
  }

  extendApi(plugin) {
    if (plugin.createApi) {
      Object.assign(this.api, plugin.createApi(this.api));
    }
  }

  extendOperators(plugin) {
    if (plugin.createOperators) {
      const newOperators = plugin.createOperators(this.api);
      forEach(newOperators, (createOperator, operator) => {
        const name = operator.charAt(0) === '$' ? operator.substr(1) : operator;
        this.scope.operator(name, createOperator);
        this.operators[name] = createOperator;
      });
    }
  }

  extendCompiler(plugin) {
    if (plugin.createCompiler) {
      this.compilers.push(plugin.createCompiler(this.api));
      this.compilerNeedsUpdate = true;
    }
  }

  compile(expression) {
    if (this.compiler && !this.compilerNeedsUpdate) {
      return this.compiler(expression);
    }
    this.compilerNeedsUpdate = false;
    this.compiler = [
      ...this.compilers,
      createCompiler(this.api),
    ].reduce((a, b) => next => a(b(next)))(identity);
    return this.compiler(expression);
  }

  define(name, deps, expression) {
    const selector = this.createSelector(expression);
    // Let's forget about this selector metadata.
    delete selector.scope;
    this.scope.define(name, {
      deps,
      createSelector: scope => scope.relative(selector),
    });
  }

  createScope(...args) {
    return this.scope.create(...args);
  }

  parse(text) {
    return this.constructor.parse(text);
  }

  createFormula(expression) {
    const formula = this.compile(expression);
    const indexes = keys(formula.deps)
      .map(name => (name.charAt(0) === '$'
        ? parseInt(name.substr(1), 10)
        : NaN
      ))
      .filter(index => !isNaN(index));
    const otherDeps = omit(formula.deps, indexes.map(i => `$${i}`));
    return {
      toRawSelector: (parentScope = this.scope) => {
        const newScope = parentScope.create();
        // Ensure all dependencies can be resolved
        keys(otherDeps).forEach(key => newScope.resolve(key));
        // If there were any dependencies like $0, $1, etc. interpret them
        // as references to arguments array.
        indexes.forEach(i => newScope.define(`$${i}`, {
          createSelector: scope => scope.relative(argument(i)),
        }));
        const selector = formula.createSelector(newScope);
        if (typeof selector === 'function') {
          return selector;
        } else if (selector instanceof Selector) {
          return selector.toRawSelector();
        }
        throw new Error(`Expected selector, got ${typeof bound}`);
      },
    };
  }

  createSelector(expression) {
    return this.createFormula(expression).toRawSelector();
  }
}

Compiler.parse = parse;

export default Compiler;

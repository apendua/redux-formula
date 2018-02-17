import omit from 'lodash/omit';
import forEach from 'lodash/forEach';
import keys from 'lodash/keys';
import isNaN from 'lodash/isNaN';
import Scope from './Scope';

const constant = x => () => x;

const createCompiler = ({ compile, parse, literal }) => () => (expression) => {
  switch (typeof expression) {
    case 'function':
      return { bindTo: scope => scope.bind(expression) };
    case 'string':
      return compile(parse(expression));
    default: {
      if (literal) {
        return literal(expression);
      }
      return { bindTo: scope => scope.bind(constant(expression)) };
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
      Object.assign(this.operators, plugin.createOperators(this.api));
    }
  }

  extendCompiler(plugin) {
    if (plugin.createCompiler) {
      this.compilers.push(plugin.createCompiler(this.api));
      this.compilerNeedsUpdate = true;
    }
  }

  compile(expression) {
    if (!this.compilerNeedsUpdate) {
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
    this.scope.define(name, deps, scope => scope.bind(selector));
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  createFormula(expression) {
    const formula = this.compile(expression);
    const indexes = keys(formula.deps)
      .map(name => parseInt(name, 10)).filter(index => !isNaN(index));
    const otherDeps = omit(formula.deps, indexes);
    return {
      bindTo: (parentScope = this.scope) => {
        const newScope = parentScope.create();
        // Ensure all dependencies can be resolved
        keys(otherDeps).forEach(key => newScope.resolve(key));
        // If there were any dependencies like $0, $1, etc. interpret them
        // as references to arguments array.
        indexes.forEach(i => newScope.define(`${i}`, [], scope => scope.bind((...args) => args[i])));
        return formula.bindTo(newScope).selector;
      },
    };
  }

  createSelector(expression) {
    return this.createFormula(expression).bindTo();
  }

  static defaultParse(text) {
    switch (text[0]) {
      case '$': return { $: text.substr(1) };
      default: return { '!': text };
    }
  }
}

export default Compiler;

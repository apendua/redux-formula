import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
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
    this.operators = {
      ...operators,
    };
    this.compilers = [];
    this.pluginApi = {
      parse: this.parse.bind(this),
      compile: this.compile.bind(this),
      operators: this.operators,
    };
    forEach(plugins, (plugin) => {
      if (plugin.createApi) {
        Object.assign(this.pluginApi, plugin.createApi({ ...this.pluginApi }));
      }
    });
    forEach(plugins, (plugin) => {
      if (plugin.createOperators) {
        Object.assign(this.operators, plugin.createOperators({ ...this.pluginApi }));
      }
    });
    forEach(plugins, (plugin) => {
      if (plugin.createCompiler) {
        this.compilers.push(plugin.createCompiler({ ...this.pluginApi }));
      }
    });
    this.compileImpl = [
      ...this.compilers,
      createCompiler({ ...this.pluginApi }),
    ].reduce((a, b) => next => a(b(next)))(identity);
  }

  compile(expression) {
    return this.compileImpl(expression);
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  createFormula(expression) {
    const formula = this.compile(expression);
    const indexes = keys(formula.deps)
      .map(name => parseInt(name, 10)).filter(index => !isNaN(index));
    const otherDeps = omit(formula.deps, indexes);
    // TODO: Allow importing from external sources.
    if (!isEmpty(otherDeps)) {
      throw new Error(`Unresolved deps: ${keys(formula.deps).join(', ')}`);
    }
    return {
      bindTo: (parentScope = this.scope) => {
        const newScope = parentScope.create();
        // If there were any dependencies like $0, $1, etc. interpret them
        // as references to arguments array.
        indexes.forEach(i => newScope.define(`${i}`, [], scope => scope.bind((...args) => args[i])));
        return formula.bindTo(newScope);
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

import omit from 'lodash/omit';
import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';
import keys from 'lodash/keys';
import isNaN from 'lodash/isNaN';
import Scope from './Scope';
import * as defaultOperators from './operators';
import pluginLiteral from './plugins/literal';
import pluginArray from './plugins/array';
import pluginMapping from './plugins/mapping';
import pluginReference from './plugins/reference';
import pluginFunction from './plugins/function';
import pluginSubExpression from './plugins/subExpression';

const createCompiler = ({ compile, parse }) => () => (expression) => {
  switch (typeof expression) {
    case 'function':
      return { bindTo: scope => scope.bind(expression) };
    case 'string':
      return compile(parse(expression));
    default:
      return compile({ '!': expression });
  }
};

const identity = x => x;

class Compiler {
  constructor({
    scope = new Scope(),
    plugins = [
      pluginLiteral,
      pluginArray,
      pluginMapping,
      pluginReference,
      pluginFunction,
      pluginSubExpression,
    ],
    operators = {},
  } = {}) {
    Object.assign(this, {
      scope,
      plugins,
    });
    this.operators = {
      ...this.constructor.defaultOperators,
      operators,
    };
    const pluginApi = {
      parse: this.parse.bind(this),
      compile: this.compile.bind(this),
      operators: this.operators,
    };
    forEach(plugins, (plugin) => {
      if (plugin.createApi) {
        Object.assign(pluginApi, plugin.createApi({ ...pluginApi }));
      }
    });
    this.compilers = map(plugins, plugin => plugin.createCompiler({ ...pluginApi }));
    this.compileImpl = [
      ...this.compilers,
      createCompiler(pluginApi),
    ].reduce((a, b) => next => a(b(next)))(identity);
  }

  compile(expression) {
    return this.compileImpl(expression);
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  createSelector(expression) {
    const formula = this.compile(expression);
    const indexes = keys(formula.deps)
      .map(name => parseInt(name, 10)).filter(index => !isNaN(index));
    const otherDeps = omit(formula.deps, indexes);
    if (!isEmpty(otherDeps)) {
      throw new Error(`Unresolved deps: ${keys(formula.deps).join(', ')}`);
    }
    const newScope = this.scope.create();
    // If there were any dependencies like $0, $1, etc. interpret them
    // as references to arguments array.
    indexes.forEach(i => newScope.define(`${i}`, [], scope => scope.bind((...args) => args[i])));
    return formula.bindTo(newScope);
  }

  static defaultParse(text) {
    switch (text[0]) {
      case '$': return { $: text.substr(1) };
      default: return { '!': text };
    }
  }
}

Compiler.defaultOperators = defaultOperators;

export default Compiler;

import has from 'lodash/has';
import get from 'lodash/get';
import map from 'lodash/map';
// import times from 'lodash/times';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
// import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import Scope from './Scope';
import * as defaultOperators from './operators';
import memoizeMapValues from './memoizeMapValues';
import {
  constant,
  split,
  destructure,
} from './utils';

class Compiler {
  constructor() {
    this.scope = new Scope();
    this.compile = this.compile.bind(this);
    this.operators = {
      ...this.constructor.defaultOperators,
      '=': defaultOperators.$value,
      '(': defaultOperators.$evaluate,
    };
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  // eslint-disable-next-line class-methods-use-this
  createLiteral(value, params) {
    if (typeof value === 'function' && params) {
      const compiled = map(params, this.compile);
      return {
        deps: Object.assign(
          {},
          ...map(compiled, 'deps'),
        ),
        bindTo: scope => scope.boundSelector(
          ...map(compiled, x => x.bindTo(scope)),
          (...args) => value(...args),
        ),
      };
    }
    return { bindTo: scope => scope.bind(constant(value)) };
  }

  // eslint-disable-next-line class-methods-use-this
  createArgReference(key) {
    return { bindTo: scope => scope.bind((...args) => get(args, key)) };
  }

  // eslint-disable-next-line class-methods-use-this
  createReference(key) {
    const [name, dataKey] = split(key);
    return {
      deps: { [name]: name },
      bindTo: scope => scope.boundSelector(
        scope.getSelector(name),
        value => (dataKey ? get(value, dataKey) : value),
      ),
    };
  }

  createFunction(params, valueExpr) {
    const value = this.compile(valueExpr);
    const unknowns = [...params, 'this'];
    return {
      deps: omit(value.deps, unknowns),
      bindTo: (scope) => {
        const newScope = scope.create(unknowns);
        return scope.boundSelector(
          value.bindTo(newScope),
          (evaluate) => {
            const f = (...args) => {
              const data = { this: f };
              forEach(args, (v, i) => {
                data[params[i]] = v;
              });
              return evaluate(data);
            };
            return f;
          },
        );
      },
    };
  }

  createMapping(inputExpr, mapValueExpr) {
    const input = this.compile(inputExpr);
    const mapValue = this.compile(mapValueExpr);
    return {
      deps: Object.assign(
        {},
        input.deps,
        mapValue.deps,
      ),
      bindTo: (scope) => {
        const selectMapping = scope.boundSelector(
          mapValue.bindTo(scope),
          mapOneValue => memoizeMapValues(mapOneValue),
        );
        const selectInput = input.bindTo(scope);
        return scope.boundSelector(
          selectMapping,
          selectInput,
          (x, y) => x(y),
        );
      },
    };
  }

  createNewScope(expression) {
    const {
      operator,
      argsExpr,
      variablesExpr,
    } = destructure(expression);
    const variables = mapValues(variablesExpr, this.compile);
    const args = argsExpr
      ? map(argsExpr, this.compile)
      : null;
    const deps = Object.assign(
      {},
      ...map(variables, 'deps'),
      ...map(args, 'deps'),
    );
    const variablesNames = Object.keys(variablesExpr).filter(name => name[0] !== '~');
    return {
      deps: omit(deps, Object.keys(variables).map(name => (name[0] === '~' ? name.substr(1) : name))),
      bindTo: (scope) => {
        const newScope = scope.create();
        const bindOperator = this.operators[operator];
        forEach(variables, (variable, name) => {
          newScope.define(
            name[0] === '~' ? name.substr(1) : name,
            variable.deps,
            variable.bindTo,
          );
        });
        if (bindOperator) {
          return bindOperator(newScope)(...map(args, arg => arg.bindTo(newScope)));
        }
        // TODO: Optimize this!
        const selectors = map(variablesNames, name => newScope.getSelector(name));
        return newScope.boundSelector(
          ...selectors,
          (...funcArgs) => {
            const object = {};
            forEach(funcArgs, (value, i) => {
              const name = variablesNames[i];
              object[name] = value;
            });
            return object;
          },
        );
      },
    };
  }

  compile(expression) {
    switch (typeof expression) {
      case 'function':
        return { bindTo: scope => scope.bind(expression) };
      case 'string':
        return this.compile(this.parse(expression));
      case 'number':
      case 'boolean':
      case 'undefined':
        return this.compile({ '!': expression });
      case 'object': {
        if (!expression) {
          return this.compile({ '!': expression });
        }
        if (isPlainObject(expression)) {
          if (has(expression, '!')) {
            return this.createLiteral(expression['!'], expression['>']);
          }
          if (has(expression, '$')) {
            return this.createReference(expression.$);
          }
          if (has(expression, ':')) {
            return this.createArgReference(expression[':']);
          }
          if (has(expression, '?')) {
            const { '?': params, ...valueExpr } = expression;
            return this.createFunction(params, valueExpr);
          }
          if (has(expression, '->')) {
            const { '<-': inputExpr, '->': mapValueExpr } = expression;
            return this.createMapping(inputExpr, mapValueExpr);
          }
        }
        return this.createNewScope(expression); // array or any other type of object
      }
      default:
        return this.compile({ '!': expression });
    }
  }

  createFormulaSelector(expression) {
    const formula = this.compile(expression);
    if (!isEmpty(formula.deps)) {
      throw new Error(`Unresolved deps: ${values(formula.deps).join(', ')}`);
    }
    return formula.bindTo(this.scope.create());
  }

  static defaultParse(text) {
    switch (text[0]) {
      case ':': return { ':': text.substr(1) };
      case '$': return { $: text.substr(1) };
      default: return { '!': text };
    }
  }
}

Compiler.defaultOperators = defaultOperators;

export default Compiler;

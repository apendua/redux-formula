import has from 'lodash/has';
import get from 'lodash/get';
import map from 'lodash/map';
import invokeMap from 'lodash/invokeMap';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';
import keys from 'lodash/keys';
import isNaN from 'lodash/isNaN';
import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import Scope from './Scope';
import * as defaultOperators from './operators';
import memoizeMapValues from './memoizeMapValues';
import {
  constant,
  split,
  destructure,
  identity,
} from './utils';

class Compiler {
  constructor() {
    this.scope = new Scope();
    this.compile = this.compile.bind(this);
    this.operators = {
      ...this.constructor.defaultOperators,
    };
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  // eslint-disable-next-line class-methods-use-this
  createLiteral(value) {
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

  createMapping(inputExpr, mapValueExpr, keyExpr) {
    const input = this.compile(inputExpr);
    const mapValue = this.compile(mapValueExpr);
    const key = keyExpr ? this.compile(keyExpr) : null;
    return {
      deps: Object.assign(
        {},
        input.deps,
        mapValue.deps,
        key && key.deps,
      ),
      bindTo: (scope) => {
        const selectGetKey = key ? key.bindTo(scope) : scope.bind(constant(null));
        const selectMapping = scope.boundSelector(
          mapValue.bindTo(scope),
          selectGetKey,
          (mapOneValue, getKey) => memoizeMapValues(mapOneValue, getKey),
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

  createSubExpression(varsExpr, argsExpr, bindOperator, operatorName) {
    const vars = mapValues(varsExpr, this.compile);
    const args = argsExpr
      ? map(argsExpr, this.compile)
      : null;
    const deps = Object.assign(
      {},
      ...map(vars, 'deps'),
      ...map(args, 'deps'),
    );
    const allKeys = keys(vars);
    const namesPublic = allKeys.filter(name => name.charAt(0) !== '~');
    const namesPrivate = invokeMap(allKeys.filter(name => name.charAt(0) === '~'), String.prototype.substr, 1);
    return {
      deps: omit(deps, ...namesPublic, ...namesPrivate),
      bindTo: (scope) => {
        const newScope = scope.create();
        forEach(vars, (variable, name) => {
          newScope.define(
            name[0] === '~' ? name.substr(1) : name,
            variable.deps,
            variable.bindTo,
          );
        });
        if (operatorName) {
          let selectEvaluate;
          try {
            selectEvaluate = newScope.getSelector(operatorName);
            return newScope.boundSelector(
              selectEvaluate,
              ...invokeMap(args, 'bindTo', newScope),
              (evaluate, ...rest) => evaluate(...rest),
            );
          } catch (err) {
            const msg = err.toString();
            if (!/Unknown dependency/.test(msg) &&
                !/Circular dependency/.test(msg)
            ) {
              throw err;
            }
          }
        }
        if (bindOperator) {
          return bindOperator(newScope)(newScope.variablesSelector(namesPrivate))(...invokeMap(args, 'bindTo', newScope));
        }
        return newScope.variablesSelector(namesPublic);
      },
    };
  }

  createArrayExpression(arrayExpr) {
    const array = map(arrayExpr, this.compile);
    const deps = Object.assign(
      {},
      ...map(array, 'deps'),
    );
    return {
      deps,
      bindTo: (scope) => {
        const selectors = invokeMap(array, 'bindTo', scope);
        return scope.boundSelector(
          ...selectors,
          (...values) => values,
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
            return this.createLiteral(expression['!']);
          }
          if (has(expression, '$')) {
            return this.createReference(expression.$);
          }
          if (has(expression, '?')) {
            const { '?': params, ...valueExpr } = expression;
            return this.createFunction(params, valueExpr);
          }
          if (has(expression, '=')) {
            const { '=': valueExpr, ...varsExpr } = expression;
            return this.createSubExpression(
              varsExpr,
              [valueExpr],
              constant(constant(identity)),
            );
          }
          if (has(expression, '?:')) {
            const {
              '?:': argsExpr,
              '>!': func,
              '=>': funcExpr,
              ...varsExpr
            } = expression;
            if (func && typeof func !== 'function') {
              throw new Error('Expected a function at "=!"');
            }
            if (func && funcExpr) {
              throw new Error('You cannot use both "=!" and "=>" in the same expression');
            }
            return this.createSubExpression(
              varsExpr,
              [funcExpr || { '!': func }, ...(isArray(argsExpr) ? argsExpr : [argsExpr])],
              scope => () => (...selectors) =>
                scope.boundSelector(...selectors, (f, ...args) => f(...args)),
            );
          }
          if (has(expression, '<-')) {
            const {
              '<-': inputExpr,
              '->': mapValueExpr,
              '~key': keyExpr,
            } = expression;
            return this.createMapping(inputExpr, mapValueExpr, keyExpr);
          }
        }
        if (isArray(expression)) {
          return this.createArrayExpression(expression);
        }
        const {
          varsExpr,
          operator,
          argsExpr,
        } = destructure(expression);
        return this.createSubExpression(
          varsExpr,
          operator && !isArray(argsExpr) ? [argsExpr] : argsExpr,
          operator && this.operators[operator],
          operator && operator.substr(1),
        );
      }
      default:
        return this.compile({ '!': expression });
    }
  }

  createFormulaSelector(expression) {
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

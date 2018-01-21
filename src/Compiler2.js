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
import Scope from './Scope2';
import * as defaultOperators from './operators2';
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
  createListeral(value) {
    return {
      createSelector: scope => scope.createSelector2(constant(value)),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  createArgReference(key) {
    return {
      createSelector: scope => scope.createSelector2(
        (...args) => args,
        args => get(args, key),
      ),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  createReference(key) {
    const [name, dataKey] = split(key);
    return {
      dependencies: { [name]: name },
      createSelector: scope => scope.createSelector2(
        scope.getSelector(name),
        value => (dataKey ? get(value, dataKey) : value),
      ),
    };
  }

  createFunction(params, valueExpr) {
    const valueCreator = this.compile(valueExpr);
    return {
      dependencies: omit(valueCreator.dependencies, [...params, 'this']),
      // eslint-disable-next-line
      createSelector: (scope) => {
        const newScope = scope.create();

        forEach(params, name => newScope.define(name, [], null));
        newScope.define('this', [], null);

        return scope.createSelector2(
          valueCreator.createSelector(newScope),
          (evaluate) => {
            const func = (...args) => {
              const unknowns = {
                this: func,
              };
              forEach(args, (value, i) => {
                unknowns[params[i]] = value;
              });
              return evaluate(unknowns);
            };
            return func;
          },
        );
      },
    };
  }

  createScope(expression) {
    const {
      operator,
      operatorArgs,
      variables,
    } = destructure(expression);
    const compiledVariables = mapValues(variables, this.compile);
    const compiledOperatorArgs = operatorArgs
      ? map(operatorArgs, this.compile)
      : null;
    const dependencies = Object.assign(
      {},
      ...map(compiledVariables, 'dependencies'),
      ...map(compiledOperatorArgs, 'dependencies'),
    );
    const variablesNames = Object.keys(variables);
    return {
      dependencies: omit(dependencies, Object.keys(compiledVariables)),
      createSelector: (scope) => {
        const newScope = scope.create();
        const operatorCreateSelector = this.operators[operator] &&
                                       this.operators[operator](newScope);
        forEach(compiledVariables, (variable, name) => {
          newScope.define(name, variable.dependencies, () => variable.createSelector(newScope));
        });
        if (operatorCreateSelector) {
          const selectors = map(compiledOperatorArgs, arg => arg.createSelector(newScope));
          return operatorCreateSelector(...selectors);
        }
        // TODO: Optimize this!
        const selectors = map(variablesNames, name => newScope.getSelector(name));
        return newScope.createSelector2(
          ...selectors,
          (...args) => {
            const object = {};
            forEach(args, (value, i) => {
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
        return { createSelector: constant(expression) }; // explicit seletor
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
            return this.createListeral(expression['!']);
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
        }
        return this.createScope(expression); // array or any other type of object
      }
      default:
        return this.compile({ '!': expression });
    }
  }

  createFormulaSelector(expression) {
    const formula = this.compile(expression);
    if (!isEmpty(formula.dependencies)) {
      throw new Error(`Unresolved dependencies: ${values(formula.dependencies).join(', ')}`);
    }
    return formula.createSelector(this.scope.create());
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

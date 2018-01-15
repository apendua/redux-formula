import has from 'lodash/has';
import get from 'lodash/get';
import map from 'lodash/map';
import times from 'lodash/times';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import {
  createSelector,
  createStructuredSelector,
} from 'reselect';
import Scope from './Scope';
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
      createSelector: scope => (scope.hasUnknowns()
        ? constant(constant(value))
        : constant(value)
      ),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  createArgReference(key) {
    return {
      createSelector: (scope) => {
        if (!scope.hasUnknowns()) {
          return (...args) => get(args, key);
        }
        return (...args) => constant(get(args, key));
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  createReference(key) {
    const [name, dataKey] = split(key);
    return {
      dependencies: { [name]: name },
      createSelector: (scope) => {
        if (scope.hasUnknowns()) {
          return scope.isUnknown(name)
            ? constant(object => object[name])
            : createSelector(
              scope.getValue(name),
              value => (dataKey ? constant(get(value, dataKey)) : constant(value)),
            );
        }
        return createSelector(
          scope.getValue(name),
          value => (dataKey ? get(value, dataKey) : value),
        );
      },
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

        if (!scope.hasUnknowns()) {
          if (!newScope.hasUnknowns()) { // e.g. when params = []
            return createSelector(
              valueCreator.createSelector(newScope),
              value => constant(value),
            );
          }
          return createSelector(
            valueCreator.createSelector(newScope),
            (evaluate) => {
              const func = (...args) => {
                const context = {
                  this: func,
                };
                forEach(args, (value, i) => {
                  context[params[i]] = value;
                });
                return evaluate(context);
              };
              return func;
            },
          );
        }
        return createSelector(
          valueCreator.createSelector(newScope),
          evaluate => (object) => {
            const func = (...args) => {
              const context = Object.create(object);
              context.this = func;
              forEach(args, (value, i) => {
                context[params[i]] = value;
              });
              return evaluate(context);
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
    return {
      dependencies: omit(dependencies, Object.keys(compiledVariables)),
      createSelector: (scope) => {
        const newScope = scope.create();
        const operatorCreateSelector = this.operators[operator] &&
                                       this.operators[operator](newScope);
        forEach(compiledVariables, (variable, name) => {
          newScope.define(name, variable.dependencies, () => variable.createSelector(newScope));
        });
        let selectors;
        if (operatorCreateSelector) {
          selectors = map(compiledOperatorArgs, arg => arg.createSelector(newScope));
        } else {
          selectors = newScope.getAllValues();
        }
        if (operatorCreateSelector) {
          return operatorCreateSelector(...selectors);
        }
        let selectValues = createStructuredSelector(selectors);
        if (isArray(expression)) {
          const n = expression.length;
          selectValues = createSelector(
            selectValues,
            object => times(n, index => object[index]),
          );
        }
        if (newScope.hasUnknowns()) {
          return createSelector(
            selectValues,
            functions => object => mapValues(functions, f => f(object)),
          );
        }
        return selectValues;
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

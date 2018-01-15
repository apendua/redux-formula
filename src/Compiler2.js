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
      '()': defaultOperators.$evaluate,
    };
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  // eslint-disable-next-line class-methods-use-this
  compileLiteral(value) {
    return {
      createSelector: scope => (scope.hasUnknowns()
        ? constant(constant(value))
        : constant(value)
      ),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  compileCopyOperator(key) {
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

  compileFunctionExpression(expression) {
    const valueCreator = this.compile(omit(expression, '$'));
    const params = expression.$;
    return {
      dependencies: omit(valueCreator.dependencies, params),
      // eslint-disable-next-line
      createSelector: (scope) => {
        const newScope = scope.create();
        let selector;

        forEach(params, name => newScope.define(name, [], null));

        if (!scope.hasUnknowns()) {
          if (!newScope.hasUnknowns()) { // e.g. when params = []
            selector = createSelector(
              valueCreator.createSelector(newScope),
              value => constant(value),
            );
          } else {
            selector = createSelector(
              valueCreator.createSelector(newScope),
              evaluate => (...args) => {
                const context = {};
                forEach(args, (value, i) => {
                  context[params[i]] = value;
                });
                return evaluate(context);
              },
            );
          }
        } else {
          selector = createSelector(
            valueCreator.createSelector(newScope),
            evaluate => object => (...args) => {
              const context = Object.create(object);
              forEach(args, (value, i) => {
                context[params[i]] = value;
              });
              return evaluate(context);
            },
          );
        }
        newScope.define('this', [], constant(selector));
        return selector;
      },
    };
  }

  compileScopedExpression(expression) {
    const {
      operator,
      operatorArgs,
      variables,
    } = destructure(expression);
    const variablesCreators = mapValues(variables, this.compile);
    const operatorArgsCreators = operatorArgs
      ? map(operatorArgs, this.compile)
      : null;
    const dependencies = Object.assign(
      {},
      ...map(variablesCreators, 'dependencies'),
      ...map(operatorArgsCreators, 'dependencies'),
    );
    return {
      dependencies: omit(dependencies, Object.keys(variablesCreators)),
      createSelector: (scope) => {
        const newScope = scope.create();
        const operatorCreateSelector = this.operators[operator] &&
                                       this.operators[operator](newScope);
        forEach(variablesCreators, (x, name) => {
          newScope.define(name, x.dependencies, () => x.createSelector(newScope));
        });
        let selectorCreators;
        if (operatorCreateSelector) {
          selectorCreators = map(operatorArgsCreators, x => x.createSelector(newScope));
        } else {
          selectorCreators = newScope.getAllValues();
        }
        if (operatorCreateSelector) {
          return operatorCreateSelector(...selectorCreators);
        }
        let selectValues = createStructuredSelector(selectorCreators);
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
        return { createSelector: constant(expression) };
      case 'string':
        return this.compile(this.parse(expression));
      case 'number':
      case 'boolean':
      case 'undefined':
        return this.compile({ $literal: expression });
      case 'object': {
        if (isPlainObject(expression)) {
          if (has(expression, '$literal')) {
            return this.compileLiteral(expression.$literal);
          }
          if (has(expression, '$copy')) {
            return this.compileCopyOperator(expression.$copy);
          }
          if (has(expression, '$')) {
            return this.compileFunctionExpression(expression);
          }
        }
        if (isPlainObject(expression) || isArray(expression)) {
          return this.compileScopedExpression(expression);
        }
        return this.compile({ $literal: expression });
      }
      default:
        return this.compile({ $literal: expression });
    }
  }

  createFormulaSelector(expression) {
    const formula = this.compile(expression);
    if (!isEmpty(formula.dependencies)) {
      throw new Error(`Unresolved dependencies: ${values(formula.dependencies).join(', ')}`);
    }
    const newScope = this.scope.create();
    return formula.createSelector(newScope);
  }

  static defaultParse(text) {
    if (text[0] === '$') {
      return { $copy: text.substr(1) };
    }
    return { $literal: text };
  }
}

Compiler.defaultOperators = defaultOperators;

export default Compiler;

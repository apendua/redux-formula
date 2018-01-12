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
    };
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  // eslint-disable-next-line class-methods-use-this
  compileLiteral(expression) {
    return {
      createSelector: (scope) => {
        if (scope.hasUnknowns()) {
          return constant(constant(constant(expression.$literal)));
        }
        return constant(constant(expression.$literal));
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  compileCopyOperator(expression) {
    const [name, dataKey] = split(expression.$copy);
    return {
      dependencies: { [name]: name },
      createSelector: (scope) => {
        if (scope.hasUnknowns()) {
          if (scope.isUnknown(name)) {
            return constant(constant(object => object[name]));
          }
          return stack => createSelector(
            scope.getValue(name)(stack),
            value => (dataKey ? constant(get(value, dataKey)) : constant(value)),
          );
        }
        return stack => createSelector(
          scope.getValue(name)(stack),
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
        return (stack) => {
          const newScope = scope.create();
          let argsOffset = 0;
          newScope.define('this', [], null);
          if (isArray(stack)) {
            argsOffset = params.length - stack.length;
            if (argsOffset < 0) {
              throw new Error('To many arguments passed');
            }
            forEach(params, (name, i) => {
              newScope.define(name, [], constant(stack[i]));
            });
          } else {
            forEach(params, (name) => {
              newScope.define(name, [], null);
            });
          }
          const selectEvaluate = valueCreator.createSelector(newScope)();
          if (!newScope.hasUnknowns()) {
            return selectEvaluate;
          }
          return createSelector(
            selectEvaluate,
            evaluate => (...args) => {
              const context = {};
              forEach(args, (value, i) => {
                context[params[i + argsOffset]] = value;
              });
              return evaluate(context);
            },
          );
        };
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
        if (operator === '()' || operatorCreateSelector) {
          selectorCreators = map(operatorArgsCreators, x => x.createSelector(newScope));
        } else {
          selectorCreators = newScope.getAllValues();
        }
        if (operator === '()') {
          return () => {
            let selector;
            if (newScope.hasUnknowns()) {
              // console.log(newScope.getUnknownNames());
              selector = createSelector(
                selectorCreators[0](selectorCreators.slice(1)),
                func => object => func(object),
              );
            } else {
              selector = selectorCreators[0](selectorCreators.slice(1));
            }
            return createSelector(
              selector,
              evaluate => evaluate({}),
            );
          };
        }
        return (stack) => {
          if (operatorCreateSelector) {
            return operatorCreateSelector(...selectorCreators)(stack);
          }
          let selectValues = createStructuredSelector(mapValues(selectorCreators, create => create(stack)));
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
        };
      },
    };
  }

  compile(expression) {
    switch (typeof expression) {
      // case 'function':
      //   return { createSelector: constant(expression) };
      case 'string':
        return this.compile(this.parse(expression));
      case 'number':
      case 'boolean':
      case 'undefined':
        return this.compile({ $literal: expression });
      case 'object': {
        if (isPlainObject(expression)) {
          if (has(expression, '$literal')) {
            return this.compileLiteral(expression);
          }
          if (has(expression, '$copy')) {
            return this.compileCopyOperator(expression);
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
    return formula.createSelector(newScope)();
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

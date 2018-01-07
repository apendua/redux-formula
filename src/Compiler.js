import has from 'lodash/has';
import get from 'lodash/get';
import map from 'lodash/map';
import isNil from 'lodash/isNil';
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
import * as defaultOperators from './operators';
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
    };
  }

  parse(text) {
    return this.constructor.defaultParse(text);
  }

  compileParamsOperator(expression) {
    const valueCreator = this.compile(omit(expression, '$params'));
    return {
      dependencies: omit(valueCreator.dependencies, expression.$params),
      createSelector: scope => createSelector(
        createSelector(
          (...args) => args.length,
          (nArgs) => {
            const newScope = scope.create();
            forEach(expression.$params, (name, i) => {
              newScope.define(name, [], () => (...a) => a[i + nArgs]);
            });
            return valueCreator.createSelector(newScope);
          },
        ),
        (...args) => args,
        (selectValue, args1) => (...args2) => selectValue(...args1, ...args2),
      ),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  compileCopyOperator(expression) {
    const [name, dataKey] = split(expression.$copy);
    return {
      dependencies: { [name]: name },
      createSelector: scope => createSelector(
        scope.getValue(name),
        value => (dataKey ? get(value, dataKey) : value),
      ),
    };
  }

  compileHierarchicalExpression(expression) {
    const {
      operator,
      operatorArgs,
      variables,
    } = destructure(expression);
    const variablesCreators = mapValues(variables, this.compile);
    const operatorCreateSelector = this.operators[operator];
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
        forEach(variablesCreators, (x, name) => {
          newScope.define(name, x.dependencies, () => x.createSelector(newScope));
        });
        if (operatorCreateSelector) {
          return operatorCreateSelector(...map(operatorArgsCreators, x => x.createSelector(newScope)));
        }
        if (isArray(expression)) {
          const n = expression.length;
          return createSelector(
            createStructuredSelector(newScope.getAllValues()),
            object => times(n, index => object[index]),
          );
        }
        return createStructuredSelector(newScope.getAllValues());
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
            return { createSelector: constant(constant(expression.$literal)) };
          }
          if (has(expression, '$copy')) {
            return this.compileCopyOperator(expression);
          }
          if (has(expression, '$params')) {
            return this.compileParamsOperator(expression);
          }
        }
        if (isPlainObject(expression) || isArray(expression)) {
          return this.compileHierarchicalExpression(expression);
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
    return formula.createSelector(this.scope.create());
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

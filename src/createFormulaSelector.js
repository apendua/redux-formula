import get from 'lodash/get';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import filter from 'lodash/filter';
import values from 'lodash/values';
import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import {
  createSelector,
  createStructuredSelector,
} from 'reselect';
import Scope from './Scope';

const constant = x => () => x;

const split = (path) => {
  const index = path.indexOf('.');
  if (index < 0) {
    return [path];
  }
  return [path.substr(0, index), path.substr(index + 1)];
};

const createSelectorCreator = (expression) => {
  if (typeof expression === 'function') {
    return {
      createSelector: constant(expression),
    };
  }
  if (typeof expression === 'string' && expression[0] === '$') {
    const [name, dataKey] = split(expression.substr(1));
    return {
      dependencies: { [name]: name },
      createSelector: scope => createSelector(
        scope.getValue(name),
        value => (dataKey ? get(value, dataKey) : value),
      ),
    };
  }
  if (isPlainObject(expression)) {
    if (expression.$field !== undefined) {
      const field = expression.$field;
      const index = expression.$index || 0;
      const selector = createSelector(
        (...args) => args[index],
        arg => (field ? get(arg, field) : arg),
      );
      return {
        createSelector: constant(selector),
      };
    }
    if (expression.$ref) {
      const refCreator = createSelectorCreator(expression.$ref);
      return {
        dependencies: {
          ...refCreator.dependencies,
        },
        createSelector: (scope) => {
          const selectRef = refCreator.createSelector(scope);
          return (...args) => {
            const ref = selectRef(...args);
            if (ref) {
              const selector = scope.getValue(ref);
              if (selector) {
                return selector(...args);
              }
            }
            return null;
          };
        },
      };
    }
    if (expression.$filter) {
      const inputCreator = createSelectorCreator(expression.$filter);
      const predicateCreator = createSelectorCreator(expression.$predicate);
      return {
        dependencies: {
          ...inputCreator.dependencies,
          ...predicateCreator.dependencies,
        },
        createSelector: scope => createSelector(
          inputCreator.createSelector(scope),
          predicateCreator.createSelector(scope),
          (input, predicate) => filter(input, predicate),
        ),
      };
    }
    if (expression.$lt) {
      const argumentsCreators = expression.$lt.map(createSelectorCreator);
      const dependencies = {};
      argumentsCreators.forEach(x => Object.assign(dependencies, x.dependencies));
      return {
        dependencies,
        createSelector: (scope) => {
          const argumentsSelectors = argumentsCreators.map(x => x.createSelector(scope));
          return createSelector(
            ...argumentsSelectors,
            (...args) => args[0] < args[1],
          );
        },
      };
    }
    if (expression.$sub) {
      const argumentsCreators = expression.$sub.map(createSelectorCreator);
      const dependencies = {};
      argumentsCreators.forEach(x => Object.assign(dependencies, x.dependencies));
      return {
        dependencies,
        createSelector: (scope) => {
          const argumentsSelectors = argumentsCreators.map(x => x.createSelector(scope));
          return createSelector(
            ...argumentsSelectors,
            (...args) => args[0] - args[1],
          );
        },
      };
    }
    if (expression.$add) {
      const argumentsCreators = expression.$add.map(createSelectorCreator);
      const dependencies = {};
      argumentsCreators.forEach(x => Object.assign(dependencies, x.dependencies));
      return {
        dependencies,
        createSelector: (scope) => {
          const argumentsSelectors = argumentsCreators.map(x => x.createSelector(scope));
          return createSelector(
            ...argumentsSelectors,
            (...args) => args.reduce((x, y) => x + y, 0),
          );
        },
      };
    }
    if (expression.$formula) {
      const declaredVariables = expression.$variables || [];
      const formulaCreator = createSelectorCreator(expression.$formula);
      return {
        dependencies: omit(formulaCreator.dependencies, declaredVariables),
        createSelector: scope => createSelector(
          createSelector(
            (...args) => args.length,
            (nArgs) => {
              const newScope = scope.create();
              declaredVariables.forEach((name, i) => {
                newScope.define(name, [], () => (...a) => a[i + nArgs]);
              });
              return formulaCreator.createSelector(newScope);
            },
          ),
          (...args) => args,
          (selectValue, args) => (...params) => selectValue(...args, ...params),
        ),
      };
    }
    if (expression.$evaluate) {
      const formulaCreator = createSelectorCreator(expression.$evaluate[0]);
      const argsCreators = expression.$evaluate.slice(1).map(createSelectorCreator);
      const dependencies = {
        ...formulaCreator.dependencies,
      };
      argsCreators.forEach(x => Object.assign(dependencies, x.dependencies));
      return {
        dependencies,
        createSelector: (scope) => {
          const funcSelector = formulaCreator.createSelector(scope);
          const argsSelectors = argsCreators.map(x => x.createSelector(scope));
          return createSelector(
            funcSelector,
            ...argsSelectors,
            (func, ...args) => func(...args),
          );
        },
      };
    }
    if (expression.$if) {
      const conditionCreator = createSelectorCreator(expression.$if[0]);
      const thenCreator = createSelectorCreator(expression.$if[1]);
      const elseCreator = createSelectorCreator(expression.$if[2]);
      const dependencies = {
        ...conditionCreator.dependencies,
        ...thenCreator.dependencies,
        ...elseCreator.dependencies,
      };
      return {
        dependencies,
        createSelector: (scope) => {
          const conditionSelector = conditionCreator.createSelector(scope);
          const thenSelector = thenCreator.createSelector(scope);
          const elseSelector = elseCreator.createSelector(scope);
          return (...args) => {
            const condition = conditionSelector(...args);
            if (condition) {
              return thenSelector(...args);
            }
            return elseSelector(...args);
          };
        },
      };
    }
    // TODO: Ensure it also works when expression is an array
    const selectorCreators = mapValues(expression, createSelectorCreator);
    const externalDependencies = {};
    forEach(selectorCreators, (field) => {
      forEach(field.dependencies, (name, key) => {
        if (!selectorCreators[name]) {
          externalDependencies[key] = name;
        }
      });
    });
    return {
      dependencies: externalDependencies,
      createSelector: (parentScope) => {
        const scope = parentScope.create();
        forEach(selectorCreators, (field, name) => {
          scope.define(name, field.dependencies, () => field.createSelector(scope));
        });
        return createStructuredSelector(scope.getAllValues());
      },
    };
  }
  return {
    createSelector: constant(constant(expression)),
  };
};

const createFormulaSelector = (expression) => {
  const formula = createSelectorCreator(expression);
  if (!isEmpty(formula.dependencies)) {
    throw new Error(`Unknown dependencies: ${values(formula.dependencies).join(', ')}`);
  }
  return formula.createSelector(new Scope());
};

export default createFormulaSelector;

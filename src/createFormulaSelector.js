import get from 'lodash/get';
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

const constant = x => () => x;

class Manager {
  constructor(modules) {
    this.modules = mapValues(modules, value => ({
      value,
      state: 'resolved',
    }));
  }

  define(name, deps, factory) {
    if (this.modules[name]) {
      throw new Error(`${name} defined multiple times`);
    }
    this.modules[name] = {
      name,
      deps,
      factory,
      state: 'initial',
    };
  }

  resolve(moduleName, stack = [moduleName]) {
    const module = this.modules[moduleName];
    if (!module) {
      throw new Error(`Unknown dependency: ${moduleName}`);
    }
    if (module.state === 'resolving') {
      throw new Error(`Circular dependency: ${stack.join('->')}`);
    }
    if (module.state === 'resolved') {
      return module.value;
    }
    module.state = 'resolving';
    const params = mapValues(module.deps, name => this.resolve(name, [...stack, name]));
    module.value = module.factory(params);
    module.state = 'resolved';
    return module.value;
  }

  resolveAll() {
    forEach(this.modules, (module, name) => this.resolve(name, module));
  }
}

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
      createSelector: ({ [name]: selectValue }) => createSelector(
        selectValue,
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
    if (expression.$filter) {
      const inputCreator = createSelectorCreator(expression.$filter);
      const predicateCreator = createSelectorCreator(expression.$predicate);
      return {
        dependencies: {
          ...inputCreator.dependencies,
          ...predicateCreator.dependencies,
        },
        createSelector: selectors => createSelector(
          inputCreator.createSelector(selectors),
          predicateCreator.createSelector(selectors),
          (input, predicate) => filter(input, predicate),
        ),
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
      createSelector: (externalSelectors) => {
        const manager = new Manager(externalSelectors);
        const fieldsSelectors = {};
        forEach(selectorCreators, (field, name) => {
          manager.define(name, field.dependencies, (...args) => {
            const selector = field.createSelector(...args);
            fieldsSelectors[name] = selector;
            return selector;
          });
        });
        manager.resolveAll();
        return createStructuredSelector(fieldsSelectors);
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
  return formula.createSelector();
};

export default createFormulaSelector;

import {
  createSelector,
} from 'reselect';
import isArray from 'lodash/isArray';
import invokeMap from 'lodash/invokeMap';
import {
  lift,
  lift2,
} from '../utils/functions';

const relativeTo = (targetScope, originalSelector, originalScope) => {
  if (!targetScope ||
      targetScope === originalScope ||
      targetScope.isAncestorOf(originalScope)) {
    return originalSelector;
  }
  if (!targetScope.isDescendantOf(originalScope)) {
    throw new Error('Can only bind selectors from related scopes');
  }
  const order = (originalScope && originalScope.order) || 0;
  return createSelector(
    originalSelector,
    lift(order, targetScope.order - order),
  );
};

const normalize = (args) => {
  if (isArray(args[0])) {
    return [
      args[0],
      args[1],
    ];
  }
  return [
    args.slice(0, args.length - 1),
    args[args.length - 1],
  ];
};

class Selector {
  constructor(scope, value) {
    this.value = value;
    this.scope = scope;
  }

  /**
   * Create a copy of this Selector, but relative to the given scope.
   * @param {Scope} scope
   * @returns {Selector}
   */
  relativeTo(scope) {
    if (scope === this.scope) {
      return this;
    }
    return this.constructor.relativeTo(scope, this);
  }

  /**
   * Create an indirect version of this selector. Optionally, accept
   * a target scope different from the current one.
   * @param {Scope} [scope=this.scope]
   * @returns {Selector}
   */
  indirect(scope = this.scope) {
    const selector = this.relativeTo(scope).toRawSelector();
    let f = (...args) => () => selector(...args);
    let currentScope = scope;
    while (currentScope) {
      if (currentScope.hasOwnUnknowns()) {
        f = lift2(f);
      }
      currentScope = currentScope.parent;
    }
    return new Selector(
      scope,
      f,
    );
  }

  /**
   * Returns the actual selector function.
   * @returns {Function}
   */
  toRawSelector() {
    return this.value;
  }

  /**
   * Evaluates the corresponding selector function.
   * @returns {*}
   */
  evaluate(...args) {
    return this.value(...args);
  }

  static relativeTo(scope, originalSelector) {
    if (typeof originalSelector === 'function') {
      return new Selector(
        scope,
        relativeTo(scope, originalSelector),
      );
    }
    if (originalSelector instanceof Selector) {
      return new Selector(
        scope,
        relativeTo(
          scope,
          originalSelector.toRawSelector(),
          originalSelector.scope,
        ),
      );
    }
    throw new Error(`${typeof originalSelector} is not a valid selector`);
  }

  static create(scope, ...args) {
    const [selectors, evaluate] = normalize(args);

    const newEvaluate = scope && scope.hasOwnUnknowns()
      ? (...values) => unknowns => evaluate(...values.map(v => v(unknowns)))
      : evaluate;

    const newSelectors = selectors.map((selector) => {
      if (selector instanceof Selector && selector.scope === scope) {
        return selector;
      }
      return this.relativeTo(scope, selector);
    });

    if (!scope.parent) {
      return new Selector(
        scope,
        createSelector(
          invokeMap(newSelectors, 'toRawSelector'),
          newEvaluate,
        ),
      );
    }
    const selector = this.create(scope.parent, newSelectors, newEvaluate);
    return new Selector(
      scope,
      selector.toRawSelector(),
    );
  }
}

export default Selector;

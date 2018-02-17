import {
  createSelector,
} from 'reselect';
import { identity } from './utils';

const constant1 = x => () => x;

export const constant = (order) => {
  if (order === 0) {
    return identity;
  }
  const next = constant(order - 1);
  return x => constant1(next(x));
};

export const lift = (a, b) => {
  if (b === 0) {
    return f => f;
  }
  if (a === 0) {
    return f => constant(b)(f);
  }
  const next = lift(a - 1, b);
  return f => (...args) => next(f(...args));
};

const lift2 = g => (...args) => {
  const v = g(...args);
  return unknowns => () => v()(unknowns);
};

const relativeTo = (targetScope, originalSelector, originalScope) => {
  if (!targetScope ||
      targetScope === originalScope ||
      targetScope.isAncestorOf(originalScope)) {
    return originalSelector;
  }
  // NOTE: Is this check necessary?
  if (!targetScope.isDescendantOf(originalScope)) {
    throw new Error('Can only bind selectors from related scopes');
  }
  const order = (originalScope && originalScope.order) || 0;
  const wrap = lift(order, targetScope.order - order);
  return (...args) => wrap(originalSelector(...args));
};

class Selector {
  constructor(scope, selector) {
    this.selector = selector;
    this.scope = scope;
  }

  relativeTo(scope) {
    if (scope === this.scope) {
      return this;
    }
    return this.constructor.relativeTo(scope, this);
  }

  indirect(scope = this.scope) {
    const { selector } = this.relativeTo(scope);
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
          originalSelector.selector,
          originalSelector.scope,
        ),
      );
    }
    throw new Error(`${typeof originalSelector} is not a valid selector`);
  }

  static create(scope, ...args) {
    const isArray = Array.isArray(args[0]);
    const selectors = isArray
      ? args[0]
      : args.slice(0, args.length - 1);
    const evaluate = isArray
      ? args[1]
      : args[args.length - 1];
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
          newSelectors.map(selector => selector.selector),
          newEvaluate,
        ),
      );
    }
    const selector = this.create(scope.parent, newSelectors, newEvaluate);
    return new Selector(
      scope,
      selector.selector,
    );
  }
}

export default Selector;

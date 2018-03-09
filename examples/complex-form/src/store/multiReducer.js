import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import {
  ACTION_SCOPE_SET,
  ACTION_SCOPE_DEL,
  ACTION_SCOPE_PUSH,
  ACTION_SCOPE_PULL,
} from './constants';
import {
  setAtKey,
  delAtKey,
  pushAtKey,
  pullAtKey,
  splitKey,
} from './immutable';
import {
  set,
  del,
  push,
  pull,
  scope,
} from './actions';
import shallowEqual from './shallowEqual';

const scopeRe = /^@SCOPE\.(.*)/;

const getNextId = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return counter.toString();
  };
})();

let pureReducer;
export const createMultiReducer = (options = {}) => {
  const sections = {};
  const reducers = Object.create(options.reducers || {});
  const initialState = options.initialState || {};

  const multiReducer = (state = initialState, action) => {
    const isScopedAction = !!scopeRe.test(action.type);
    if (
      isScopedAction ||
      action.type === ACTION_SCOPE_SET ||
      action.type === ACTION_SCOPE_DEL ||
      action.type === ACTION_SCOPE_PUSH ||
      action.type === ACTION_SCOPE_PULL
    ) {
      const {
        key,
        reducerId,
      } = action.meta || {};
      if (key) {
        const [k, tail] = splitKey(key);
        if (tail) {
          const reducer = sections[k] || pureReducer;
          return setAtKey(state, k, reducer(state[k], {
            ...action,
            meta: {
              ...action.meta,
              key: tail,
            },
          }));
        } else if (isScopedAction) {
          const reducer = sections[k] || reducers[reducerId] || pureReducer;
          return setAtKey(state, k, reducer(state[k], action.payload));
        }
        switch (action.type) {
          case ACTION_SCOPE_SET:
            return setAtKey(state, key, action.payload);
          case ACTION_SCOPE_DEL:
            return delAtKey(state, key);
          case ACTION_SCOPE_PUSH:
            return pushAtKey(state, key, action.payload);
          case ACTION_SCOPE_PULL:
            return pullAtKey(state, key, action.payload);
          default:
            // do nothing
        }
      } else if (isScopedAction) {
        return multiReducer(state, action.payload);
      } else if (action.type === ACTION_SCOPE_SET) {
        return action.payload;
      } else if (action.type === ACTION_SCOPE_DEL) {
        return initialState;
      }
    }

    if (!isEmpty(sections)) {
      const nextState = {
        ...state,
        ...mapValues(sections, (reducer, key) => reducer(state[key], action)),
      };
      if (!shallowEqual(state, nextState)) {
        return nextState;
      }
    }

    return state;
  };

  multiReducer.factory = (factory) => {
    const id = getNextId();
    reducers[id] = factory(pureReducer);
    return id;
  };

  multiReducer.section = (key, reducer) => {
    const [k, tail] = splitKey(key);
    if (typeof reducer === 'function') {
      if (!tail) {
        if (sections[k]) {
          throw new Error(`Cannot attach custom reducer at key ${key}`);
        }
        sections[k] = reducer;
      }
    }
    if (!sections[k]) {
      sections[k] = createMultiReducer({
        reducers,
        sections: isPlainObject(reducer) ? reducer : {},
        initialState: initialState[k],
      });
    }
    let subSection;
    if (tail) {
      if (typeof sections[k].section !== 'function') {
        throw new Error(`Cannot create store section at key ${key}`);
      }
      subSection = sections[k].section(tail, reducer);
    } else {
      subSection = {
        set,
        del,
        push,
        pull,
        get: l => state => get(state, l),
      };
    }
    const wrap = scope(k);
    return {
      set: (l, v) => wrap(subSection.set(l, v)),
      del: l => wrap(subSection.del(l)),
      push: (l, v) => wrap(subSection.push(l, v)),
      pull: (l, v) => wrap(subSection.pull(l, v)),
      get: l => (
        getL => state => getL(state[k])
      )(subSection.get(l)),
    };
  };

  if (!isEmpty(options.sections)) {
    forEach(options.sections, (v, k) => {
      multiReducer.section(k, v);
    });
  }

  return multiReducer;
};

pureReducer = createMultiReducer({
  initialState: {},
});

const multiReducer = createMultiReducer();

export default multiReducer;

import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import {
  ACTION_SET,
  ACTION_DEL,
  ACTION_PUSH,
  ACTION_PULL,
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

export const createMultiReducer = (options = {}) => {
  const sections = {};
  const reducers = Object.create(options.reducers || {});
  const initialState = options.initialState || {};

  const multiReducer = (state = initialState, action) => {
    if (scopeRe.test(action.type)) {
      const {
        section,
        reducer,
      } = action.meta || {};
      const [k, tail] = splitKey(section);
      if (tail) {
        return setAtKey(state, k, (sections[k] || multiReducer.pureReducer)(state[k], {
          ...action,
          meta: {
            ...action.meta,
            section: tail,
          },
        }));
      }
      // if k is empty, this function simply replaces the exisitng value
      return setAtKey(
        state,
        k,
        (reducers[reducer] || multiReducer.pureReducer)(k ? state[k] : state, action.payload),
      );
    }

    if (action.type === ACTION_SET ||
        action.type === ACTION_DEL ||
        action.type === ACTION_PUSH ||
        action.type === ACTION_PULL
    ) {
      const key = action.meta &&
                  action.meta.key;
      const [k, tail] = splitKey(key);
      if (tail) {
        return setAtKey(state, k, (sections[k] || multiReducer.pureReducer)(state[k], {
          ...action,
          meta: {
            ...action.meta,
            key: tail,
          },
        }));
      }
      switch (action.type) {
        case ACTION_SET:
          return setAtKey(state, k, action.payload);
        case ACTION_DEL:
          return delAtKey(state, k, initialState);
        case ACTION_PUSH:
          return pushAtKey(state, k, action.payload);
        case ACTION_PULL:
          return pullAtKey(state, k, action.payload);
        default:
          // do nothing
      }
    }

    let nextState = state;

    if (!isEmpty(sections)) {
      const nextNextState = {
        ...nextState,
        ...mapValues(sections, (reducer, key) => reducer(nextState[key], action)),
      };
      if (!shallowEqual(nextState, nextNextState)) {
        nextState = nextNextState;
      }
    }

    if (options.default) {
      nextState = options.default(nextState, action);
    }

    return nextState;
  };

  multiReducer.pureReducer = options.sections === null
    ? multiReducer
    : createMultiReducer({
      reducers,
      sections: null,
    });

  multiReducer.reducer = (id, reducer) => {
    reducers[id] = reducer;
  };

  multiReducer.section = (key, reducer) => {
    if (options.sections === null) {
      throw new Error('Cannot create sections on pure reducers');
    }
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

const multiReducer = createMultiReducer();
const { pureReducer } = multiReducer;

export default multiReducer;
export { pureReducer };

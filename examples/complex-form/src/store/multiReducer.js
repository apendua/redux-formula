import get from 'lodash/get';
import {
  ACTION_SCOPE,
  ACTION_SCOPE_SET,
  ACTION_SCOPE_DEL,
  ACTION_SCOPE_PUSH,
  ACTION_SCOPE_PULL,
} from './constants';
import {
  setAtKey, delAtKey, pushAtKey, pullAtKey,
} from './immutable';

export const createMultiReducer = () => {
  const reducers = {};
  // NOTE: It's important not to set the initial state here, because
  //       if we delegate to custom reducer we want custom state initialization.
  const multiReducer = (state, action) => {
    if (action.meta && action.meta.reducer) {
      const { reducer, ...meta } = action.meta;
      const customReducer = reducers[reducer];
      if (customReducer) {
        return customReducer(state, {
          ...action,
          meta,
        });
      }
    }
    const key = action.meta && action.meta.key;
    switch (action.type) {
      case ACTION_SCOPE: {
        if (key) {
          return setAtKey(state, key, multiReducer(get(state, key), action.payload));
        }
        return multiReducer(state, action.payload);
      }
      case ACTION_SCOPE_SET:
        return setAtKey(state, key, action.payload);
      case ACTION_SCOPE_DEL:
        return delAtKey(state, key);
      case ACTION_SCOPE_PUSH:
        return pushAtKey(state, key, action.payload);
      case ACTION_SCOPE_PULL:
        return pullAtKey(state, key, action.payload);
      default:
        return state || {};
    }
  };
  multiReducer.register = (id, reducer) => {
    reducers[id] = reducer;
  };
  return multiReducer;
};

const multiReducer = createMultiReducer();

export default multiReducer;

import mapValues from 'lodash/mapValues';
import { combineReducers } from 'redux';

const ACTION_SCOPE = '@SCOPE';
// const ACTION_SET = '@SCOPE.SET';
// const ACTION_PUSH = '@SCOPE.PUSH';
// const ACTION_PULL = '@SCOPE.PULL';

const createScopedReducer = (key, reducer) => (state, action) => {
  if (action.type === ACTION_SCOPE) {
    if (key !== action.meta.key) {
      return state;
    }
    return reducer(state, action.payload);
  }
  return reducer(state, action);
};

const scope = (store, key) => {
  const getState = () => {
    const state = store.getState();
    return state && state[key];
  };
  const dispatch = (action) => {
    if (action.meta && action.meta.scope) {
      return store.dispatch({
        type: ACTION_SCOPE,
        payload: action,
        meta: {
          key,
        },
      });
    }
    return store.dispatch(action);
  };
  const subscribe = (listener) => {
    let prevState = null;
    return store.subscribe(() => {
      const state = getState();
      if (state !== prevState) {
        prevState = state;
        listener();
      }
    });
  };
  return {
    dispatch,
    subscribe,
    getState,
  };
};

scope.reducer = createScopedReducer;
scope.combineReducers = reducers =>
  combineReducers(mapValues(reducers, (reducer, key) => createScopedReducer(key, reducer)));

export default scope;

import get from 'lodash/get';
import {
  scope,
} from './actions';

const createSubStore = (store, section, reducer) => {
  if (!section && !reducer) {
    return store;
  }
  const getState = () => get(store.getState(), section);
  const wrap = scope(section, reducer);
  const dispatch = action => store.dispatch(wrap(action));
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
  return { dispatch, subscribe, getState };
};

export default createSubStore;

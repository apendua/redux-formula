import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import {
  scope,
} from './actions';
import shallowEqual from './shallowEqual';

/*
EXAMPLE:
const Scope = createScope(Store);
<Scope key="forms" reducer="forms">
  ...
</Scope>
*/

export const createSubStore = (store, {
  key,
  reducer,
}) => {
  const getState = () => {
    const state = store.getState();
    return get(state, key);
  };
  const wrap = scope(key, reducer);
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

const createScope = (context) => {
  class Component extends React.PureComponent {
    getStore(...args) {
      if (!shallowEqual(args, this.storeArgs)) {
        const [store, key, reducer] = args;
        this.storeArgs = args;
        this.store = createSubStore(store, {
          key,
          reducer,
        });
      }
      return this.store;
    }
    render() {
      const {
        name,
        reducer,
        children,
      } = this.props;
      return (
        <context.Consumer>
          {ctx => (
            <context.Provider value={{ store: this.getStore(ctx.store, name, reducer) }} >
              {children}
            </context.Provider>
          )}
        </context.Consumer>
      );
    }
  }
  Component.propTypes = {
    name: PropTypes.string.isRequired,
    reducer: PropTypes.string,
    children: PropTypes.node,
  };
  Component.defaultProps = {
    reducer: null,
    children: null,
  };
  return Component;
};

export default createScope;

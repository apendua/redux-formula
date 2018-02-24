import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import {
  scope,
  withReducer,
} from './actions';
import shallowEqual from './shallowEqual';

const identity = x => x;
const constant = x => () => x;

/*
EXAMPLE:

const Scope = createScope(Store);

<Scope key="forms" reducer="forms">
  ...
</Scope>
*/
const createScope = (context, {
  shouldScopeAction = constant(true),
} = {}) => {
  const createScopedStore = (store, key, reducer) => {
    const getState = () => {
      const state = store.getState();
      return get(state, key);
    };
    const wrapAction = withReducer(reducer)(identity);
    const dispatch = (action) => {
      if (shouldScopeAction(action)) {
        return store.dispatch(scope(key, wrapAction(action)));
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
    return { dispatch, subscribe, getState };
  };

  class Component extends React.PureComponent {
    getStore(...args) {
      if (!shallowEqual(args, this.storeArgs)) {
        this.storeArgs = args;
        this.store = createScopedStore(...args);
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

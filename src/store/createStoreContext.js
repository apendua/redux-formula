import React, { createContext } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import {
  scope,
} from './actions';
import shallowEqual from '../utils/shallowEqual';
import createConnect from './createConnect';

/*
EXAMPLE:
const Store = createStoreContext(store);
<Store.Section section="forms" reducer="field">
  ...
</Store.Section>
*/

export const createSubStore = (store, section, reducer) => {
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

const join = (x, y) => {
  if (!x) {
    return y;
  }
  return `${x}.${y}`;
};

const createStoreContext = ({
  parent,
  defaultName = 'state',
  rootSection = '',
} = {}) => {
  const context = createContext({
    store: null,
  });
  const {
    Provider,
    Consumer,
  } = context;
  class Section extends React.PureComponent {
    getStore(...args) {
      if (!shallowEqual(args, this.storeArgs)) {
        const [store, section, reducer] = args;
        this.storeArgs = args;
        this.store = createSubStore(store, section, reducer);
      }
      return this.store;
    }
    render() {
      const {
        section,
        reducer,
        children,
      } = this.props;
      return (
        <Consumer>
          {value => (
            value.store || !parent
            ?
              <Provider value={{ store: this.getStore(value.store, value.store ? section : join(rootSection, section), reducer) }} >
                {children}
              </Provider>
            :
              <parent.Consumer>
                {parentValue => (
                  <Provider value={{ store: this.getStore(parentValue.store, join(rootSection, section), reducer) }} >
                    {children}
                  </Provider>
                )}
              </parent.Consumer>
          )}
        </Consumer>
      );
    }
  }
  Section.propTypes = {
    section: PropTypes.string,
    reducer: PropTypes.string,
    children: PropTypes.node,
  };
  Section.defaultProps = {
    section: null,
    reducer: null,
    children: null,
  };
  return {
    Provider,
    Consumer,
    Section,
    context,
    connect: createConnect({ [defaultName]: context }),
  };
};

export default createStoreContext;

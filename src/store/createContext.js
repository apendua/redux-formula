import React from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
import shallowEqual from '../utils/shallowEqual';
import createConnectFactory from './createConnectFactory';
import createSubStore from './createSubStore';

/*
EXAMPLE:
const Store = createStoreContext(store);
<Store.Section section="forms" reducer="field">
  ...
</Store.Section>
*/

const createContext = ({
  key,
  context = React.createContext({
    store: null,
  }),
  createScope,
  createConnect,
  options,
} = {}) => {
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
        <context.Consumer>
          {value => (
            <context.Provider value={{ ...value, [key]: this.getStore(value[key], section, reducer) }} >
              {children}
            </context.Provider>
          )}
        </context.Consumer>
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

  const related = {};
  const api = {
    key,
    context,
    Section,
    options,
    createConnect: createConnect || createConnectFactory(context),
    createScope: createScope
      ? (k, other) => createScope(key ? `${key}:${k}` : k, other)
      : (k, other) => {
        related[k] = createContext({
          context,
          options: other,
          create: api.create,
          key: key ? `${key}:${k}` : k,
        });
        return related[k];
      },
  };

  if (!key) {
    const Store = ({
      store,
      children,
    }) => (
      <context.Provider value={Object.assign({}, ...map(related, (value, k) => ({ [k]: createSubStore(store, k) })))}>
        {children}
      </context.Provider>
    );

    Store.propTypes = {
      children: PropTypes.node.isRequired,
      store: PropTypes.shape({
        subscribe: PropTypes.func.isRequired,
        dispatch: PropTypes.func.isRequired,
        getState: PropTypes.func.isRequired,
      }).isRequired,
    };

    api.Store = Store;
  }

  return api;
};

export default createContext;

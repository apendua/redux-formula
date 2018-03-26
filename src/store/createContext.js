import React from 'react';
import PropTypes from 'prop-types';
import shallowEqual from '../utils/shallowEqual';
import createConnectFactory from './createConnectFactory';
import createSubStore from './createSubStore';
import {
  P,
  formulaSelector,
} from '../formulaSelector';

const createContext = ({
  key,
  context = React.createContext({
    store: null,
  }),
  isAttached = true,
  createScope,
  createConnect,
  options,
} = {}) => {
  class Section extends React.PureComponent {
    constructor(props) {
      super(props);

      this.mapValue = formulaSelector(P`
        {
          = $2
            @map {
              ? store, key
              = @if key == ${key}
                , ${createSubStore}(store, $0, $1)
                , store
            }
        }
      `);

      // NOTE: For a reference, an exlicit implementation could be something like:
      //
      // this.mapValue = createSelector(
      //   createSelector(
      //     argument(0),
      //     argument(1),
      //     (section, reducer) => memoizeMapValues((store, k) => (k === key
      //       ? createSubStore(store, section, reducer)
      //       : store
      //     )),
      //   ),
      //   argument(2),
      //   (mapValue, value) => mapValue(value),
      // );
    }

    componentWillUnmount() {
    }

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
            <context.Provider value={this.mapValue(section, reducer, value)} >
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

  const children = {};
  const api = {
    key,
    context,
    Section,
    options,
    isAttached,
    createConnect: createConnect || createConnectFactory(context),
    createScope: createScope
      ? (k, other) => createScope(key ? `${key}:${k}` : k, other)
      : (k, other) => {
        children[k] = createContext({
          context,
          options: other,
          create: api.create,
          key: key ? `${key}:${k}` : k,
        });
        return children[k];
      },
  };

  if (!key) {
    const mapValue = formulaSelector(P`
      {
        = $0
          @map {
            ? context, key
            = @if context.isAttached
              , ${createSubStore}($1, key)
              , $1
          }
      }
    `);
    const Store = props => (
      <context.Provider value={mapValue(children, props.store)} >
        {props.children}
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

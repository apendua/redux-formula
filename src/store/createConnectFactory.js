import React from 'react';
import PropTypes from 'prop-types';
import {
  createStructuredSelector,
} from 'reselect';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import shallowEqual from '../utils/shallowEqual';
import {
  argument,
} from '../utils/functions';
import {
  splitKey,
} from '../utils/immutable';
import {
  defaultCompiler,
  formulaSelectorFactory,
} from '../index';
import {
  set,
  del,
  push,
  pull,
} from './actions';

const createConnectFactory = context => bindings => (expression, handlers) => {
  const factory = formulaSelectorFactory(expression);
  const defaultScope = defaultCompiler.createScope();

  forEach(bindings, ({ name }, i) => defaultScope.external(name, argument(i + 1)));

  class Component extends React.Component {
    static getDerivedStateFromProps(nextProps) {
      if (nextProps.stores) {
        return mapValues(nextProps.stores, store => (store ? store.getState() : null));
      }
      return {};
    }

    constructor(props) {
      super(props);
      this.empty = {};
      this.state = {};
      this.utils = {
        $set: (path, value) => {
          const [name, key] = splitKey(path);
          this.props.stores[name].dispatch(set(key, value));
        },
        $push: (path, value) => {
          const [name, key] = splitKey(path);
          this.props.stores[name].dispatch(push(key, value));
        },
        $pull: (path, value) => {
          const [name, key] = splitKey(path);
          this.props.stores[name].dispatch(pull(key, value));
        },
        $del: (path) => {
          const [name, key] = splitKey(path);
          this.props.stores[name].dispatch(del(key));
        },
        $dispatch: (name, action) => {
          this.props.stores[name].dispatch(action);
        },
      };
      this.hooks = mapValues(handlers, handler => (...args) => {
        const { stores, ownProps } = this.props;
        // NOTE: This state may be more up-to-date than this.state!
        const state = mapValues(stores, store => store.getState());
        return handler({
          ...ownProps,
          ...this.getValue(state, ownProps),
          ...this.hooks,
          ...this.utils,
        })(...args);
      });
      this.scope = defaultScope.create();
      this.subscriptions = {};
      forEach(bindings, ({
        scope,
        ...options
      }) => {
        if (scope.options && typeof scope.options.onCreate === 'function') {
          scope.options.onCreate(this.scope, {
            ...options,
            ...this.utils,
          });
        }
      });
      this.selector = factory(this.scope);
    }

    componentDidMount() {
      forEach(this.props.stores, (store, name) => {
        this.bindToStore(name, store);
      });
    }

    shouldComponentUpdate(nextProps, nextState) {
      const { ownProps } = this.props;
      const object = {
        ...ownProps,
        ...this.getValue(this.state, ownProps),
        ...this.hooks,
      };
      const nextObject = {
        ...nextProps.ownProps,
        ...this.getValue(nextState, nextProps.ownProps),
        ...this.hooks,
      };
      return !shallowEqual(object, nextObject);
    }

    componentDidUpdate(prevProps) {
      forEach(prevProps.stores, (store, name) => {
        if (!this.props.stores[name]) {
          this.bindToStore(name, null);
        }
      });
      forEach(this.props.stores, (store, name) => {
        if (this.props.stores[name] !== prevProps.stores[name]) {
          this.bindToStore(name, store);
        }
      });
    }

    componentWillUnmount() {
      forEach(this.subscriptions, (stop, name) => {
        stop();
        delete this.subscriptions[name];
      });
    }

    getValue(state, props) {
      const value = this.selector(
        props,
        ...bindings.map(({ name }) => state[name]),
      );
      if (!isPlainObject(value)) {
        throw new Error('Formula value should be an object');
      }
      return value;
    }

    bindToStore(name, store) {
      if (this.subscriptions[name]) {
        this.subscriptions[name]();
      }
      if (store) {
        this.setState({ [name]: store.getState() });
        this.subscriptions[name] = store.subscribe(() => {
          this.setState({ [name]: store.getState() });
        });
      } else {
        delete this.subscriptions[name];
      }
    }

    render() {
      const {
        children,
        ownProps,
      } = this.props;
      return children({
        ...ownProps,
        ...this.getValue(
          this.state,
          ownProps,
        ),
        ...this.hooks,
      });
    }
  }

  Component.propTypes = {
    ownProps: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    stores: PropTypes.objectOf(
      PropTypes.shape({
        dispatch: PropTypes.func,
        getState: PropTypes.func,
        subscribe: PropTypes.func,
      }),
    ),
    children: PropTypes.func.isRequired,
  };

  Component.defaultProps = {
    ownProps: {},
    stores: {},
  };

  const selectValue = createStructuredSelector(
    Object.assign(
      {},
      ...map(bindings, ({ name, scope }) => ({ [name]: value => value[scope.key] })),
    ),
  );

  return (BaseComponent) => {
    const renderBaseComponent = props => (<BaseComponent {...props} />);
    const Connect = props => (
      <context.Consumer>
        {value => (
          <Component stores={selectValue(value)} ownProps={props} >
            {renderBaseComponent}
          </Component>
        )}
      </context.Consumer>
    );
    return Connect;
  };
};

export default createConnectFactory;

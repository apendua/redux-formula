import React from 'react';
import PropTypes from 'prop-types';
import keys from 'lodash/keys';
import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import Scope from '../Compiler/Scope';
import shallowEqual from '../utils/shallowEqual';
import {
  splitKey,
} from '../utils/immutable';
import {
  formulaSelectorFactory,
} from '../index';
import {
  set,
  del,
  push,
  pull,
} from './actions';
import composeConsumers from './composeConsumers';

const createConnect = options => (expression, handlers) => {
  const factory = formulaSelectorFactory(expression);
  const defaultScope = new Scope();
  const names = keys(options);

  forEach(names, (name, i) => defaultScope.external(name, (...args) => args[i + 1]));

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
      this.scope = new Scope();
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
      this.subscriptions = {};
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

    getSelector(scope) {
      if (this.scope !== scope) {
        this.scope = scope;
        this.selector = factory(defaultScope);
      }
      return this.selector;
    }

    getValue(state, props) {
      const value = this.getSelector(defaultScope)(
        props,
        ...names.map(name => state[name]),
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

  return (BaseComponent) => {
    const renderBaseComponent = props => (<BaseComponent {...props} />);

    let ComposedConsumer;
    forEach(options, ({ Consumer }, name) => {
      ComposedConsumer = composeConsumers(ComposedConsumer, Consumer, name);
    });

    return props => (
      <ComposedConsumer>
        {stores => (
          <Component stores={stores} ownProps={props} >
            {renderBaseComponent}
          </Component>
        )}
      </ComposedConsumer>
    );
  };
};

export default createConnect;

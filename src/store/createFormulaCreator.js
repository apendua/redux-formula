import React from 'react';
import PropTypes from 'prop-types';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import Scope from '../Compiler/Scope';
import shallowEqual from '../utils/shallowEqual';
import {
  set,
  del,
  push,
  pull,
} from './actions';

const createFormulaCreator = (context, formulaSelectorFactory) => (expression, handlers) => {
  const factory = formulaSelectorFactory(expression);
  const defaultScope = new Scope();

  defaultScope.external('state', state => state);
  defaultScope.external('props', (state, props) => props);

  class Component extends React.Component {
    static getDerivedStateFromProps(nextProps) {
      if (nextProps.store) {
        return nextProps.store.getState() || null;
      }
      return {};
    }

    constructor(props) {
      super(props);
      this.empty = {};
      this.scope = new Scope();
      this.state = {};
      this.utils = {
        $set: (key, value) => this.props.store.dispatch(set(key, value)),
        $push: (key, value) => this.props.store.dispatch(push(key, value)),
        $pull: (key, value) => this.props.store.dispatch(pull(key, value)),
        $del: key => this.props.store.dispatch(del(key)),
      };
      this.hooks = mapValues(handlers, handler => (...args) => {
        const { store, ownProps } = this.props;
        // NOTE: This state may be more up-to-date than this.state!
        const state = store ? store.getState() : this.empty;
        return handler({
          ...ownProps,
          ...this.getValue(state),
          ...this.hooks,
          ...this.utils,
        })(...args);
      });
    }

    componentDidMount() {
      this.bindToStore(this.props.store);
    }

    shouldComponentUpdate(nextProps, nextState) {
      const {
        store,
        scope,
        ownProps,
      } = this.props;
      return store !== nextProps.store ||
             scope !== nextProps.scope ||
             !shallowEqual(ownProps, nextProps.ownProps) ||
             !shallowEqual(this.state, nextState);
    }

    componentDidUpdate(prevProps) {
      if (this.props.store !== prevProps.store) {
        this.bindToStore(this.props.store);
      }
    }

    componentWillUnmount() {
      this.bindToStore(null);
    }

    getSelector(scope) {
      if (this.scope !== scope) {
        this.scope = scope;
        this.selector = factory(defaultScope);
      }
      return this.selector;
    }

    getValue(state) {
      const value = this.getSelector(this.props.scope)(state, this.props.ownProps);
      if (!isPlainObject(value)) {
        throw new Error('Formula value should be an object');
      }
      return value;
    }

    bindToStore(store) {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      if (store) {
        this.setState(store.getState());
        this.unsubscribe = store.subscribe(() => {
          this.setState(store.getState());
        });
      }
    }

    render() {
      const {
        children,
      } = this.props;
      return children(this.getValue(this.state), this.hooks);
    }
  }

  Component.propTypes = {
    ownProps: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    scope: PropTypes.instanceOf(Scope),
    store: PropTypes.shape({
      dispatch: PropTypes.func,
      getState: PropTypes.func,
      subscribe: PropTypes.func,
    }),
    children: PropTypes.func.isRequired,
  };

  Component.defaultProps = {
    ownProps: {},
    scope: new Scope(),
    store: null,
  };

  return BaseComponent => props => (
    <context.Consumer>
      {ctx => (
        <Component store={ctx.store} scope={ctx.scope} ownProps={props} >
          {(value, hooks) => (
            <BaseComponent {...props} {...value} {...hooks} />
          )}
        </Component>
      )}
    </context.Consumer>
  );
};

export default createFormulaCreator;

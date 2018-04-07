import React from 'react';
import PropTypes from 'prop-types';
import {
  createSelector,
} from 'reselect';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import shallowEqual from '../utils/shallowEqual';
import {
  formulaSelectorFactory,
} from '../formulaSelector';
import {
  Scope,
} from '../Compiler';
import {
  set,
  del,
  push,
  pull,
} from './actions';

/*
const MyComponent = f.component`
{
  = @dom:div
      @${LabelComponent} "Value = ", state.value
      {
        onChange = { ? e = state:set("value", e.target.value) }
        = @dom:input
          --
            onChange
            value = state.value
          --
      }
}
`;

const MyComponent = f.connect(f.parse`{
  value = state.value
  onChange = { ? e = state:set("value", e.target.value) }
}`)(props => (
  <div>
    <span>Value = {props.value}</span>
    <input
      onChange={props.onChange}
      value={props.value}
    />
  </div>
));
*/

const identity = x => x;

const createComponentFactory = context => (expression, handlers) => {
  const factory = formulaSelectorFactory(expression);

  // eslint-disable-next-line
  class Component extends React.Component {
    static getDerivedStateFromProps(nextProps) {
      if (nextProps.store) {
        return nextProps.store.getState();
      }
      return {};
    }

    constructor(props) {
      super(props);
      this.empty = {};
      this.state = {};
      this.utils = {
        set: (key, value) => {
          this.props.store.dispatch(set(key, value));
        },
        push: (key, value) => {
          this.props.store.dispatch(push(key, value));
        },
        pull: (key, value) => {
          this.props.store.dispatch(pull(key, value));
        },
        del: (key) => {
          this.props.store.dispatch(del(key));
        },
        dispatch: (action) => {
          this.props.store.dispatch(action);
        },
      };
      this.hooks = mapValues(handlers, handler => (...args) => {
        const { scope, store, ownProps } = this.props;
        // NOTE: This state may be more up-to-date than this.state!
        const state = store.getState();
        return handler({
          ...ownProps,
          ...this.getValue(scope, state, ownProps, this.utils),
          ...this.hooks,
        })(...args);
      });
      this.getSelector = createSelector(
        identity,
        scope => factory(scope),
      );
    }

    componentDidMount() {
      this.bindToStore(this.props.store);
    }

    shouldComponentUpdate(nextProps, nextState) {
      const { scope, ownProps } = this.props;
      const object = {
        ...ownProps,
        ...this.getValue(scope, this.state, ownProps, this.utils),
        ...this.hooks,
      };
      const nextObject = {
        ...nextProps.ownProps,
        ...this.getValue(nextProps.scope, nextState, nextProps.ownProps, this.utils),
        ...this.hooks,
      };
      return !shallowEqual(object, nextObject);
    }

    componentDidUpdate(prevProps) {
      if (prevProps.store !== this.props.store) {
        this.bindToStore(this.props.store);
      }
    }

    componentWillUnmount() {
      this.unsubscribe();
      delete this.unsubscribe;
    }

    getValue(scope, ...args) {
      const value = this.getSelector(scope)(...args);
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
        ownProps,
        scope,
      } = this.props;
      return children({
        ...ownProps,
        ...this.getValue(scope, this.state, ownProps, this.utils),
        ...this.hooks,
      });
    }
  }

  Component.propTypes = {
    ownProps: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    store: PropTypes.shape({
      dispatch: PropTypes.func,
      getState: PropTypes.func,
      subscribe: PropTypes.func,
    }).isRequired,
    scope: PropTypes.instanceOf(Scope).isRequired,
    children: PropTypes.func.isRequired,
  };

  Component.defaultProps = {
    ownProps: {},
  };

  return (BaseComponent) => {
    const renderBaseComponent = props => (<BaseComponent {...props} />);
    const Connect = props => (
      <context.Consumer>
        {value => (
          <Component
            store={value && value.store}
            scope={value && value.scope}
            ownProps={props}
          >
            {renderBaseComponent}
          </Component>
        )}
      </context.Consumer>
    );
    return Connect;
  };
};

export default createComponentFactory;

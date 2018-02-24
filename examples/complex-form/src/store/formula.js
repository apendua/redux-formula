import React, { createContext } from 'react';
import PropTypes from 'prop-types';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import { formulaSelectorFactory, Scope } from 'redux-formula';
import shallowEqual from './shallowEqual';
import {
  set,
  del,
  push,
  pull,
} from './actions';

const createFormulaCreator = context => (expression, handlers) => {
  const factory = formulaSelectorFactory(expression);

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
        const { store, props } = this.props;
        // NOTE: This state may be more up-to-date than this.state!
        const state = store ? store.getState() : this.empty;
        return handler({
          ...props,
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
        props,
      } = this.props;
      return store !== nextProps.store ||
             scope !== nextProps.scope ||
             !shallowEqual(props, nextProps.props) ||
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
        this.selector = factory(scope);
      }
      return this.selector;
    }

    getValue(state) {
      const value = this.getSelector(this.props.scope)(state, this.props.props);
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
    // props: PropTypes.object,
    scope: PropTypes.instanceOf(Scope),
    children: PropTypes.func.isRequired,
  };

  Component.defaultProps = {
    scope: new Scope(),
  };

  return BaseComponent => props => (
    <context.Consumer>
      {ctx => (
        <Component store={ctx.store} scope={ctx.scope} props={props} >
          {(value, hooks) => (
            <BaseComponent {...props} {...value} {...hooks} />
          )}
        </Component>
      )}
    </context.Consumer>
  );
};

const FormulaContext = createContext({
  store: null,
  scope: null,
});

const formula = createFormulaCreator(FormulaContext);

export { createFormulaCreator, FormulaContext };
export default formula;

/*
<Formula expression={`
  listId = $1.listId
`}>
  {(value) => {
    <List listId={value.listId} />
  }}
</Formula>

formula({
  listId: '$1.listId',
})((props) => (
  <List listId={props.listId} />
))
*/

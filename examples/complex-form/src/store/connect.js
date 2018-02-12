import React, { createContext } from 'react';
import { formulaSelectorFactory } from 'redux-formula';

const shallowEqual = (a, b) => {
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray && bIsArray) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((v, i) => v === b[i]);
  }
  if (!aIsArray && !bIsArray) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every(k => a[k] === b[k]);
  }
  return false;
};

const Scope = createContext({
  store: null,
  dataKey: '',
});

const Formula = (expression) => {
  const factory = formulaSelectorFactory(expression);

  class Component extends React.Component {
    static getDerivedStateFromProps(nextProps) {
      if (nextProps.store) {
        return nextProps.store.getState();
      }
      return {};
    }

    constructor(props) {
      super(props);
      const { store } = props;
      this.selector = factory();
      if (store) {
        this.bindToStore(store);
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (this.props.store !== nextProps.store) {
        return true;
      }
      if (!shallowEqual(this.props.ownProps, nextProps.ownProps)) {
        return true;
      }
      if (!shallowEqual(this.state, nextState)) {
        return true;
      }
    }

    componentDidUpdate(prevProps) {
      if (this.props.store !== prevProps.store) {
        this.bindToStore(this.props.store);
      }
    }

    bindToStore(store) {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      if (store) {
        this.unsubscribe = store.subscribe(() => {
          this.setState(store.getState());
        });
      }
    }

    render() {
      const {
        store,
        ownProps,
        children,
      } = this.props;
      const formula = this.select(this.props.store.getState());
      return children({
        formula,
        ...ownProps,
      });
    }
  }

  return ({ children, ...ownProps }) => (
    <Scope.Consumer>
      {(context) => {
        <Component store={context.store} ownProps={ownProps} >
          {children}
        </Component>
      }}
    </Scope.Consumer>
  );
};


/*

<Formula expression={{
  listId: '$0.params.listId',
}}>
  {(formula) => {
    <List listId={formula.listId} />
  }}
</Formula>

*/
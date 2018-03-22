import React, { createContext } from 'react';
import PropTypes from 'prop-types';
import shallowEqual from '../utils/shallowEqual';
import createConnect from './createConnect';
import createSubStore from './createSubStore';
import relativeConsumer from './relativeConsumer';

/*
EXAMPLE:
const Store = createStoreContext(store);
<Store.Section section="forms" reducer="field">
  ...
</Store.Section>
*/

const noop = () => {};

const createStoreContext = ({
  parent,
  onCreate = noop,
  defaultName = 'state',
  rootSection = '',
} = {}) => {
  const context = createContext({
    store: null,
  });
  const { Provider } = context;
  const Consumer = relativeConsumer(context.Consumer, parent && parent.Consumer, rootSection);

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
            <Provider value={{ store: this.getStore(value.store, section, reducer) }} >
              {children}
            </Provider>
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

  const storeContext = {
    onCreate,
    Provider,
    Consumer,
    Section,
  };

  storeContext.connect = createConnect([
    {
      variable: defaultName,
      context: storeContext,
    },
  ]);

  return storeContext;
};

export default createStoreContext;

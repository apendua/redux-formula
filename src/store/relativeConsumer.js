import React from 'react';
import PropTypes from 'prop-types';
import {
  createSelector,
} from 'reselect';
import createSubStore from './createSubStore';
import {
  argument,
} from '../utils/functions';

const relativeConsumer = (Consumer, DefaultConsumer, defaultSection) => {
  class ComposedConsumer extends React.PureComponent {
    constructor(props) {
      super(props);

      this.getStore = createSelector(
        argument(0),
        store => createSubStore(store, defaultSection),
      );

      this.getChildren = createSelector(
        argument(0),
        children => value => children({ store: this.getStore(value.store) }),
      );
    }

    render() {
      if (!DefaultConsumer) {
        return (
          <Consumer>
            {this.props.children}
          </Consumer>
        );
      }
      return (
        <Consumer>
          {value => (
            value.store
            ?
              this.props.children(value)
            :
              <DefaultConsumer>
                {this.getChildren(this.props.children)}
              </DefaultConsumer>
          )}
        </Consumer>
      );
    }
  }

  ComposedConsumer.propTypes = {
    children: PropTypes.func.isRequired,
  };

  return ComposedConsumer;
};

export default relativeConsumer;

import React from 'react';
import PropTypes from 'prop-types';
import {
  createSelector,
} from 'reselect';
import createSubStore from './createSubStore';

const relativeConsumer = (Consumer, PatentConsumer, rootSection) => {
  class RelativeConsumer extends React.PureComponent {
    constructor(props) {
      super(props);

      this.getStore = createSelector(
        store => store,
        store => createSubStore(store, rootSection),
      );

      this.getChildren = createSelector(
        children => children,
        children => value => children({ store: this.getStore(value.store) }),
      );
    }

    render() {
      return (
        <Consumer>
          {value => (
            value.store || !PatentConsumer
            ?
              this.props.children(value)
            :
              <PatentConsumer>
                {this.getChildren(this.props.children)}
              </PatentConsumer>
          )}
        </Consumer>
      );
    }
  }

  RelativeConsumer.propTypes = {
    children: PropTypes.func.isRequired,
  };

  return RelativeConsumer;
};

export default relativeConsumer;

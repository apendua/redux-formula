import React from 'react';
import PropTypes from 'prop-types';
import {
  defaultMemoize,
  createSelectorCreator,
} from 'reselect';
import shallowEqual from '../utils/shallowEqual';
import {
  argument,
} from '../utils/functions';

const createSelector = createSelectorCreator(
  defaultMemoize,
  shallowEqual,
);

const composeConsumers = (First, Second, name) => {
  class ComposedConsumer extends React.PureComponent {
    constructor(props) {
      super(props);
      this.getChildren = createSelector(
        argument(0),
        argument(1),
        (children, first) => second => children({ ...first, [name]: second.store }),
      );
    }

    render() {
      if (!First) {
        return (
          <Second>
            {this.getChildren(this.props.children)}
          </Second>
        );
      }
      return (
        <First>
          {first => (
            <Second>
              {this.getChildren(this.props.children, first)}
            </Second>
          )}
        </First>
      );
    }
  }

  ComposedConsumer.propTypes = {
    children: PropTypes.func.isRequired,
  };

  return ComposedConsumer;
};

export default composeConsumers;

import React from 'react';
import PropTypes from 'prop-types';
import Context from '../store/Context';
import Form from './Form';

const App = ({ store }) => (
  <Context.Store store={store}>
    <Form />
  </Context.Store>
);

App.propTypes = {
  // eslint-disable-next-line
  store: PropTypes.object.isRequired,
};

export default App;

import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import Form from './Form';

const App = ({ store }) => (
  <Provider store={store}>
    <Form />
  </Provider>
);

App.propTypes = {
  // eslint-disable-next-line
  store: PropTypes.object.isRequired,
};

export default App;

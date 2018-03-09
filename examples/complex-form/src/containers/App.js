import React from 'react';
import PropTypes from 'prop-types';
import Context from '../store/Context';
import Form from './Form';

const App = ({ store }) => (
  <Context.Provider value={{ store }}>
    <Form />
  </Context.Provider>
);

App.propTypes = {
  // eslint-disable-next-line
  store: PropTypes.object.isRequired,
};

export default App;

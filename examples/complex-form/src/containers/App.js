import React from 'react';
import PropTypes from 'prop-types';
import { FormulaContext } from '../store/formula';
import Form from './Form';

const App = ({ store }) => (
  <FormulaContext.Provider value={{ store }}>
    <Form />
  </FormulaContext.Provider>
);

App.propTypes = {
  // eslint-disable-next-line
  store: PropTypes.object.isRequired,
};

export default App;

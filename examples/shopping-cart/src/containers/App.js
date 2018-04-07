import React from 'react';
import PropTypes from 'prop-types';
import Context from '../store/Context';
import f from '../store/Formula';
import Form from './Form';
import Form2 from './Form2';

const App = ({ store }) => (
  <Context.Store store={store}>
    <f.context.Provider value={{ store }}>
      <Form />
      <Form2 />
    </f.context.Provider>
  </Context.Store>
);

App.propTypes = {
  // eslint-disable-next-line
  store: PropTypes.object.isRequired,
};

export default App;

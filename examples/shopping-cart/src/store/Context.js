import createStoreContext from 'redux-formula/lib/store/createStoreContext';

const Context = createStoreContext();

export const Api = createStoreContext({
  parent: Context,
  rootSection: 'api',
});

export const Form = createStoreContext({
  parent: Context,
  rootSection: 'form',
});

export default Context;

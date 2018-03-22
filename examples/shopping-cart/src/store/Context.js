import createContext from 'redux-formula/lib/store/createContext';

const Context = createContext();
const pending = {
  ready: false,
};

export const Api = Context.createScope('api', {
  onCreate(scope, {
    $set,
  }) {
    const fetch = (items, id) => {
      if (!id) {
        return {};
      }
      if (items && items[id]) {
        return items[id];
      }
      setTimeout(() => {
        $set(`api.items.${id}`, {
          id,
          ready: true,
          price: Math.ceil(100 * Math.random()),
        });
      }, 1000);
      return pending;
    };
    scope.namespace('api', (namespace) => {
      namespace.operator('fetch', target => selectId =>
        target.boundSelector(
          target.boundSelector(
            scope.resolve('^api').selector,
            api => api && api.items,
          ),
          selectId,
          (items, id) => fetch(items, id),
        ),
      );
    });
  },
});

export const Form = Context.createScope('form');

export default Context;

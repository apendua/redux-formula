/* eslint global-require: "off" */
import {
  persistState,
} from 'redux-devtools';
import {
  compose,
  createStore,
  // applyMiddleware,
} from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';
import registerServiceWorker from './registerServiceWorker';
import rootReducer from './store/rootReducer';

const enhancer = compose(
  // eslint-disable-next-line no-underscore-dangle
  window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__({}) : x => x,
  persistState(
    window.location.href.match(
      /[?&]debug_session=([^&#]+)\b/,
    ),
  ),
);

const store = createStore(
  rootReducer,
  {},
  enhancer,
);

ReactDOM.render(
  <App store={store} />,
  document.getElementById('root'),
);

if (process.env.NODE_ENV !== 'production') {
  if (typeof module !== 'undefined' && module.hot) {
    module.hot.accept('./containers/App', () => {
      const NextApp = require('./containers/App').default;
      ReactDOM.render(
        <NextApp store={store} />,
        document.getElementById('root'),
      );
    });

    module.hot.accept('./store/rootReducer.js', () =>
      store.replaceReducer(require('./store/rootReducer.js').default),
    );
  }
}

registerServiceWorker();

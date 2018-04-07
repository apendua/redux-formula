import React from 'react';
import {
  P,
} from 'redux-formula';
import createComponentFactory from 'redux-formula/lib/store/createComponentFactory';
import createSectionComponent from 'redux-formula/lib/store/createSectionComponent';

const context = React.createContext({
  store: null,
});

const factory = createComponentFactory(context);

const f = {
  parse: P,
  context,
  connect: (...args) => {
    if (typeof args[1] === 'object') {
      return factory(...args);
    }
    return factory(P(...args));
  },
  Section: createSectionComponent(context),
};

export default f;

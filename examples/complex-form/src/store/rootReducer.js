import multiReducer from './multiReducer';

const rootReducer = multiReducer({
  sections: {
    ui: multiReducer,
  },
});

export default rootReducer;

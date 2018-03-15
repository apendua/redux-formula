import { createMultiReducer } from './multiReducer';

const formFieldReducer = createMultiReducer({
  initialState: {
    value: null,
  },
});

const formReducer = createMultiReducer({
  reducers: {
    field: formFieldReducer,
  },
});

const rootReducer = createMultiReducer({
  sections: {
    form: formReducer,
  },
});

export default rootReducer;

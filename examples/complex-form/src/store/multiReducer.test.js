/* eslint-env jest */

import { createMultiReducer } from './multiReducer';
import {
  set,
  scope,
  withReducer,
  del,
  push,
  pull,
} from './actions';

const reducer = createMultiReducer();

reducer.register('reducer/1', (state = {
  items: [],
}, action) => {
  switch (action.type) {
    default:
      return reducer(state, action);
  }
});

it('initializes state', () => {
  const newState = reducer(undefined, {});
  expect(newState).toEqual({});
});

it('sets a nested key', () => {
  const newState = reducer(undefined, set('a.b.c', 1));
  expect(newState).toEqual({
    a: {
      b: {
        c: 1,
      },
    },
  });
});

it('sets a nested key via scoped action', () => {
  const newState = reducer(undefined, scope('a', set('b.c', 1)));
  expect(newState).toEqual({
    a: {
      b: {
        c: 1,
      },
    },
  });
});

it('sets an element in nested array', () => {
  const wrappedSet = withReducer('reducer/1')(set);
  const newState = reducer(undefined, scope('a', wrappedSet('items.0', 1)));
  expect(newState).toEqual({
    a: {
      items: [1],
    },
  });
});

it('deletes a nested key', () => {
  const newState = reducer({
    a: { b: { c: 1 } },
  }, del('a.b.c'));
  expect(newState).toEqual({
    a: { b: {} },
  });
});

it('appends element to an array', () => {
  const newState = reducer({
    a: [1, 2],
  }, push('a', 3));
  expect(newState).toEqual({
    a: [1, 2, 3],
  });
});

it('removes element from an array', () => {
  const newState = reducer({
    a: [1, 2, 3],
  }, pull('a', 3));
  expect(newState).toEqual({
    a: [1, 2],
  });
});


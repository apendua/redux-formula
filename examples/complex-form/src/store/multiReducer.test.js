/* eslint-env jest */

import { createMultiReducer } from './multiReducer';
import {
  set,
  scope,
  del,
  push,
  pull,
} from './actions';

let reducer;
let reducerId;
let store1;
let store2;

const ACTION_PUSH = '@ACTION_PUSH';
const ACTION_PULL = '@ACTION_PULL';

describe('Basic multiReducer', () => {
  beforeEach(() => {
    reducer = createMultiReducer({
      initialState: {
        b: 0,
      },
    });
  });

  it('initializes state', () => {
    const newState = reducer(undefined, {});
    expect(newState).toEqual({
      b: 0,
    });
  });

  it('replaces entire state', () => {
    const newState = reducer({ a: 1 }, set('', { b: 2 }));
    expect(newState).toEqual({ b: 2 });
  });

  it('resets state to initial value', () => {
    const newState = reducer({ b: 1 }, del(''));
    expect(newState).toEqual({ b: 0 });
  });

  it('sets a nested key', () => {
    const newState = reducer(undefined, set('a.b.c', 1));
    expect(newState).toEqual({
      a: {
        b: {
          c: 1,
        },
      },
      b: 0,
    });
  });

  it('sets a nested key via scoped action', () => {
    const newState = reducer(undefined, scope('a')(set('b.c', 1)));
    expect(newState).toEqual({
      a: {
        b: {
          c: 1,
        },
      },
      b: 0,
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
});

describe('MultiReducer with components', () => {
  beforeEach(() => {
    reducer = createMultiReducer();
    reducerId = reducer.factory(pureReducer => (state = {
      items: [],
    }, action) => {
      switch (action.type) {
        case ACTION_PUSH:
          return {
            ...state,
            items: [
              ...state.items,
              action.payload,
            ],
          };
        case ACTION_PULL:
          return {
            ...state,
            items: state.items.slice(1),
          };
        default:
          return pureReducer(state, action);
      }
    });
  });

  it('sets an element in nested array', () => {
    const newState = reducer(undefined, scope('a', reducerId)(set('items.0', 1)));
    expect(newState).toEqual({
      a: {
        items: [1],
      },
    });
  });

  it('mutates states via a custom action', () => {
    const newState = reducer(undefined, scope('a', reducerId)({
      type: ACTION_PUSH,
      payload: 1,
    }));
    expect(newState).toEqual({
      a: {
        items: [1],
      },
    });
  });
});

describe('MultiReducer with sub reducers', () => {
  beforeEach(() => {
    reducer = createMultiReducer({
      sections: {
        b: createMultiReducer(),
      },
    });
    store1 = reducer.section('a.b');
    store2 = reducer.section('a.b.x');
  });

  it('initializes state', () => {
    const newState = reducer(undefined, {});
    expect(newState).toEqual({
      a: {
        b: {
          x: {},
        },
      },
      b: {},
    });
  });

  it('sets a value at nested key', () => {
    const newState = reducer({
      a: {
        b: {
          x: { y: 2 },
        },
      },
    }, store1.set('c', 1));
    expect(newState).toEqual({
      a: {
        b: {
          c: 1,
          x: {
            y: 2,
          },
        },
      },
    });
  });

  it('sets a value at nested key (2)', () => {
    const newState = reducer({
      a: {
        b: {
          x: { y: 2 },
        },
      },
    }, store2.set('y', 4));
    expect(newState).toEqual({
      a: {
        b: {
          x: {
            y: 4,
          },
        },
      },
    });
  });
});

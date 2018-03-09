import {
  ACTION_SCOPE_SET,
  ACTION_SCOPE_PUSH,
  ACTION_SCOPE_PULL,
  ACTION_SCOPE_DEL,
  ACTION_SCOPE,
} from './constants';

export const set = (key, value) => ({
  type: ACTION_SCOPE_SET,
  payload: value,
  meta: {
    key,
  },
});

export const push = (key, value) => ({
  type: ACTION_SCOPE_PUSH,
  payload: value,
  meta: {
    key,
  },
});

export const pull = (key, value) => ({
  type: ACTION_SCOPE_PULL,
  payload: value,
  meta: {
    key,
  },
});

export const del = key => ({
  type: ACTION_SCOPE_DEL,
  meta: {
    key,
  },
});

export const scope = (key, reducerId) => action => ({
  type: `${ACTION_SCOPE}.${action.type}`,
  payload: action,
  meta: {
    key,
    ...reducerId && { reducerId },
  },
});

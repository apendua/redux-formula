import {
  ACTION_SET,
  ACTION_PUSH,
  ACTION_PULL,
  ACTION_DEL,
  ACTION_SCOPE,
} from './constants';

export const set = (key, value) => ({
  type: ACTION_SET,
  payload: value,
  meta: {
    key,
  },
});

export const push = (key, value) => ({
  type: ACTION_PUSH,
  payload: value,
  meta: {
    key,
  },
});

export const pull = (key, value) => ({
  type: ACTION_PULL,
  payload: value,
  meta: {
    key,
  },
});

export const del = key => ({
  type: ACTION_DEL,
  meta: {
    key,
  },
});

export const scope = (section, reducer) => action => ({
  type: `${ACTION_SCOPE}.${action.type}`,
  payload: action,
  meta: {
    section,
    ...reducer && { reducer },
  },
});

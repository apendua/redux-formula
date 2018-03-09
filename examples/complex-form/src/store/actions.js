import {
  ACTION_SET,
  ACTION_PUSH,
  ACTION_PULL,
  ACTION_DEL,
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

export const scope = (section, reducer) => (action) => {
  const match = /@SCOPE\[(.*)\](.*)/.exec(action.type);
  let type;
  if (match) {
    type = `@SCOPE[${section}.${match[1]}]${match[2]}`;
  } else {
    type = `@SCOPE[${section}] ${action.type}`;
  }
  return {
    type,
    payload: action,
    meta: {
      section,
      ...reducer && { reducer },
    },
  };
};

/* eslint-env jest */

import {
  setAtKey,
  delAtKey,
  pushAtKey,
  pullAtKey,
} from './immutable';

describe('Test setAtKey', () => {
  it('sets a value at empty object', () => {
    const object = setAtKey({}, 'a', 1);
    expect(object).toEqual({ a: 1 });
  });

  it('sets a value at nested key', () => {
    const object = setAtKey({}, 'a.b', 1);
    expect(object).toEqual({ a: { b: 1 } });
  });

  it('does not affect existing values', () => {
    const object = setAtKey({ a: { c: 2 } }, 'a.b', 1);
    expect(object).toEqual({ a: { b: 1, c: 2 } });
  });

  it('does not automatically create an array', () => {
    const object = setAtKey({ a: null }, 'a.1', 1);
    expect(object).toEqual({ a: { 1: 1 } });
  });

  it('modifies an array if it already exists', () => {
    const object = setAtKey({ a: [0, 1, 2] }, 'a.1', 3);
    expect(object).toEqual({ a: [0, 3, 2] });
  });

  it('appends value at the end of array', () => {
    const object = setAtKey({ a: [0, 1, 2] }, 'a.3', 3);
    expect(object).toEqual({ a: [0, 1, 2, 3] });
  });

  it('does not set value outside array scope', () => {
    const object = setAtKey({ a: [0, 1, 2] }, 'a.4', 3);
    expect(object).toEqual({ a: [0, 1, 2] });
  });
});

describe('Test delAtKey', () => {
  it('delets a value from an object', () => {
    const object = delAtKey({ a: 1 }, 'a');
    expect(object).toEqual({});
  });
});

describe('Test pushAtKey', () => {
  it('appends value at an empty object', () => {
    const object = pushAtKey({}, 'a', 1);
    expect(object).toEqual({ a: [1] });
  });
});

describe('Test pullAtKey', () => {
  it('removes value from an object', () => {
    const object = pullAtKey({ a: [1] }, 'a', 1);
    expect(object).toEqual({ a: [] });
  });
});

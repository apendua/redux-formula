/* eslint-env jest */

import parse, { P } from './Compiler.parse';

test('parses a number literal', () => {
  expect(parse('1')).toEqual({
    '!': 1,
  });
});

test('parses a string literal', () => {
  expect(parse('"abc"')).toEqual({
    '!': 'abc',
  });
});

test('parses an identifier', () => {
  expect(parse('a')).toEqual({
    $: 'a',
  });
});

test('parses binary plus', () => {
  expect(parse('a+b')).toEqual({
    $add: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses dot operator', () => {
  expect(parse('a.b')).toEqual({
    $dot: [
      { $: 'a' },
      { '!': 'b' },
    ],
  });
});

test('parses chained dot operator', () => {
  expect(parse('a.b.c')).toEqual({
    $dot: [
      {
        $dot: [
          { $: 'a' },
          { '!': 'b' },
        ],
      },
      { '!': 'c' },
    ],
  });
});

test('parses index operator', () => {
  expect(parse('a[b]')).toEqual({
    $dot: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses call operator', () => {
  expect(parse('a(b)')).toEqual({
    '<<': [
      { $: 'b' },
    ],
    '>>': { $: 'a' },
  });
});

test('respects operator precedence', () => {
  expect(parse('a+b*c')).toEqual({
    $add: [
      { $: 'a' },
      {
        $mul: [
          { $: 'b' },
          { $: 'c' },
        ],
      },
    ],
  });
});

test('respects parenthesis', () => {
  expect(parse('(a+b)*c')).toEqual({
    $mul: [
      {
        $add: [
          { $: 'a' },
          { $: 'b' },
        ],
      },
      { $: 'c' },
    ],
  });
});

test('parses string with custom literals', () => {
  expect(P`a + ${{ x: 1, y: 2 }}`).toEqual({
    $add: [
      { $: 'a' },
      { '!': { x: 1, y: 2 } },
    ],
  });
});

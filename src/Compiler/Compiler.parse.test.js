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

test('parses <=', () => {
  expect(parse('a<=b')).toEqual({
    $lte: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses >=', () => {
  expect(parse('a>=b')).toEqual({
    $gte: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses <', () => {
  expect(parse('a<b')).toEqual({
    $lt: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});


test('parses >', () => {
  expect(parse('a>b')).toEqual({
    $gt: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses ==', () => {
  expect(parse('a==b')).toEqual({
    $eq: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses !=', () => {
  expect(parse('a!=b')).toEqual({
    $neq: [
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
  expect(parse('a.[b]')).toEqual({
    $dot: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses evaluate expression', () => {
  expect(parse('a(b)')).toEqual({
    '??': [
      { $: 'b' },
    ],
    '()': { $: 'a' },
  });
});

test('parses pipe operator', () => {
  expect(parse('a|b')).toEqual({
    '??': [
      { $: 'a' },
    ],
    '()': { $: 'b' },
  });
});

test('parses multi arguments pipe expression', () => {
  expect(parse('a,b,c|d')).toEqual({
    '??': [
      { $: 'a' },
      { $: 'b' },
      { $: 'c' },
    ],
    '()': { $: 'd' },
  });
});

test('parses consecutive pipe operator', () => {
  expect(parse('a|b|c')).toEqual({
    '??': [
      {
        '??': [
          { $: 'a' },
        ],
        '()': { $: 'b' },
      },
    ],
    '()': { $: 'c' },
  });
});

test('parses pipe expression followed by pipe operator', () => {
  expect(parse('a,b|c|d')).toEqual({
    '??': [
      {
        '??': [
          { $: 'a' },
          { $: 'b' },
        ],
        '()': { $: 'c' },
      },
    ],
    '()': { $: 'd' },
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

test('parses scope object', () => {
  expect(parse(`
  {
    a = 1
    b = 2
  }
  `)).toEqual({
    a: { '!': 1 },
    b: { '!': 2 },
  });
});

test('parses nested scope object', () => {
  expect(parse(`
  {
    a = 1
    b = {
      c = a + 1
    }
  }
  `)).toEqual({
    a: { '!': 1 },
    b: {
      c: {
        $add: [
          { $: 'a' },
          { '!': 1 },
        ],
      },
    },
  });
});

test('parses scope with unknowns', () => {
  expect(parse(`
  {
    ? x, y
    = x + y
  }
  `)).toEqual({
    '?': ['x', 'y'],
    '=': {
      $add: [
        { $: 'x' },
        { $: 'y' },
      ],
    },
  });
});

test('parses scope with unknowns and helper variables', () => {
  expect(parse(`
  {
    ? x, y
    result = x + y
    = result
  }
  `)).toEqual({
    '?': ['x', 'y'],
    result: {
      $add: [
        { $: 'x' },
        { $: 'y' },
      ],
    },
    '=': { $: 'result' },
  });
});

test('parses a list', () => {
  expect(parse(`
  [
    1
    a
  ]
  `)).toEqual([
    { '!': 1 },
    { $: 'a' },
  ]);
});

test('parses a nested list', () => {
  expect(parse(`
  {
    a = 1
    b = [
      1
      a
    ]
  }
  `)).toEqual({
    a: { '!': 1 },
    b: [
      { '!': 1 },
      { $: 'a' },
    ],
  });
});

test('parses a double nested list', () => {
  expect(parse(`
  [
    1
    [1 a]
  ]
  `)).toEqual([
    { '!': 1 },
    [
      { '!': 1 },
      { $: 'a' },
    ],
  ]);
});

test('parses mapping expression', () => {
  expect(parse(`
  {
    .. points
    -> { ? p = p.x }
    ~key = "id"
  }
  `)).toEqual({
    '..': { $: 'points' },
    '->': {
      '?': ['p'],
      '=': {
        $dot: [
          { $: 'p' },
          { '!': 'x' },
        ],
      },
    },
    '~key': { '!': 'id' },
  });
});

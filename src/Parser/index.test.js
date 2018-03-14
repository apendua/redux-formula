/* eslint-env jest */

import {
  parse,
} from './index';
import {
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_OPERATOR,
} from '../core/constants';

test('parses a number literal', () => {
  expect(parse([
    { type: TOKEN_TYPE_LITERAL, value: 1 },
  ])).toEqual({
    '!': 1,
  });
});

test('parses a string literal', () => {
  expect(parse([
    { type: TOKEN_TYPE_LITERAL, value: 'abc' },
  ])).toEqual({
    '!': 'abc',
  });
});

test('parses an identifier', () => {
  expect(parse([
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
  ])).toEqual({
    $: 'a',
  });
});

test('throws if expression is not entirely consumed', () => {
  expect(() => parse([
    { type: TOKEN_TYPE_LITERAL, value: 1 },
    { type: TOKEN_TYPE_LITERAL, value: 1 },
  ])).toThrow();
});

test('parses binary plus', () => {
  expect(parse([
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '+' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
  ])).toEqual({
    $add: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses dot operator', () => {
  expect(parse([
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '.' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
  ])).toEqual({
    $dot: [
      { $: 'a' },
      { '!': 'b' },
    ],
  });
});

test('parses chained dot operator', () => {
  expect(parse([
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '.' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
    { type: TOKEN_TYPE_OPERATOR, value: '.' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'c' },
  ])).toEqual({
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
  expect(parse([
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '.[' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
    { type: TOKEN_TYPE_OPERATOR, value: ']' },
  ])).toEqual({
    $dot: [
      { $: 'a' },
      { $: 'b' },
    ],
  });
});

test('parses call operator', () => {
  expect(parse([
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '(' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
    { type: TOKEN_TYPE_OPERATOR, value: ')' },
  ])).toEqual({
    '<<': [
      { $: 'b' },
    ],
    '>>': { $: 'a' },
  });
});

test('respects operator precedence', () => {
  expect(parse([
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '+' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
    { type: TOKEN_TYPE_OPERATOR, value: '*' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'c' },
  ])).toEqual({
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
  expect(parse([
    { type: TOKEN_TYPE_OPERATOR, value: '(' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '+' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
    { type: TOKEN_TYPE_OPERATOR, value: ')' },
    { type: TOKEN_TYPE_OPERATOR, value: '*' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'c' },
  ])).toEqual({
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

test('parses scope object', () => {
  expect(parse([
    { type: TOKEN_TYPE_OPERATOR, value: '{' },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: '=' },
    { type: TOKEN_TYPE_LITERAL, value: 1 },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
    { type: TOKEN_TYPE_OPERATOR, value: '=' },
    { type: TOKEN_TYPE_LITERAL, value: 2 },
    { type: TOKEN_TYPE_OPERATOR, value: '}' },
  ])).toEqual({
    a: { '!': 1 },
    b: { '!': 2 },
  });
});

test('parses a list', () => {
  expect(parse([
    { type: TOKEN_TYPE_OPERATOR, value: '[' },
    { type: TOKEN_TYPE_LITERAL, value: 1 },
    { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
    { type: TOKEN_TYPE_OPERATOR, value: ']' },
  ])).toEqual([
    { '!': 1 },
    { $: 'a' },
  ]);
});

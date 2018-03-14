# redux-formula

[![Build Status][travis-svg]][travis-url]

An alternative way for defining your redux selectors.

```javascript
import { formulaSelector } from 'redux-formula';
import { connect } from 'react-redux';

const Component = ({ a, b, c }) => (
  <span>{a} + {b} = {c}</span>
);

connect(
  formulaSelector(`
{
  a = $0.a
  b = $0.b
  c = a + b
}
  `),
)(Component);
```

# Installation

```
npm install --save redux-formula
```

[travis-svg]: https://travis-ci.org/apendua/redux-formula.svg?branch=master
[travis-url]: https://travis-ci.org/apendua/redux-formula

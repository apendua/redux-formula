# redux-formula

An alternative way for defining your redux selectors.

```javascript
import { formulaSelector } from 'redux-formula';
import { connect } from 'react-redux';

const Component = ({ a, b, c }) => (
  <span>{a} + {b} = {c}</span>
);

connect(
  formulaSelector({
    a: '$0.a',
    b: '$0.b',
    c: { $add: ['$a', '$b'] },
  }),
)(Component);
```

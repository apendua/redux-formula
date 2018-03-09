import React from 'react';
import { Form as F } from '../store/Context';

const Input = F.connect({
  value: '$state.value',
  edited: '$state.edited',
}, {
  onChange: ({ edited, $set }) => (e) => {
    $set('value', e.target.value);
    if (!edited) {
      $set('edited', true);
    }
  },
})(props => (
  <input value={(props.edited ? props.value : props.defaultValue) || ''} onChange={props.onChange} />
));

const Field = F.connect({
  value: '$state.value',
})(props => (
  <F.Section section={props.name} reducer="field">
    <Input defaultValue={props.defaultValue} />
  </F.Section>
));

const Form = F.connect({
  a: '$state.a.value',
  b: '$state.b.value',
  c: { $sum: ['$a', '$b'] },
})(props => (
  <form>
    <Field name="a" />
    <Field name="b" />
    <Field name="c" defaultValue={props.c} />
  </form>
));

export default () => (
  <F.Section section="form">
    <Form />
  </F.Section>
);

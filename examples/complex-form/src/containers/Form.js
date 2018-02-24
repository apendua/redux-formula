import React from 'react';
import formula, { FormulaContext } from '../store/formula';
import createScope from '../store/createScope';

const Section = createScope(FormulaContext);

const Input = formula({
  value: '$0.value',
  edited: '$0.edited',
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

const Field = formula({
  value: '$0.value',
})(props => (
  <Section name={props.name}>
    <Input defaultValue={props.defaultValue} />
  </Section>
));

const Form = formula({
  a: '$0.a.value',
  b: '$0.b.value',
  c: { $sum: ['$a', '$b'] },
})(props => (
  <form>
    <Field name="a" />
    <Field name="b" />
    <Field name="c" defaultValue={props.c} />
  </form>
));

export default () => (
  <Section name="ui.form">
    <Form />
  </Section>
);

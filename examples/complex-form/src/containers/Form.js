import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
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

const Select = F.connect({
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
  <select value={(props.edited ? props.value : props.defaultValue) || ''} onChange={props.onChange}>
    {map(props.options, ({
      value,
      label,
    }) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))}
  </select>
));

const Field = ({ name, component: Component, ...props }) => (
  <F.Section section={name} reducer="field">
    <div>
      <span>{name}</span>
      <Component {...props} />
    </div>
  </F.Section>
);

Field.propTypes = {
  component: PropTypes.func,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.string,
};

Field.defaultProps = {
  defaultValue: null,
  component: Input,
};

const typeOptions = [
  { value: '', label: 'Default' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Work', label: 'Work' },
];

const Form = F.connect({
  a: '$state.a.value',
  b: '$state.b.value',
  c: { $sum: ['$a', '$b'] },
  phones: '$state.phones',
}, {
  onAppend: ({ $push }) => () => {
    $push('phones', {});
  },
})(props => (
  <div>
    <Field name="a" />
    <Field name="b" />
    <Field name="c" defaultValue={props.c} />
    {map(props.phones, (phone, index) => (
      <F.Section key={index} section={`phones.${index}`}>
        <Field name="number" />
        <Field name="type" component={Select} options={typeOptions} />
      </F.Section>
    ))}
    <button onClick={props.onAppend}>
      Append
    </button>
  </div>
));

export default () => (
  <Fragment>
    <F.Section section="form">
      <Form />
    </F.Section>
    <F.Section section="form2">
      <Form />
    </F.Section>
  </Fragment>
);

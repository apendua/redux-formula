import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
import times from 'lodash/times';
import sum from 'lodash/sum';
import { Form as F } from '../store/Context';

const Input = F.connect({
  value: 'state.value',
  edited: 'state.edited',
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
  value: 'state.value',
  edited: 'state.edited',
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
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

Field.defaultProps = {
  defaultValue: null,
  component: Input,
};

const variantOptions = [
  { value: '', label: 'Default' },
  { value: '1', label: 'Variant 1' },
  { value: '2', label: 'Variant 2' },
  { value: '3', label: 'Variant 3' },
];

const amountOptions = [
  { value: 0, label: 'None' },
  { value: 1, label: 'One' },
  { value: 2, label: 'Two' },
  { value: 3, label: 'Three' },
];

const Item = F.connect(`{
  price = state.amount.value * 10
}`)(props => (
  <Fragment>
    <Field name="code" />
    <Field name="amount" component={Select} options={amountOptions} />
    <Field name="variant" component={Select} options={variantOptions} />
    <Field name="price" defaultValue={props.price} />
  </Fragment>
));

const Form = F.connect(`{
  nItems = state.items.length OR 0
  prices = {
    .. state.items
    -> {
      ? item
      # we need to fetch item price via api
      = (item.amount.value OR 0) * 10
    }
  }
}`,
  {
    onAppend: ({ $push }) => () => {
      $push('items', {});
    },
  },
)(props => (
  <div>
    {times(props.nItems, index => (
      <F.Section key={index} section={`items.${index}`}>
        <Item />
      </F.Section>
    ))}
    <button onClick={props.onAppend}>
      Add item
    </button>
    <span>Total price: {sum(props.prices)}</span>
  </div>
));

export default () => (
  <Fragment>
    <F.Section section="form">
      <Form />
    </F.Section>
  </Fragment>
);

/* eslint indent: "off" */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
import times from 'lodash/times';
import f from '../store/Formula';

const Input = f.connect(f.parse`{
  value = state.value
  edited = state.edited
  set = state:set
}`, {
  onChange: ({ edited, set }) => (e) => {
    set('value', parseInt(e.target.value, 10));
    if (!edited) {
      set('edited', true);
    }
  },
})(props => (
  <input value={(props.edited ? props.value : props.defaultValue) || ''} onChange={props.onChange} />
));

const Select = f.connect(f.parse`{
  value = state.value
  edited = state.edited
  set = state:set
}`, {
  onChange: ({ edited, set }) => (e) => {
    set('value', e.target.value);
    if (!edited) {
      set('edited', true);
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
  <f.Section state={`^state:${name}`} >
    <div>
      <span>{name}</span>
      <Component {...props} />
    </div>
  </f.Section>
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

const codeOptions = [
  { value: '', label: 'Please select one' },
  { value: '1', label: 'Item 1' },
  { value: '2', label: 'Item 2' },
  { value: '3', label: 'Item 3' },
  { value: '4', label: 'Item 4' },
];

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

const Item = f.connect`{
  state = ^state
  price = {
    # details = @api:fetch state.code.value
    details = {
      ready = "TRUE"
      price = 100
    }
    = (state.amount.value OR 1) * (@if details.ready, details.price, 0)
  }
}`(props => (
  <Fragment>
    <Field name="code" component={Select} options={codeOptions} />
    <Field name="amount" component={Select} options={amountOptions} defaultValue={1} />
    <Field name="variant" component={Select} options={variantOptions} />
    <Field name="price" defaultValue={props.price} />
  </Fragment>
));

const Form = f.connect`{
  nItems = state.items.length OR 0
  onAppend = { ? = state:push("items", {}) }
  totalPrice = state.items
    @map {
      ? item
      = (
        @if item.price.edited
          , item.price.value
          , {
            # we need to fetch item price via api
            # details = @api:fetch item.code.value
            details = {
              ready = "TRUE"
              price = 100
            }
            = (
              @if details.ready
                , (item.amount.value OR 1) * details.price
                , 0
            )
          }
      )
    }
    @reduce {
      ? a, b = a + b
    }
}`(props => (
  <div>
    {times(props.nItems, index => (
      <f.Section key={index} state={`^state:items:${index}`}>
        <Item />
      </f.Section>
    ))}
    <button onClick={props.onAppend}>
      Add item
    </button>
    <span>Total price: {props.totalPrice}</span>
  </div>
));

export default () => (
  <Fragment>
    <f.Section api="{}">
      <f.Section state="^state:form:cart1">
        <Form />
      </f.Section>
      <f.Section state="^state:form:cart2">
        <Form />
      </f.Section>
    </f.Section>
  </Fragment>
);

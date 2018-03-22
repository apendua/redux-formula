import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash/map';
import times from 'lodash/times';
import Context, * as context from '../store/Context';

const FormSection = context.Form.Section;

const connect = Context.createConnect([
  {
    name: 'api',
    scope: context.Api,
  },
  {
    name: 'state',
    scope: context.Form,
  },
]);

const Input = connect({
  value: 'state.value',
  edited: 'state.edited',
}, {
  onChange: ({ edited, $set }) => (e) => {
    $set('state.value', parseInt(e.target.value, 10));
    if (!edited) {
      $set('state.edited', true);
    }
  },
})(props => (
  <input value={(props.edited ? props.value : props.defaultValue) || ''} onChange={props.onChange} />
));

const Select = connect({
  value: 'state.value',
  edited: 'state.edited',
}, {
  onChange: ({ edited, $set }) => (e) => {
    $set('state.value', e.target.value);
    if (!edited) {
      $set('state.edited', true);
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
  <FormSection section={name} reducer="field">
    <div>
      <span>{name}</span>
      <Component {...props} />
    </div>
  </FormSection>
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

const Item = connect(`{
  price = {
    details = @api:fetch state.code.value
    = (state.amount.value OR 1) * (@if details.ready, details.price, 0)
  }
}`)(props => (
  <Fragment>
    <Field name="code" component={Select} options={codeOptions} />
    <Field name="amount" component={Select} options={amountOptions} defaultValue={1} />
    <Field name="variant" component={Select} options={variantOptions} />
    <Field name="price" defaultValue={props.price} />
  </Fragment>
));

const Form = connect(`{
  nItems = state.items.length OR 0
  totalPrice = state.items
    @map {
      ? item
      = (
        @if item.price.edited
          , item.price.value
          , {
            # we need to fetch item price via api
            details = @api:fetch item.code.value
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
}`,
  {
    onAppend: ({ $push }) => () => {
      $push('state.items', {});
    },
  },
)(props => (
  <div>
    {times(props.nItems, index => (
      <FormSection key={index} section={`items.${index}`}>
        <Item />
      </FormSection>
    ))}
    <button onClick={props.onAppend}>
      Add item
    </button>
    <span>Total price: {props.totalPrice}</span>
  </div>
));

export default () => (
  <Fragment>
    <FormSection section="cart1">
      <Form />
    </FormSection>
    <FormSection section="cart2">
      <Form />
    </FormSection>
  </Fragment>
);

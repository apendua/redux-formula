import {
  createSelector,
} from 'reselect';

const constant = x => () => x;

const createSpreadsheet = () => {
  const empty = {};
  return createSelector(constant(empty));
};

export default createSpreadsheet;

import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';
import get from 'lodash/get';
import { split } from '../utils';

const pluginReference = {
  createCompiler: () => next => (expression) => {
    if (!isPlainObject(expression) || !has(expression, '$')) {
      return next(expression);
    }
    const [name, dataKey] = split(expression.$);
    return {
      deps: { [name]: name },
      bindTo: scope => scope.boundSelector(
        scope.resolve(name).selector,
        value => (dataKey ? get(value, dataKey) : value),
      ),
    };
  },
};

export default pluginReference;

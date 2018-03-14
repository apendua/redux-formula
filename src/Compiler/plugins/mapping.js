import isPlainObject from 'lodash/isPlainObject';
import has from 'lodash/has';
import memoizeMapValues from '../../utils/memoizeMapValues';

const pluginMapping = {
  createCompiler: ({ compile }) => next => (expression) => {
    if (!isPlainObject(expression) || !has(expression, '<-')) {
      return next(expression);
    }
    const {
      '<-': inputExpr,
      '->': mapValueExpr,
      '~key': keyExpr,
    } = expression;
    const input = compile(inputExpr);
    const mapValue = compile(mapValueExpr);
    const key = keyExpr ? compile(keyExpr) : null;
    return {
      deps: Object.assign(
        {},
        input.deps,
        mapValue.deps,
        key && key.deps,
      ),
      bindTo: (scope) => {
        const selectGetKey = key ? key.bindTo(scope) : scope.createConstantSelector(null);
        const selectMapping = scope.boundSelector(
          mapValue.bindTo(scope),
          selectGetKey,
          (mapOneValue, getKey) => memoizeMapValues(mapOneValue, getKey),
        );
        const selectInput = input.bindTo(scope);
        return scope.boundSelector(
          selectMapping,
          selectInput,
          (x, y) => x(y),
        );
      },
    };
  },
};

export default pluginMapping;

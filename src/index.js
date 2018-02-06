import Compiler from './Compiler';
import Scope from './Scope';
import presetDefault from './presets/default';

const defaultCompiler = new Compiler({
  plugins: presetDefault,
});
const formulaSelector = expression => defaultCompiler.createSelector(expression);
const formulaSelectorFactory = (expression) => {
  const formula = defaultCompiler.createFormula(expression);
  return (...args) => formula.bindTo(...args);
};

export {
  formulaSelectorFactory,
  defaultCompiler,
  Compiler,
  Scope,
};

export default formulaSelector;

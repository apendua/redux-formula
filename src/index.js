import Compiler, {
  Scope,
} from './Compiler';
import presetDefault from './Compiler/presets/default';

const defaultCompiler = new Compiler({
  plugins: presetDefault,
});
const formulaSelector = expression => defaultCompiler.createSelector(expression);
const formulaSelectorFactory = (expression) => {
  const formula = defaultCompiler.createFormula(expression);
  return (...args) => formula.bindTo(...args);
};

export {
  formulaSelector,
  formulaSelectorFactory,
  defaultCompiler,
  Compiler,
  Scope,
};

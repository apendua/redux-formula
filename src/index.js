import Compiler from './Compiler';
import Scope from './Scope';
import presetDefault from './presets/default';

const defaultCompiler = new Compiler({
  plugins: presetDefault,
});
const formulaSelector = expression => defaultCompiler.createSelector(expression);

export {
  defaultCompiler,
  Compiler,
  Scope,
};

export default formulaSelector;

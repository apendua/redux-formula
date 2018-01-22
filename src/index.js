import Compiler from './Compiler';
import Scope from './Scope';

const defaultCompiler = new Compiler();
const formulaSelector = expression => defaultCompiler.createFormulaSelector(expression);

export {
  Compiler,
  Scope,
};

export default formulaSelector;

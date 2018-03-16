import pluginLiteral from '../plugins/literal';
import pluginArray from '../plugins/array';
import pluginReference from '../plugins/reference';
import pluginFunction from '../plugins/function';
import pluginMacro from '../plugins/macro';
import pluginOverwrite from '../plugins/overwrite';
import pluginSubExpression from '../plugins/subExpression';
import pluginDefaultOperators from '../plugins/defaultOperators';

const preset = [
  pluginLiteral,
  pluginArray,
  pluginReference,
  pluginFunction,
  pluginMacro,
  pluginOverwrite,
  pluginSubExpression,
  pluginDefaultOperators,
];

export default preset;

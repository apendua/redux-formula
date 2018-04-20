import pluginLiteral from '../plugins/literal';
import pluginArray from '../plugins/array';
import pluginEllipsis from '../plugins/ellipsis';
import pluginReference from '../plugins/reference';
import pluginFunction from '../plugins/function';
import pluginMacro from '../plugins/macro';
import pluginOverwrite from '../plugins/overwrite';
import pluginSubExpression from '../plugins/subExpression';
import pluginDefaultOperators from '../plugins/defaultOperators';
import pluginNamespace from '../plugins/namespace';

const preset = [
  pluginLiteral,
  pluginArray,
  pluginNamespace,
  pluginReference,
  pluginFunction,
  pluginMacro,
  pluginEllipsis,
  pluginOverwrite,
  pluginSubExpression,
  pluginDefaultOperators,
];

export default preset;

import pluginLiteral from '../plugins/literal';
import pluginArray from '../plugins/array';
import pluginReference from '../plugins/reference';
import pluginOverwrite from '../plugins/overwrite';
import pluginSubExpression from '../plugins/subExpression';

const preset = [
  pluginLiteral,
  pluginArray,
  pluginReference,
  pluginOverwrite,
  pluginSubExpression,
];

export default preset;

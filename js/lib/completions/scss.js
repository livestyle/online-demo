import {completions, variable, mixin} from './utils';

export default function(editor, analysis) {
	var pos = editor.indexFromPos(editor.getCursor());
	var node = analysis.source.nodeForPos(pos);

	if (node && node.type === 'property') {
		return completionsForProperty(editor, node, pos);
	}
}

/**
 * Returns list of completions for given property node
 * @param  {CodeMirror} editor Editor instance
 * @param  {Node} node   Source node from stylesheet analysis
 * @param  {Number} pos    Caret position, index
 * @return {Array}
 */
function completionsForProperty(editor, node, pos) {
	var c = node.parent.analysis.completions;
	if (!c || pos < node.nameRange[1]) {
		// caret is inside property name: no completions
		return;
	}

	var list;

	if (/^@include/.test(node.name)) {
		// user is typing mixin include
		if (c.mixins) {
			list = mixin(c.mixins);
		}
	} else {
		list = variable(c.variables);
	}

	if (list) {
		return completions(editor, list);
	}
}
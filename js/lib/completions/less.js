import {completions, variable, mixin} from './utils';

export default function(editor, analysis) {
	var pos = editor.indexFromPos(editor.getCursor());
	var node = analysis.source.nodeForPos(pos);

	if (node) {
		if (node.type === 'property') {
			return completionsForProperty(editor, node, pos);
		}

		if (node.type === 'section') {
			return completionsForSection(editor, node, pos);
		}
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
	var compl = node.parent.analysis.completions;
	if (!compl || pos < node.nameRange[1]) {
		// caret is inside property name:
		// it can be either regular property or mixin invocation
		return /^[.#]/.test(node.name) ? completionsForSection(editor, node, pos) : null;
	}

	return completions(editor, variable(compl.variables));
}

/**
 * Returns list of completions for given section node
 * @param  {CodeMirror} editor Editor instance
 * @param  {Node} node   Source node from stylesheet analysis
 * @param  {Number} pos    Caret position, index
 * @return {Array}
 */
function completionsForSection(editor, node, pos) {
	var completions = node.parent.analysis.completions;
	if (!completions) {
		return;
	}

	pos = editor.posFromIndex(pos);
	var reMixinChar = /[a-z0-9.#\-_]/i;

	// match context mixin name
	var line = editor.getLine(pos.line);
	var [start, end] = [pos.ch, pos.ch];

	while (start > 0) {
		if (!reMixinChar.test(line.charAt(--start))) {
			start++;
			break;
		}
	}

	while (end < line.length) {
		if (!reMixinChar.test(line.charAt(end))) {
			break;
		}
		end++;
	}

	return {
		list: mixin(completions.mixins),
		from: {line: pos.line, ch: start},
		to: {line: pos.line, ch: end}
	};
}
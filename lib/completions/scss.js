var reWordChar = /[a-z0-9\$]/i;

export default function(analysis, editor) {
	var pos = editor.indexFromPos(editor.getCursor());
	var node = analysis.source.nodeForPos(pos);

	if (!node) {
		return;
	}

	var completions = node.type === 'property' 
		? completionsForProperty(node, pos, editor) 
		: null;

	return completions;
}

/**
 * Returns list of completions for given property node
 * @param  {Node} node   Source node from stylesheet analysis
 * @param  {Number} pos    Caret position, index
 * @param  {CodeMirror} editor Editor instance
 * @return {Array}
 */
function completionsForProperty(node, pos, editor) {
	var completions = node.parent.analysis.completions;
	if (!completions || pos < node.nameRange[1]) {
		// caret is inside property name: no completions
		return;
	}

	var list;

	if (/^@include/.test(node.name)) {
		// user is typing mixin include
		if (completions.mixins) {
			list = mixinCompletions(completions.mixins);
		}
	} else {
		list = variableCompletions(completions.variables);
	}

	if (list) {
		return {
			list: variableCompletions(completions.variables),
			from: wordStart(editor),
			to: wordEnd(editor)
		};
	}
}

function variableCompletions(vars) {
	return Object.keys(vars).map(name => {
		return {
			text: name,
			displayText: `${name}: ${vars[name]}`
		};
	});
}

function mixinCompletions(mixins) {
	return mixins.map(mx => {
		var args = '';
		if (mx.arguments.length) {
			args = `(${mx.arguments.map(a => a.name)})`;
		}
		return mx.name + args;
	});
}

function wordStart(editor) {
	var cursor = editor.getCursor();
	var line = editor.getLine(cursor.line);
	var ch = cursor.ch;
	while (ch > 0) {
		if (!reWordChar.test(line.charAt(--ch))) {
			ch++;
			break;
		}
	}

	return {line: cursor.line, ch};
}

function wordEnd(editor) {
	var cursor = editor.getCursor();
	var line = editor.getLine(cursor.line);
	var ch = cursor.ch;
	
	while (ch < line.length) {
		if (!reWordChar.test(line.charAt(ch))) {
			break;
		}
		ch++;
	}

	return {line: cursor.line, ch};
}
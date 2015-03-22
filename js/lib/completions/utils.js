var reWordChar = /[a-z0-9\$@\-_]/i;

export function completions(editor, list) {
	return {
		list: list,
		from: wordStart(editor),
		to: wordEnd(editor)
	};
}

export function variable(vars) {
	return Object.keys(vars).map(name => {
		return {
			text: name,
			displayText: `${name}: ${vars[name]}`
		};
	});
}

export function mixin(mixins) {
	return mixins.map(mx => {
		var args = '';
		if (mx.arguments.length) {
			args = `(${mx.arguments.map(a => a.name)})`;
		}
		return mx.name + args;
	});
}

export function wordStart(editor) {
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

export function wordEnd(editor) {
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
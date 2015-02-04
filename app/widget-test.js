import CodeMirror from 'codemirror';
import 'codemirror/mode/css/css';
import 'codemirror/keymap/sublime';

var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
	lineNumbers: true,
	mode: 'text/x-scss'
});

var lineWidget = document.createElement('div');
lineWidget.className = 'line-widget';
lineWidget.innerText = 'ul.nav li';

editor.on('change', function(instance, change) {
	var start = change.from;
	var delta = {
		line: change.text.length - change.removed.length, 
		ch: change.text[0].length - change.removed[0].length
	};

	console.log(delta, change);
});

// editor.addLineWidget(6, lineWidget, {
// 	above: true
// });
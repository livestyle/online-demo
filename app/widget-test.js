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

editor.addLineWidget(6, lineWidget, {
	above: true
});
import widgetOverlay from '../lib/widget-overlay';
import CodeMirror from 'codemirror';
import 'codemirror/mode/css/css';
import 'codemirror/keymap/sublime';

function createWidget(type, text) {
	var widget = document.createElement('div');
	widget.className = `ls-widget ls-widget__${type}`;
	widget.innerText = text;
}

var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
	lineNumbers: true,
	mode: 'text/x-scss'
});



var overlay = widgetOverlay(editor);
var widget = createWidget('label', 'ul.nav li');
overlay.add(widget, 6);
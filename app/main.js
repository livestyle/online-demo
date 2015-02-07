import patcher from 'livestyle-patcher';
import CodeMirror from 'codemirror';

import widgetOverlay from '../lib/widget-overlay';
import client from '../lib/client';
import crc32 from '../lib/crc32';
import analyzer from '../lib/analyzer';
import widgetOverlay from '../lib/widget-overlay';

import 'codemirror/mode/css/css';
import 'codemirror/keymap/sublime';

function createWidget(type, text = '') {
	var widget = document.createElement('div');
	widget.className = `ls-widget ls-widget__${type}`;
	widget.innerText = text;
	return widget;
}

function editorPayload(editor, data) {
	var content = editor.getValue();
	var result = {
		uri: '/demo/sample.scss',
		syntax: 'scss',
		hash: crc32(content),
		content: content
	};
	if (data) {
		Object.keys(data).forEach(key => result[key] = data[key]);
	}
	return result;
}

function processAnalysis(editor, data, overlay, widget) {
	overlay.clear();
	var nodes = data.source.all();
	
	// setup secton selectors
	nodes.forEach(node => {
		if (node.analysis.selector) {
			let widget = createWidget('label', node.analysis.selector);
			let pos = editor.posFromIndex(node.nameRange[1]);
			overlay.add(widget, pos.line);
		}
	});

	showContextHint(editor, data, overlay, widget);
}

function showContextHint(editor, analysis, overlay, widget) {
	var pos = editor.getCursor();
	var ix = editor.indexFromPos(pos);
	var node = analysis.source.nodeForPos(ix);
	overlay.remove(widget);
	if (node && node.type === 'property') {
		var refs = node.analysis.references;
		if (refs && refs.length && node.value !== refs[0].value) {
			let pos = editor.posFromIndex(node.valueRange[1]);
			widget.innerText = refs[0].value;
			overlay.add(widget, pos.line);
		}
	}
}

var lastAnalysis = null;
var contextWidget = createWidget('label');
var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
	lineNumbers: true,
	mode: 'text/x-scss'
});
var overlay = widgetOverlay(editor);

// init LiveStyle engine that will perform source 
// evaluation and diffing
var cq = patcher(client, {worker: '../out/worker.js'});

// Listen to Analyzer messages
cq.worker.addEventListener('message', function(evt) {
	var payload = evt.data;
	if (typeof payload === 'string') {
		payload = JSON.parse(payload);
	}

	if (payload.name === 'analysis') {
		lastAnalysis = analyzer(editor.getValue(), payload.data);
		processAnalysis(editor, lastAnalysis, overlay, contextWidget);
	}
});

editor.on('change', function() {
	// no need to calculate diff here, simply set 
	// `initial content` and read analysis data
	client.send('initial-content', editorPayload(editor));
});
editor.on('cursorActivity', function() {
	if (!lastAnalysis) {
		return;
	}

	showContextHint(editor, lastAnalysis, overlay, contextWidget);
});

client.send('initial-content', editorPayload(editor));
console.dir(editor);
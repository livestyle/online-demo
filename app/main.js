import patcher from 'livestyle-patcher';
import CodeMirror from 'codemirror';

import widgetOverlay from '../lib/widget-overlay';
import client from '../lib/client';
import crc32 from '../lib/crc32';
import analyzer from '../lib/analyzer';
import widgetOverlay from '../lib/widget-overlay';

import widget from '../lib/widgets/abstract';
import selectorWidget from '../lib/widgets/selector';
import mixinCallWidget from '../lib/widgets/mixin-call';
import variableSuggestWidget from '../lib/widgets/variable-suggest';

import 'codemirror/mode/css/css';
import 'codemirror/keymap/sublime';

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

function processAnalysis(editor, data, overlay) {
	overlay.clear();
	var nodes = data.source.all();
	
	// setup secton selectors
	nodes.forEach(node => {
		let widget, pos;
		if (node.analysis.selector) {
			widget = selectorWidget(node.analysis.selector);
		} else if (node.analysis.variableSuggest) {
			widget = variableSuggestWidget(node.analysis.variableSuggest, node, editor);
		}

		if (widget) {
			if (!pos) {
				pos = editor.posFromIndex(node.nameRange[1]);
			}
			overlay.add(widget, pos.line);
		}
	});
}

function showContextHint(editor, analysis, overlay, widget) {
	var pos = editor.getCursor();
	var ix = editor.indexFromPos(pos);
	var node = analysis.source.nodeForPos(ix);
	overlay.remove(widget);
	// console.log(node);
	if (node) {
		let content = null;
		if (node.analysis.mixinCall) {
			content = mixinCallWidget.content(node.analysis.mixinCall);
		} else if (node.type === 'property') {
			let refs = node.analysis.references;
			if (refs && refs.length && node.value !== refs[0].value) {
				content = refs[0].value;
			}
		}

		if (content) {
			widget.innerHTML = content;
			let pos = editor.posFromIndex(node.valueRange[1]);
			overlay.add(widget, pos.line);
		}
	}
}

var lastAnalysis = null;
var contextWidget = widget('label');
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
		processAnalysis(editor, lastAnalysis, overlay);
		showContextHint(editor, lastAnalysis, overlay, contextWidget);
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

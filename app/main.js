import patcher from 'livestyle-patcher';
import CodeMirror from 'codemirror';

import client from '../lib/client';
import crc32 from '../lib/crc32';
import analyzer from '../lib/analyzer';

import scssCompletions from '../lib/completions/scss';

import WidgetOverlay from '../lib/widget-overlay';
import SelectorWidget from '../lib/widgets/selector';
import MixinCallWidget from '../lib/widgets/mixin-call';
import VariableSuggestWidget from '../lib/widgets/variable-suggest';
import OutlineWidget from '../lib/widgets/outline';
import ComputedValueWidget from '../lib/widgets/computed-value';

import 'codemirror/mode/css/css';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/hint/show-hint'

var lastAnalysis = null;
var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
	lineNumbers: true,
	mode: 'text/x-scss'
});
var overlay = new WidgetOverlay(editor);

// init LiveStyle engine that will perform source 
// evaluation and diffing
var cq = patcher(client, {worker: '../out/worker.js'});

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

function resetWidgets(overlay) {
	overlay.clear();
	if (overlay.contextWidgetState && overlay.contextWidgetState.widget) {
		overlay.contextWidgetState.widget.dispose();
	}
	overlay.contextWidgetState = {};
}

function processAnalysis(data) {
	resetWidgets(overlay);
	
	// setup section selectors
	data.source.all().forEach(node => {
		let widget;
		if (node.analysis.selector) {
			widget = new SelectorWidget(node.analysis.selector);
		} else if (node.analysis.variableSuggest) {
			widget = new VariableSuggestWidget(node.analysis.variableSuggest, node);
		}

		if (widget) {
			let pos = overlay.editor.posFromIndex(node.nameRange[1]);
			overlay.add(widget, pos.line);
		}
	});
}

function showContextHint(analysis) {
	var editor = overlay.editor;
	var ix = editor.indexFromPos(editor.getCursor());
	var node = analysis.source.nodeForPos(ix);

	if (!overlay.contextWidgetState) {
		overlay.contextWidgetState = {};
	}

	if (node == overlay.contextWidgetState.node) {
		// on the same node as from previous call, do nothing
		return;
	}

	if (overlay.contextWidgetState.widget) {
		overlay.contextWidgetState.widget.dispose();
		overlay.contextWidgetState.widget = null;
	}

	if (node) {
		overlay.contextWidgetState.node = node;
		let widget;
		if (node.analysis.mixinCall) {
			widget = new MixinCallWidget(node.analysis.mixinCall);
		} else if (node.type === 'property') {
			// get computed property value
			let refs = node.analysis.references;
			if (refs && refs.length && node.value !== refs[0].value) {
				widget = new ComputedValueWidget(refs[0].value);
			}
		}

		if (widget) {
			let pos = editor.posFromIndex(node.valueRange[1]);
			overlay.add(widget, pos.line);
			overlay.contextWidgetState.widget = widget;
		}
	}
}

function showOutline() {
	overlay.add(new OutlineWidget(lastAnalysis), {left: '50%', top: 50});
}

function showCompletions(editor) {
	if (lastAnalysis) {
		editor.showHint({
			hint: editor => scssCompletions(lastAnalysis, editor)
		});
	}
}

// Listen to Analyzer messages
cq.worker.addEventListener('message', function(evt) {
	var payload = evt.data;
	if (typeof payload === 'string') {
		payload = JSON.parse(payload);
	}

	if (payload.name === 'analysis') {
		lastAnalysis = analyzer(editor.getValue(), payload.data);
		processAnalysis(lastAnalysis);
		showContextHint(lastAnalysis);
	}
});

editor.on('change', function() {
	// no need to calculate diff here, simply set 
	// `initial content` and read analysis data
	client.send('initial-content', editorPayload(editor));
});
editor.on('cursorActivity', function() {
	if (lastAnalysis) {
		showContextHint(lastAnalysis);
		// scssCompletions(lastAnalysis, editor);
	}
});

editor.setOption('extraKeys', {
	'Ctrl-O': showOutline,
	'Ctrl-Space': showCompletions
});

client.send('initial-content', editorPayload(editor));

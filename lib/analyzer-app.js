import patcher from 'livestyle-patcher';

import client from '../lib/client';
import crc32 from '../lib/crc32';
import analyzer from '../lib/analyzer';

import scssCompletions from '../lib/completions/scss';
import lessCompletions from '../lib/completions/scss';

import WidgetOverlay from '../lib/widget-overlay';
import SelectorWidget from '../lib/widgets/selector';
import MixinCallWidget from '../lib/widgets/mixin-call';
import VariableSuggestWidget from '../lib/widgets/variable-suggest';
import OutlineWidget from '../lib/widgets/outline';
import ComputedValueWidget from '../lib/widgets/computed-value';

var completions = {
	scss: scssCompletions,
	less: lessCompletions
};
var knownModes = {
	'text/css':    'css',
	'text/x-scss': 'scss',
	'text/x-less': 'less'
};

// Init LiveStyle engine that will perform source 
// parsing and evaluation
var cq = patcher(client, {worker: '../out/worker.js'});

/**
 * Update content of editor
 * @param {String} content
 * @param {String} contentSyntax
 */
export default function(editor) {
	var overlay = new WidgetOverlay(editor);
	var analysis = null;
	var keymap = {
		'Ctrl-O': () => showOutline(analysis, overlay),
		'Ctrl-Space': () => showCompletions(analysis, editor)
	};

	var listeners = {
		onWorkerMessage(evt) {
			var payload = getPayload(evt);
			if (payload.name === 'analysis') {
				analysis = analyzer(editor.getValue(), payload.data);
				processAnalysis(analysis, overlay);
				showContextHint(analysis, overlay);
			}
		},
		onChange(editor) {
			// no need to calculate diff here, simply set 
			// `initial content` and read analysis data
			client.send('initial-content', editorPayload(editor));
		},
		onCursorActivity(editor) {
			if (analysis) {
				showContextHint(analysis, overlay);
			}
		}
	};

	cq.worker.addEventListener('message', listeners.onWorkerMessage);
	editor.on('change', listeners.onChange);
	editor.on('cursorActivity', listeners.onCursorActivity);
	editor.addKeyMap(keymap);

	client.send('initial-content', editorPayload(editor));

	return {
		editor: editor,
		dispose() {
			cq.worker.removeEventListener('message', listeners.onWorkerMessage);

			editor.off('change', listeners.onChange);
			editor.off('cursorActivity', listeners.onCursorActivity);
			editor.removeKeyMap(keymap);
			
			resetWidgets(overlay);
			overlay.dispose();
		}
	};
}

function getPayload(evt) {
	var payload = evt.data;
	if (typeof payload === 'string') {
		payload = JSON.parse(payload);
	}
	return payload;
}

function getSyntax(editor) {
	var mode = editor.getOption('mode');
	if (typeof mode === 'object') {
		mode = mode.name;
	}

	return knownModes[mode] || mode;
}

function editorPayload(editor, data) {
	var content = editor.getValue();
	var syntax = getSyntax(editor);
	var result = {
		uri: '/demo/sample.' + syntax,
		syntax: syntax,
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

function processAnalysis(analysis, overlay) {
	resetWidgets(overlay);
	
	// setup section selectors
	analysis.source.all().forEach(node => {
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

function showContextHint(analysis, overlay) {
	var editor = overlay.editor;
	var ix = editor.indexFromPos(editor.getCursor());
	var node = analysis.source.nodeForPos(ix);

	if (!overlay.contextWidgetState) {
		overlay.contextWidgetState = {};
	}

	var cws = overlay.contextWidgetState;

	if (node == cws.node) {
		// on the same node as from previous call, do nothing
		return;
	}

	if (cws.widget) {
		cws.widget.dispose();
		cws.widget = null;
	}

	if (node) {
		cws.node = node;
		let widget;
		if (node.analysis.mixinCall) {
			widget = new MixinCallWidget(node.analysis.mixinCall);
		} else if (node.type === 'property') {
			// get computed property value
			let computed = node.analysis.computed;
			if (computed && node.value !== computed) {
				widget = new ComputedValueWidget(computed);
			}
		}

		if (widget) {
			let pos = editor.posFromIndex(node.valueRange[1]);
			overlay.add(widget, pos.line);
			cws.widget = widget;
		}
	}
}

function showOutline(analysis, overlay) {
	overlay.add(new OutlineWidget(analysis), {left: '50%', top: 50});
}

function showCompletions(analysis, editor) {
	var syntax = getSyntax(editor);
	if (syntax in completions && analysis) {
		if (editor.showHint) {
			editor.showHint({
				hint: editor => completions[syntax](editor, analysis)
			});
		} else {
			console.warn('LiveStyle completions are not available: %chint/show-hint %cCodeMirror addon is not available', 'font-style: italic', '');
		}
	}
}

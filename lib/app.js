define(function(require) {
	var CodeMirror = require('../node_modules/codemirror/lib/codemirror');
	var client = require('./client');
	var patcher = require('../node_modules/livestyle-patcher/index');
	var crc32 = require('./crc32');
	
	require('../node_modules/codemirror/mode/css/css');
	require('../node_modules/codemirror/keymap/sublime');

	// init LiveStyle engine that will perform source 
	// evaluation and diffing
	patcher(client, {worker: './out/worker.js'});

	var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
		lineNumbers: true,
		mode: 'text/x-scss'
	});
	var iframe = document.getElementById('preview-pane').contentWindow;

	function editorPayload(data) {
		var content = editor.getValue();
		var result = {
			uri: '/demo/sample.scss',
			syntax: 'scss',
			hash: crc32(content),
			content: content
		};
		if (data) {
			Object.keys(data).forEach(function(key) {
				result[key] = data[key];
			});
		}
		return result;
	}

	editor.on('change', function() {
		client.send('calculate-diff', editorPayload());
	});

	client
	.on('diff', function(data) {
		iframe.postMessage({
			name: 'livestyle-patch',
			payload: data
		}, location.origin);
	})
	.on('error', function(err) {
		console.error(err);
	});
	
	client.send('initial-content', editorPayload());
});
var CodeMirror = require('codemirror');
var client = require('./client');
var patcher = require('livestyle-patcher');
var crc32 = require('./crc32');
var analyzer = require('./analyzer');

require('codemirror/mode/css/css');
require('codemirror/keymap/sublime');

// init LiveStyle engine that will perform source 
// evaluation and diffing
var cq = patcher(client, {worker: './out/worker.js'});

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

// Listen to Analyzer messages
cq.worker.addEventListener('message', function(evt) {
	var payload = evt.data;
	if (typeof payload === 'string') {
		payload = JSON.parse(payload);
	}

	if (payload.name === 'analysis') {
		var data = analyzer(editor.getValue(), payload.data);
		console.log(payload.data);
		console.log('Analysis', data);
	}
});

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
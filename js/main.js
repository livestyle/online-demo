/**
 * A minimal app required to add LiveStyle Analyzer support:
 * 1. Import `analyzer.js` file either as <script> tag or Require.js module.
 *    When imported as <script> tag, global `analyzer` function will be available.
 * 2. Init Nalayzer app by passing CodeMirror editor instance and 
 *    `option` argument with `worker` property that points to 
 *    LiveStyle engine worker file. Path must be either absolute
 *    or relative to host HTML page.
 */
import analyzerApp from './analyzer';

function $(sel, context) {
	return (context || document).querySelector(sel);
}

function $$(sel, context) {
	var res = (context || document).querySelectorAll(sel);
	return Array.prototype.slice.call(res, 0);
}

function pickSyntax() {
	var syntax = syntaxPicker.value;
	editor.setOption('mode', syntax);
	editor.setValue(codeSamples[syntax]);
}

$$('script').forEach(function(elem) {
	if (/^text\/x-/.test(elem.type)) {
		codeSamples[elem.type] = elem.innerHTML.trim();
	}
});

// setup app UI
var codeSamples = {};
var syntaxPicker = $('select[name="syntax"]');
syntaxPicker.addEventListener('change', pickSyntax);
pickSyntax();

// setup CodeMirror instance
var editor = CodeMirror.fromTextArea($('#editor'), {
	lineNumbers: true,
	indentWithTabs: true,
	indentUnit: 4
});
EmmetCodemirror(editor);

// init LiveStyle analyzer
var app = analyzerApp(editor, {worker: './js/worker.js'});
$$('[data-action="show-outline"]').forEach(item => item.addEventListener('click', app.showOutline));

editor.focus();
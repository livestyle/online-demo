import analyzerApp from './analyzer';

var codeSamples = {};
var syntaxPicker = $('select[name="syntax"]');
var editor = CodeMirror.fromTextArea($('#editor'), {
	lineNumbers: true,
	indentWithTabs: true,
	indentUnit: 4
});

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

syntaxPicker.addEventListener('change', pickSyntax);
pickSyntax();

var app = analyzerApp(editor);
EmmetCodemirror(editor);
$$('[data-action="show-outline"]').forEach(item => item.addEventListener('click', app.showOutline));
import EmmetCodemirror from 'emmet-codemirror';
import CodeMirror from 'codemirror';

import 'codemirror/mode/css/css.js';
import 'codemirror/keymap/sublime.js';
import 'codemirror/addon/hint/show-hint.js';

var emmet = EmmetCodemirror.emmet;
EmmetCodemirror.setup(CodeMirror);
window.CodeMirror = CodeMirror;
window.EmmetCodemirror = EmmetCodemirror;
window.emmet = emmet;

export {CodeMirror, EmmetCodemirror, emmet};
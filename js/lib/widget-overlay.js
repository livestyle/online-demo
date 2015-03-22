/**
 * Widget overlay: a special layer that holds widgets 
 * bound to specific code points in editor.
 * Positions of this widgets are updated accordingly 
 * on every editor change
 */
import {delegate} from './utils';

export default class WidgetOverlay {
	constructor(editor) {
		this.editor = editor;
		this.widgets = [];
		this.focusedWidget = null;

		var self = this;
		this._listeners = {
			onWidgetDispose: function() {
				self.remove(this); // `this` points to widget
			},
			onWrapperClick: function(evt) {
				if (self.focusedWidget) {
					self.focusedWidget.blur();
					self.focusedWidget = null;
				}
			},
			onWidgetClick: function(evt) {
				var widget = null;
				self.widgets.some(w => widget = w.widget.element === this ? w.widget : null);
				if (widget) {
					evt.stopPropagation();
					if (self.focusedWidget) {
						self.focusedWidget.blur();
					}
					widget.focus();
					self.focusedWidget = widget;
				}
			},
			onEditorChange: editorChangeHandler(this)
		};

		var elem = editor.getWrapperElement();
		elem.addEventListener('click', this._listeners.onWrapperClick);
		delegate(elem, 'click', '.ls-widget', this._listeners.onWidgetClick);
		editor.on('change', this._listeners.onEditorChange);
	}

	add(widget, line, ch) {
		var pos = this._pos(line, ch);
		if (pos.absolute) {
			this.editor.getWrapperElement().appendChild(widget.element);
		} else {
			this.editor.addWidget(pos, widget.element);
		}
		this.position(widget, pos);
		this.widgets.push({pos, widget});
		widget.attach(this.editor);
		widget.on('dispose', this._listeners.onWidgetDispose);
	}

	replace(widget, pos) {
		var pos = this._pos(line);
		this.removeFromPos(pos);
		this.add(widget, pos);
	}

	remove(widget) {
		widget.detach();
		widget.off('dispose', this._listeners.onWidgetDispose);
		this.widgets = this.widgets.filter(w => w.widget !== widget);
	}

	removeFromPos(pos) {
		pos = this._pos(pos);
		this.widgets
		.filter(w => w.pos.absolute ? w.pos.left === pos.left && w.pos.top === w.pos.top : w.pos.line === pos.line)
		.forEach(w => this.remove(w));
	}

	clear() {
		var old = this.widgets;
		this.widgets = [];
		old.forEach(w => this.remove(w.widget));
	}

	dispose() {
		this.clear();
		var elem = this.editor.getWrapperElement();
		elem.removeEventListener('click', this._listeners.onWrapperClick);
		elem.removeEventListener('click', _listeners.onWidgetClick);
		this.editor.off('change', this._listeners.onEditorChange);
		this.editor = null;
	}

	position(widget, line, ch) {
		if (arguments.length > 1) {
			// update widget position
			var pos = this._pos(line, ch);
			var coords = pos.absolute ? pos : this.editor.charCoords(pos, 'local');
			widget.position(coords.left, coords.top);
		}

		// return widget position
		var pos = null;
		this.widgets.some(w => w.widget === widget ? (pos = w.pos) : false);
		return pos;
	}

	_pos(line, ch) {
		if (typeof line === 'object') {
			if ('left' in line || 'x' in line) {
				line = {
					left: line.left || line.x,
					top: line.top || line.y,
					absolute: true
				}
			}
			return line;
		}

		if (typeof line === 'number' && typeof ch === 'undefined') {
			ch = this.editor.getLine(line).length;
		}

		return {line, ch};
	}
}

function editorChangeHandler(overlay) {
	return function(editor, change) {
		var pos = change.from;
		var delta = {
			line: change.text.length - change.removed.length, 
			ch: change.text[0].length - change.removed[0].length
		};

		if (delta.line) {
			// amount of lines has been changed,
			// update widgets accordingly
			
			if (delta.line < 0) {
				// remove widgets for removed lines
				let [min, max] = [change.from.line, change.to.line];
				overlay.widgets.forEach(w => {
					let line = w.pos.line;
					if (line > min && line <= max) {
						overlay.remove(w.widget);
					}
				});
			}

			// adjust widget positions
			overlay.widgets.forEach(w => {
				if (!w.pos.absolute && w.pos.line > pos.line) {
					w.pos.line += delta.line;
					overlay.position(w.widget, w.pos);
				}
			});
		}

		if (delta.ch) {
			// adjust widgets position on current line
			overlay.widgets.forEach(w => {
				if (w.pos.line === pos.line && w.pos.ch >= pos.ch) {
					w.pos.ch += delta.ch;
					overlay.position(w.widget, w.pos);
				}
			});
		}
	}
}
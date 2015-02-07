/**
 * Widget overlay: a special layer that holds widgets 
 * bound to specific code points in editor.
 * Positions of this widgets are updated accordingly 
 * on every editor change
 */
export class WidgetOverlay {
	constructor(editor) {
		this.editor = editor;
		this.widgets = [];

		editor.on('change', (instance, change) => {
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
					this.widgets.forEach(w => {
						let line = w.pos.line;
						if (line > min && line <= max) {
							this.remove(w.widget);
						}
					});
				}

				// adjust widget positions
				this.widgets.forEach(w => {
					if (w.pos.line > pos.line) {
						w.pos.line += delta.line;
						this.position(w.widget, w.pos);
					}
				});
			}

			if (delta.ch) {
				// adjust widgets position on current line
				this.widgets.forEach(w => {
					if (w.pos.line === pos.line && w.pos.ch >= pos.ch) {
						w.pos.ch += delta.ch;
						this.position(w.widget, w.pos);
					}
				});
			}
		});
	}

	add(widget, line, ch) {
		var pos = this._pos(line, ch);
		this.editor.addWidget(pos, widget);
		this.position(widget, line, ch);
		this.widgets.push({pos, widget});
	}

	remove(widget) {
		if (typeof widget === 'object' && 'widget' in widget) {
			widget = widget.widget;
		}

		if (widget.parentNode) {
			widget.parentNode.removeChild(widget);
		}
		this.widgets = this.widgets.filter(w => w.widget !== widget);
	}

	clear() {
		var old = this.widgets;
		this.widgets = [];
		old.forEach(w => this.remove(w.widget));
	}

	position(widget, line, ch) {
		if (arguments.length > 1) {
			var pos = this._pos(line, ch);
			var coords = this.editor.charCoords(pos, 'local');
			widget.style.left = coords.left + 'px';
			widget.style.top = coords.top + 'px';
		}

		var pos = null;
		this.widgets.some(w => w.widget === widget ? (pos = w.pos) : false);
		return pos;
	}

	_pos(line, ch) {
		if (typeof line === 'object') {
			return line;
		}

		if (typeof line === 'number' && typeof ch === 'undefined') {
			ch = this.editor.getLine(line).length;
		}

		return {line, ch};
	}
}

export default function(editor) {
	return new WidgetOverlay(editor);
}
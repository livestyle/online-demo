/**
 * Variable suggest widget:
 * displays suggested variables for static property value
 */
import Widget from './abstract';
import {delegate} from '../utils';
import colorPreview from './color-preview';

export default class VariableSuggestWidget extends Widget {
	constructor(content, node) {
		super('variable-suggest', content);
		this._node = node;

		var self = this;
		delegate(this.element, 'click', '.ls-suggestion', function(evt) {
			// replace node value in editor with suggested variable
			let from = self.editor.posFromIndex(self._node.valueRange[0]);
			let to = self.editor.posFromIndex(self._node.valueRange[1]);
			self.editor.replaceRange(this.dataset.suggest, from, to);
			self.editor.setCursor(from);
			self.editor.focus();
		});
	}

	content(suggestions) {
		super.content('<div class="ls-suggestion__title">Suggested variables:</div>' + suggestions.map(s => {
			var type = s.length === 4 ? 'color' : 'value';
			var preview = type === 'color' ? colorPreview(s[2], s[3]) : '';

			return `<div class="ls-suggestion" data-type="${type}" data-suggest="${s[0]}">
				${preview}
				<span class="ls-suggestion__name">${s[0]}</span>
				<span class="ls-suggestion__value">${s[1]}</span>
			</div>`;
		}).join(''));
	}

	focus() {
		this.element.dataset.active = true;
		super.focus();
	}

	blur() {
		delete this.element.dataset.active;
		super.blur();
	}
}
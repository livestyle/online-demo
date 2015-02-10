/**
 * Variable suggest widget:
 * displays suggested variables for static property value
 */
import w from './abstract';

export default function widget(suggestions, node, editor) {
	var elem = w('variable-suggest', content(suggestions));
	if (node && editor) {
		elem.addEventListener('click', function(evt) {
			this.dataset.active = true;
			click(evt, node, editor);
			evt.stopPropagation();
		});
	}
	return elem;
}

export function content(suggestions) {
	return '<div class="ls-suggestion__title">Suggested variables:</div>' + suggestions.map(s => {
		var preview = '';
		var type = s.length === 4 ? 'color' : 'value';
		if (type === 'color') {
			preview = `<i class="ls-suggestion__preview" style="background-color: ${s[2]}"${!s[3] ? ' data-exact="true"' : ''}></i>`;
		}

		return `<div class="ls-suggestion" data-type="${type}" data-suggest="${s[0]}">
			${preview}
			<span class="ls-suggestion__name">${s[0]}</span>
			<span class="ls-suggestion__value">${s[1]}</span>
		</div>`;
	}).join('');
}

export function click(evt, node, editor) {
	var ctx = closest(evt.target, 'ls-suggestion');
	if (!ctx) {
		return;
	}

	// replace node value in editor with suggested value
	let from = editor.posFromIndex(node.valueRange[0]);
	let to = editor.posFromIndex(node.valueRange[1]);
	editor.replaceRange(ctx.dataset.suggest, from, to);
	editor.setCursor(from);
	editor.focus();
}

function closest(elem, className) {
	while (elem && elem !== document) {
		if (elem.classList.contains(className)) {
			return elem;
		}
		elem = elem.parentNode;
	}
}

function toArray(obj, ix = 0) {
	return Array.prototype.slice.call(obj, ix);
}

document.addEventListener('click', function() {
	var widgets = toArray(document.querySelectorAll('.ls-widget__variable-suggest'));
	widgets.forEach(widget => delete widget.dataset.active);
});

widget.content = content;
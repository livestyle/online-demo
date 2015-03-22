/**
 * Mixin call widget: displays result of 
 * mixin call
 */
import Widget from './abstract';

export default class MixinCallWidget extends Widget {
	constructor(content) {
		super('mixin-call', content);
	}

	content(mixinCalls) {
		var content = mixinCalls.map(mx => {
			var name = mx.name;
			if (mx.arguments.length) {
				name += `(${mx.arguments.map(a => a.join(': ')).join(', ')})`;
			}

			return `<div class="ls-mixin-call">
				<div class="ls-mixin-call__name">${name}</div>
				<div class="ls-mixin-call__body">${stringifyOutput(mx.output)}</div>
			</div>`;
		}).join('');
		super.content(content);
	}
}

function stringifyOutput(output) {
	return output.map(mx => {
		if (typeof mx[1] === 'string') {
			return `<div class="ls-mixin-call__property">
				<span class="ls-mixin-call__property-name">${mx[0]}</span>
				<span class="ls-mixin-call__property-value">${mx[1]}</span>
			</div>`;
		}

		return `<div class="ls-mixin-call__property">
			<div class="ls-mixin-call__section-name">${mx[0]}</div>
			<div class="ls-mixin-call__section-body">${stringifyOutput(mx[1])}</div>
		</div>`;
	}).join('');
}
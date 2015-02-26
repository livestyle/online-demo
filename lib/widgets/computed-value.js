/**
 * Displays computed value for preprocessor property
 */
import Widget from './abstract';
import colorPreview from './color-preview';

export default class ComputedValueWidget extends Widget {
	constructor(value) {
		super('computed-value', value);
	}

	content(value) {
		super.content(colorPreview(value) + ' ' + value);
	}
}
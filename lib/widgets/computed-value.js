/**
 * Displays computed value for preprocessor property
 */
import Widget from './abstract';

export default class ComputedValueWidget extends Widget {
	constructor(value) {
		super('computed-value', value);
	}
}
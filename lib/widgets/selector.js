/**
 * Context selector widget: displays
 * resolved selector for given node
 */
import Widget from './abstract';

export default class SelectorWidget extends Widget {
	constructor(content) {
		super('selector', content);
	}

	content(value) {
		super.content(value);
		this.element.title = value;
	}
}
export default function(type, content = '') {
	var widget = document.createElement('div');
	widget.className = `ls-widget ls-widget__${type}`;
	widget.innerHTML = content;
	return widget;
}

export class Widget {
	constructor(type, content = '') {
		this.element = document.createElement('div');
		this.element.className = `ls-widget ls-widget__${type}`;
		this.element.innerHTML = content;
	}

	dispose() {
		if (this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
		this.element = null;
	}
};
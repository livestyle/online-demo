import eventMixin from '../eventMixin';
import {extend} from '../utils';

export default class Widget {
	constructor(type, content = '') {
		this.editor = null;
		this.element = document.createElement('div');
		this.element.className = `ls-widget ls-widget__${type}`;
		this.element.innerHTML = '<i class="ls-widget__tail"></i><div class="ls-widget__content"></div>';
		this.content(content);
	}

	/**
	 * Widget is attached to given editor
	 * @param  {CodeMirror} editor
	 */
	attach(editor) {
		this.editor = editor;
		this.emit('attach');
	}

	/**
	 * Widget is detached from editor
	 */
	detach() {
		this.editor = null;
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
		this.emit('detach');
	}

	/**
	 * Updates content of widget
	 * @param  {String} value
	 */
	content(value) {
		this.element.querySelector('.ls-widget__content').innerHTML = value;
		this.emit('update');
	}

	position(left, top) {
		left += typeof left === 'number' ? 'px' : '';
		top  += typeof top  === 'number' ? 'px' : '';

		this.element.style.left = left;
		this.element.style.top = top;
	}

	/**
	 * Widget receives focus
	 */
	focus() {
		this.emit('focus');
	}

	/**
	 * Widget looses focus
	 */
	blur() {
		this.emit('blur');
	}

	/**
	 * Widget is removed 
	 */
	dispose() {
		this.detach();
		this.element = null;
		this.emit('dispose');
	}
};

extend(Widget.prototype, eventMixin);
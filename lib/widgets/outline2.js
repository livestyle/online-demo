import {Widget} from './abstract';
import {toArray, querySelectorAll as $, delegate, closest} from './utils';
import nodeFilter from '../node-filter';

class OutlineWidget extends Widget {
	constructor(analysis, editor) {
		super('outline', content(analysis));

		var self = this;
		var elem = this.element;
		this.editor = editor;
		this.prevSelections = editor.listSelections();
		this.controls = $('.ls-outline__switch-label', elem);
		this.sections = $('.ls-outline__section', elem);
		
		this.sectionNodes = {};
		this.sections.forEach(section => {
			var name = section.dataset.type;
			this.sectionNodes[name] = $('.ls-outline__node', section);
		});

		// store event handlers to unbind them later
		this._toggleSectionHandler = function(evt) {
			self.toggleSection(this.dataset.target);
			evt.stopPropagation();
		};

		this._highlightNodeHandler = function(evt) {
			self.highlightNode(closest(this, '.ls-outline__node'), self.editor);
			self.dispose();
		};

		delegate(elem, 'click', '.ls-outline__switch-label', this._toggleSectionHandler);
		delegate(elem, 'click', '.ls-outline__node-label', this._highlightNodeHandler);
		var fld = this.searchField;
		fld.addEventListener('keydown', this.handleKeyEvent.bind(this));
		fld.addEventListener('blur', this.dispose.bind(this));
	}

	get searchField() {
		return this.element.querySelector('input[name="search"]');
	}

	get activeSection() {
		for (var i = 0, il = this.section.length; i < il; i++) {
			if (this.section[i].classList.contains(activeSectionClass)) {
				return this.section[i];
			}
		}
	}

	get activeSectionName() {
		var section = this.activeSection;
		return section ? section.dataset.type : void 0;
	}

	focus() {
		this.searchField.focus();
	}

	traverse(up) {
		var nodes = $('.ls-outline__section_active .ls-outline__node', this.element);
		var active = -1;
		nodes.some((n, i) => {
			if (n.classList.contains(nodeHlClass)) {
				active = i;
				return true;
			}
		});

		if (active === -1) {
			active = up ? 0 : nodes.length - 1;
		}

		nodes[active].classList.remove(nodeHlClass);
		let hl = nodes[(active + nodes.length + (up ? -1 : 1)) % nodes.length];
		this.highlightNode(hl);
	}

	highlightNode(node) {
		node.classList.add(nodeHlClass);
		if (node.scrollIntoViewIfNeeded) {
			node.scrollIntoViewIfNeeded();
		} else {
			node.scrollIntoView();
		}

		var range = node.dataset.range;
		if (range) {
			range = range.split(',').map(n => this.editor.posFromIndex(+n));
			this.editor.setSelection(...range);
		}
	}

	toggleSection(name) {
		if (typeof name !== 'string') {
			// section name is not a string: 
			// find next/prev section to select
			let selected = this.section.indexOf(this.activeSection);

			if (selected === -1) {
				selected = !name ? 0 : this.sections.length - 1;
			} else {
				selected = (selected + this.sections.length + (name ? -1 : 1)) % this.sections.length;
			}

			name = this.section[selected].dataset.type;
		}

		this.controls.forEach(s => s.classList.toggle(activeControlClass, s.dataset.target === name));
		this.sections.forEach(s => s.classList.toggle(activeSectionClass, s.dataset.type === name));
	}

	filter(str) {
		var nodes = this.sectionNodes[this.activeSectionName];
		if (!nodes) {
			return;
		}

		var section = this.activeSection;
		str = str.trim();

		if (!str) {
			section.classList.remove('ls-outline__section_filtered');
			nodeFilter.reset(section);
			return;
		}

		nodes.forEach(node => node.classList.remove('ls-outline__node_filtered'));
		nodeFilter(nodes, str, {textNode: '> .ls-outline__node-label'}).forEach(node => {
			node.classList.add('ls-outline__node_filtered');
		});
	}

	handleKeyEvent(evt) {
		switch (evt.keyCode) {
			case 9:  // tab
				this.toggleSection(evt.shiftKey);
				break;

			case 13: // enter
				this.dispose();
				break;

			case 27: // escape
				if (this.prevSelections) {
					editor.setSelections(this.prevSelections);
				}
				this.dispose();
				break;

			case 38: // up
			case 40: // down
				this.traverse(evt.keyCode === 38);
				break;

			default:
				let filter = this.searchField.value.trim();
				if (this._prevFilter !== filter) {
					this.filter(this.searchField.value);
				}
				return;
		}

		evt.preventDefault();
		evt.stopPropagation();
	}

	dispose() {
		super.dispose();
		this.element.removeEventListener('click', this._toggleSectionHandler);
		this.element.removeEventListener('click', this._highlightNodeHandler);
		this.editor.focus();
	}
}

export function content(analysis) {
	return `<input type="text" name="search" class="ls-outline__search" placeholder="Search..." />
	<ul class="ls-outline__switch">
		<li class="ls-outline__switch-label ls-outline__switch-label_active" data-target="source">Source</li>
		<li class="ls-outline__switch-label" data-target="result">Result</li>
	</ul>
	<div class="ls-outline__sections">
		<div class="ls-outline__section ls-outline__section_active" data-type="source">${stringifyTree(analysis.source, analysis.result)}</div>
		<div class="ls-outline__section" data-type="result">${stringifyTree(analysis.result, analysis.source)}</div>
	</div>`;
}

function stringifyTree(tree, counterTree) {
	var empty = [];
	return tree.children.map(node => {
		var content = '';
		if (node.type === 'property') {
			let sep = /^[@\.#]/.test(node.name) ? ' ' : ': ';
			content = `<div class="ls-outline__node-label">${node.name + sep + node.value}</div>`;
		} else {
			content = `<div class="ls-outline__node-label">${node.name}</div>
				<div class="ls-outline__node-body">${stringifyTree(node, counterTree)}</div>`;
		}

		var range = null;
		var rangeSource = node.origin ? counterTree.getById(node.origin) : node;
		if (rangeSource) {
			range = rangeSource.type === 'property' 
				? rangeSource.fullRange 
				: rangeSource.nameRange;
		}

		return `<div class="ls-outline__node" data-type="${node.type}" data-name="${node.name}" data-range="${(range || empty).join(',')}">${content}</div>`;
	}).join('');
}
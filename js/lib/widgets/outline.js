import Widget from './abstract';
import {toArray, querySelectorAll as $, delegate, closest} from '../utils';
import nodeFilter from '../node-filter';

var nodeHlClass = 'ls-outline__node_selected';
var activeControlClass = 'ls-outline__switch-label_active';
var activeSectionClass = 'ls-outline__section_active';
var filterOpt = {textNode: '.ls-outline__node-label'};

export default class OutlineWidget extends Widget {
	constructor(content) {
		super('outline', content);

		var self = this;
		var elem = this.element;
		var fld = this.searchField;
		var closeTimeout;

		this.prevSelections = null;
		this.controls = $('.ls-outline__switch-label', elem);
		this.sections = $('.ls-outline__section', elem);
		
		this.sectionNodes = {};
		this.sections.forEach(section => {
			var name = section.dataset.type;
			this.sectionNodes[name] = $('.ls-outline__node', section);
		});

		delegate(elem, 'click', '.ls-outline__switch-label', function(evt) {
			self.toggleSection(this.dataset.target);
			evt.preventDefault();
			evt.stopPropagation();
			fld.focus();
			if (closeTimeout) {
				clearTimeout(closeTimeout);
			}
		});
		delegate(elem, 'click', '.ls-outline__node-label', function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			self.highlightNode(closest(this, '.ls-outline__node'), self.editor);
			self.dispose();
		});

		fld.addEventListener('keydown', this.handleKeyEvent.bind(this));
		fld.addEventListener('keyup', evt => {
			let query = this.searchField.value.trim();
			if (this._prevQuery !== query) {
				this.filter(query);
				this._prevQuery = query;
			}
		});

		fld.addEventListener('blur', evt => {
			closeTimeout = setTimeout(this.dispose.bind(this), 150);
		});
	}

	content(analysis) {
		super.content(`
			<ul class="ls-outline__switch">
				<li class="ls-outline__switch-label ls-outline__switch-label_active" data-target="source">Source</li>
				<li class="ls-outline__switch-label" data-target="result">Result</li>
			</ul>
			<input type="text" name="search" class="ls-outline__search" placeholder="Filter..." />
			<div class="ls-outline__sections">
				<div class="ls-outline__section ls-outline__section_active" data-type="source">${stringifyTree(analysis.source, analysis.result)}</div>
				<div class="ls-outline__section" data-type="result">${stringifyTree(analysis.result, analysis.source)}</div>
			</div>
			<div class="ls-outline__tip">Use Tab key to toggle between source and result</div>`);
	}

	attach(editor) {
		super.attach(editor);
		this.prevSelections = editor.listSelections();
		this.searchField.focus();
	}

	get searchField() {
		return this.element.querySelector('input[name="search"]');
	}

	get activeSection() {
		var items = this.sections;
		for (var i = 0, il = items.length; i < il; i++) {
			if (items[i].classList.contains(activeSectionClass)) {
				return items[i];
			}
		}
	}

	get activeSectionName() {
		var section = this.activeSection;
		return section ? section.dataset.type : void 0;
	}

	traverse(up) {
		var nodes = this.sectionNodes[this.activeSectionName];
		var active = -1;
		
		if (this.activeSection.classList.contains('ls-outline__section_filtered')) {
			nodes = nodes.filter(node => node.classList.contains('ls-outline__node_filtered'));
		}

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
			let selected = this.sections.indexOf(this.activeSection);

			if (selected === -1) {
				selected = !name ? 0 : this.sections.length - 1;
			} else {
				selected = (selected + this.sections.length + (name ? -1 : 1)) % this.sections.length;
			}

			name = this.sections[selected].dataset.type;
		}

		this.controls.forEach(s => s.classList.toggle(activeControlClass, s.dataset.target === name));
		this.sections.forEach(s => s.classList.toggle(activeSectionClass, s.dataset.type === name));
	}

	filter(query) {
		query = query.trim();

		if (!query) {
			return this.sections.forEach(section => {
				section.classList.remove('ls-outline__section_filtered');
				nodeFilter.reset(section);
			});
		}

		this.sections.forEach(section => {
			section.classList.add('ls-outline__section_filtered');
			var nodes = this.sectionNodes[section.dataset.type];
			if (nodes) {
				nodes.forEach(node => node.classList.remove('ls-outline__node_filtered'));
				nodeFilter(nodes, query, filterOpt)
					.forEach(node => node.classList.add('ls-outline__node_filtered'));
			}
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
					this.editor.setSelections(this.prevSelections);
				}
				this.dispose();
				break;

			case 38: // up
			case 40: // down
				this.traverse(evt.keyCode === 38);
				break;

			default:
				return;
		}

		evt.preventDefault();
		evt.stopPropagation();
	}

	dispose() {
		if (this.element) {
			this.element.removeEventListener('click', this._toggleSectionHandler);
			this.element.removeEventListener('click', this._highlightNodeHandler);
			this.editor.focus();
		}
		super.dispose();
	}
}

function stringifyTree(tree, counterTree) {
	var empty = [];
	return tree.children.map(node => {
		var content = '';
		if (node.type === 'property') {
			let sep = /^[\.#]/.test(node.name) || node.name === '@include' ? ' ' : ': ';

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
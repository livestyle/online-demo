/**
 * Outline widget:
 * displays compact preview of source and result stylesheet trees
 */
import w from './abstract';
import * as utils from '../utils';

var $ = utils.querySelectorAll;
var nodeHlClass = 'ls-outline__node_selected';

export default function widget(analysis, editor) {
	var widget = w('outline', content(analysis));
	utils.delegate(widget, 'click', '.ls-outline__switch-label', function(evt) {
		toggleSection(widget, this.dataset.target);
		evt.stopPropagation();
	});

	widget.dataset.prevSelections = JSON.stringify(editor.listSelections());
	var input = widget.querySelector('input[name="search"]');
	input.addEventListener('keydown', evt => handleKeyEvent(evt, widget, editor));
	return widget;
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

export function focus(widget) {
	widget.querySelector('input[name="search"]').focus();
}

widget.content = content;
widget.focus = focus;

function handleKeyEvent(evt, widget, editor) {
	switch (evt.keyCode) {
		case 9:  // tab
			toggleSection(widget, evt.shiftKey);
			break;

		case 13: // enter
			dispose(widget);
			editor.focus();
			break;

		case 27: // escape
			let sels = JSON.parse(widget.dataset.prevSelections || '');
			if (sels) {
				editor.setSelections(sels);
			}
			dispose(widget);
			editor.focus();
			break;

		case 38: // up
		case 40: // down
			traverseNode(widget, editor, evt.keyCode === 38);
			break;

		default:
			return;
	}

	evt.preventDefault();
	evt.stopPropagation();
}

function traverseNode(ctx, editor, up) {
	var nodes = utils.toArray(ctx.querySelectorAll('.ls-outline__section_active .ls-outline__node'));
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
	highlightNode(hl, editor);
}

function highlightNode(node, editor) {
	node.classList.add(nodeHlClass);
	if (node.scrollIntoViewIfNeeded) {
		node.scrollIntoViewIfNeeded();
	} else {
		node.scrollIntoView();
	}

	var range = node.dataset.range;
	if (range && editor) {
		range = range.split(',').map(n => editor.posFromIndex(+n));
		editor.setSelection(...range);
	}
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

function dispose(widget) {
	if (widget.parentNode) {
		widget.parentNode.removeChild(widget);
	}
}

function toggleSection(widget, name) {
	var controls = $('.ls-outline__switch-label', widget);
	var sections = $('.ls-outline__section', widget);

	var activeControlClass = 'ls-outline__switch-label_active';
	var activeSectionClass = 'ls-outline__section_active';

	if (typeof name !== 'string') {
		// section name is not a string: 
		// find next/prev section to select
		let selected = controls.indexOf(widget.querySelector('.' + activeControlClass));

		if (selected === -1) {
			selected = !name ? 0 : sections.length - 1;
		} else {
			selected = (selected + sections.length + (name ? -1 : 1)) % sections.length;
		}

		name = controls[selected].dataset.target;
	}

	controls.forEach(s => s.classList.toggle(activeControlClass, s.dataset.target === name));
	sections.forEach(s => s.classList.toggle(activeSectionClass, s.dataset.type === name));
}
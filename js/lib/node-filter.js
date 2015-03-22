/**
 * For given list of node, retuns ones that pass
 * given search criteria. For every matched node, 
 * highlights found word
 */

import {toArray, querySelectorAll as $} from './utils';

export default function filter(nodeList, pattern, options = {}) {
	var rePattern = regexp(pattern);
	return reset(nodeList).filter(node => {
		var text = textContainerNode(node, options.textNode);
		var ix = text.innerText.indexOf(pattern);
		if (~ix) {
			highlight(text, rePattern);
			return true;
		}
	});
}

export function reset(nodeList) {
	if (!Array.isArray(nodeList)) {
		nodeList = [nodeList];
	}

	nodeList.forEach(node => {
		$('.ls-highlight', node).forEach(hl => {
			var parent = hl.parentNode;
			while (hl.firstChild) {
				parent.insertBefore(hl.firstChild, hl);
			}
			parent.removeChild(hl);
		});
	});

	return nodeList;
}

export function highlight(node, re) {
	node.innerHTML = node.innerText.replace(re, '<b class="ls-highlight">$1</b>');
}

filter.reset = reset;
filter.highlight = highlight;

function regexp(str) {
	return new RegExp(`(${escapeRegExp(str)})`, 'ig');
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function textContainerNode(node, search) {
	if (typeof search === 'string') {
		return node.querySelector(search);
	}

	if (typeof search === 'function') {
		return search(node);
	}

	return node;
}
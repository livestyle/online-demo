export function toArray(obj, ix = 0) {
	return Array.prototype.slice.call(obj, ix);
}

export function extend(obj, ...args) {
	args.forEach(o => {
		if (o) {
			Object.keys(o).forEach(key => obj[key] = o[key]);
		}
	});
	return obj;
}

export function closest(elem, sel) {
	while (elem && elem !== document) {
		if (matchesSelector(elem, sel)) {
			return elem;
		}
		elem = elem.parentNode;
	}
}

export function removeElement(elem) {
	if (elem.parentNode) {
		elem.parentNode.removeChild(elem);
	}
}

export function delegate(elem, event, sel, fn) {
	elem.addEventListener(event, function(evt) {
		var elem = closest(evt.target, sel);
		if (elem) {
			fn.call(elem, evt);
		}
	});
}

export function matchesSelector(elem, sel) {
	var found = null;
	['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(name => {
		if (name in elem) {
			found = elem[name](sel);
			return true;
		}
	});

	if (found === null) {
		// no native `matches` method, use a shim
		let matches = (elem.document || elem.ownerDocument).querySelectorAll(sel);
		let i = 0;
  
		while (matches[i] && matches[i] !== elem) {
			i++;
		}
		found = matches[i] ? true : false;
	}

	return found;
}

export function querySelectorAll(sel, elem = document) {
	return toArray(elem.querySelectorAll(sel));
}
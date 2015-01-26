var cssom = require('livestyle-cssom-patcher');

function applyPatch(payload) {
	var stylesheets = cssom.stylesheets();
	var url = Object.keys(stylesheets)[0];
	cssom.patch(stylesheets[url], payload.patches);
}

window.addEventListener('message', function(evt) {
	if (evt.data.name === 'livestyle-patch') {
		applyPatch(evt.data.payload);
	}
}, false);
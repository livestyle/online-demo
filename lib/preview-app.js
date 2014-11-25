define(function(require) {
	var cssom = require('../node_modules/livestyle-cssom-patcher/index');
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
});
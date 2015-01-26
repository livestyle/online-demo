/**
 * Custom LiveStyle Patcher worker: performs diffing/patching,
 * as well as analysis of diff’ed document
 */
var commands = require('livestyle-patcher/lib/commands');
var analyzer = require('livestyle-analyzer');

function reply(payload) {
	postMessage(payload);
}

function analyze(tree) {
	reply({
		name: 'analysis',
		data: analyzer(tree).toJSON()
	});
}

commands.on('diff initial-content', function(payload) {
	var tree = payload.cur || payload.tree;
	if (tree) {
		analyze(tree);
	}
});

onmessage = function(evt) {
	var payload = (typeof evt.data === 'string') ? JSON.parse(evt.data) : evt.data;
	// pass `reply` wrapper since direct invocation of `postMessage`
	// in command context will throw `Illegal invocation` error
	commands(payload, reply);
};
commands.livestyle.logger.silent(true);
/**
 * A server-less LiveStyle client shim: simply route events
 */
var eventMixin = require('./eventMixin');

module.exports = Object.create(eventMixin);
module.exports.config = function() {};
module.exports.connect = function(config, callback) {
	if (typeof config === 'function') {
		callback = config;
		config = null;
	}

	callback && callback(true);
	return this;
};

module.exports.disconnect = function() {
	return this;
};

module.exports.send = function(name, data) {
	return this
	.emit('message-send', name, data)
	.emit(name, data);
};
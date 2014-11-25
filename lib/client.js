/**
 * A server-less LiveStyle client shim: simply route events
 */
define(function(require) {
	var eventMixin = require('./eventMixin');
	
	var module = Object.create(eventMixin);
	module.config = function() {};
	module.connect = function(config, callback) {
		if (typeof config === 'function') {
			callback = config;
			config = null;
		}

		callback && callback(true);
		return this;
	};

	module.disconnect = function() {
		return this;
	};

	module.send = function(name, data) {
		return this
		.emit('message-send', name, data)
		.emit(name, data);
	};

	return module;
});
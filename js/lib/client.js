/**
 * A server-less LiveStyle client shim: simply route events
 */
import eventMixin from './eventMixin';
import {extend} from './utils';

var client = extend({
	config() {},
	connect(config, callback) {
		if (typeof config === 'function') {
			callback = config;
			config = null;
		}

		callback && callback(true);
		return this;
	},
	disconnect() {
		return this;
	},
	send(name, data) {
		return this
		.emit('message-send', name, data)
		.emit(name, data);
	}
}, eventMixin);
export {client as default};
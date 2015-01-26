/**
 * Takes data received from LiveStyle analyzer and produces
 * a tree structure for conveniet access to analysis
 * @param {String} Stylesheet source code 
 * @param {Object} data Analysis data
 */
module.exports = function(source, data) {
	var resultTree = populate(data.result, new Node(data.result));
	var sourceTree = populate(data.source, new Node(data.source), function(node) {
		var analysis = {};
		var id = node.id;
		if (id in data.references) {
			analysis.references = data.references[id];
		}
	});
};

function populate(node, ctx, fn) {
	node.children.forEach(function(child) {
		var item = ctx.addChild(child);
		fn && fn(item, child);
		populate(child, item, fn);
	});
	return node;
}

function Node(ref) {
	this.id = ref.id;
	this.type = ref.type;
	this.name = ref.name;
	this.value = ref.value;
	this.nameRange = ref.nameRange;
	this.valueRange = ref.valueRange;
	this.parent = null;
	this.children = [];
	this.analysis = null;
}

Node.prototype = {
	addChild: function(node) {
		if (!(node instanceof Node)) {
			node = new Node(node);
		}

		this.children.push(node);
		node.parent = this;
		return node;
	}
};
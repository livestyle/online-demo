export default function(type, content = '') {
	var widget = document.createElement('div');
	widget.className = `ls-widget ls-widget__${type}`;
	widget.innerHTML = content;
	return widget;
}
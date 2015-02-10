/**
 * Context selector widget: displays
 * resolved selector for given node
 */
import widget from './abstract';

export default function(content) {
	var w = widget('label', content);
	w.title = content;
	return w;
}
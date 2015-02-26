/**
 * Not actually a widget:
 * creates HTML snippet with give color preview
 */
var reHexColor = /^#[a-f0-9]{3,6}$/i;
var reRGBColor = /^rgba?\(.+?\)$/;
var reHSLColor = /^hsla?\(.+?\)$/;

export default function main(color, exact) {
	return isColor(color) ? `<i class="ls-widget__color" style="background-color: ${color}"${!exact ? ' data-exact="true"' : ''}></i>` : '';
}

export function isColor(str) {
	return reHexColor.test(str) || reRGBColor.test(str) || reHSLColor.test(str);
}
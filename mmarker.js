/* © 2013 j201
* https://github.com/j201/meta-marked */

var marked = require('marked');
var yaml = require('js-yaml');

// Splits the given string into a meta section and a markdown section if a meta section is present, else returns null
function splitInput(str) {
	str = str.trim();
	return str.substring(0, 3) === '---' ?
		str.substring(3).split('---') :
		null;
}

var metaMarked = function(src, opt, callback, metaonly) {
	if (Object.prototype.toString.call(src) !== '[object String]')
		throw new TypeError('First parameter must be a string.');

	metaonly = metaonly || false;

	var mySplitInput = splitInput(src);
	return mySplitInput ?  {
			meta : yaml.safeLoad(mySplitInput[0].trim()),
			html : !metaonly ? marked(mySplitInput[1].trim(), opt, callback) : mySplitInput[1].trim()
		} : {
			meta : {},
			html : !metaonly ? marked(src, opt, callback) : ""
		};
};

metaMarked.__proto__ = marked; // Yeah, it's non-standard, but it's better than copying everything over

metaMarked.noMeta = marked;

module.exports = metaMarked;

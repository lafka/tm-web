'use strict';

module.exports = function(grunt) {
	var taskname = 'builddocs',
		util = {};

	grunt.loadNpmTasks('grunt-markdown');

	util.fixLinks = function(src, docs) {
		return src.replace(/\[\[([^\]]+)\]\]/g, function(m, text) {
			var parts, title, link, hash;
			parts = text.match(/([^|]+)\|?(.*)?$/);
			title = text = parts[1];
			link = parts[2] || title;

			if (link.match(/^#/)) {
				return '<a href="' + link + '">' + (title || link) + '</a>';
			}

			hash = link.replace(/^.*#?/, '#');
			link = link.replace(/#.*$/, '');
			if (docs[link]) {
				return '<a href="' + docs[link][0].uri + hash + '">' + (title || docs[link][0].title) + '</a>';
			} else {
				return title;
			}
		});
	};

	util.preCompile = function(cfg, docs) {
		return function(src, ctx) {
			// @todo 2014-02-24 check for this.data.ext? checkout defaults, maybe add autoindex option?
			ctx.uri = ctx.dest.replace(/\/index.html$/, '');

			if (cfg.pruneURI) {
				ctx.uri = cfg.pruneURI(ctx.uri);
			}

			src = util.fixLinks(src, docs);
			for (var tpl in cfg.templates) {
				ctx.header = [];  
				src = util.template(tpl, src, cfg, ctx);
			}

			return src;
		};
	};

	util.template = function(elem, src, cfg, ctx) {
		var regex = new RegExp("<" + elem + ">\\s?([\\s\\S]*?)</" + elem + ">", "g");
		return src.replace(regex, function(match, inner) {
			if (cfg.parser) {
				var parsed = cfg.parser(inner, {}, null, true),
				    tpl = grunt.file.read(cfg.templates[elem]);
				if (!parsed.meta.inline) {
					if (ctx[elem]) {
						ctx[elem] = [];
					}

					ctx[elem].push(parsed);
				} else {
					return grunt.template.process(tpl, {data: parsed});
				}
			}

			return inner;
		});
	}

	/**
 	 * Processes the target markdown files and prepares for static
 	 * site generation.
 	 *
 	 * Loops through all the files matched, checks for any YAML
 	 * annotation and builds up a the site document structure, menu
 	 * and keywords and groups.
 	 *
 	 * groups: collections of one-to-many mapped documents
 	 * keywords: many-to-many mapping for tag like structures
 	 */
	grunt.registerMultiTask(taskname
		, 'Build set of annotated markdown files into static html'
		, function() {

		var fs = require('fs'),
		    docs = {},    // collection of array's of documents
		    urimap = {},  // hash of uri -> title
			keyword = {},
			group = {},
			preCompile = util.preCompile(this.data, docs),
			postCompile = function(data) { return data; };

		for (var f in this.files) {
			var file, res, meta;

			file = this.files[f],
			res = this.data.parser( grunt.file.read(file.src[0])
				, {}
				, null
				, true),
			meta = res.meta;

			console.log(meta);

			meta.uri = file.dest.replace(/^dist\//, '')
			                    .replace(/\/index.html$/, '');

			if (!docs[meta.title])
				docs[meta.title] = []

			docs[meta.title].push(meta);
			urimap[meta.uri] = meta.title;

			if ('[object Array]' === Object.prototype.toString.call(meta.keywords)) {
				for (var k in meta.keywords) {
					if (!keyword[meta.keywords[k]]) {
						keyword[meta.keywords[k]] = [];
					}

					keyword[meta.keywords[k]].push(meta.title);
				};
			}

			if ('string' === typeof(meta.group_by)) {
				if (!group[meta.group_by]) {
					group[meta.group_by] = []
				}

				group[meta.group_by].push(meta.title);
			}
		}

		console.log(urimap);


		// build menu
		var parent  = undefined,
		    uris = Object.keys(urimap),
		    parentlist = {},
			cleanup = ['', '/', '/docs'];

		uris.sort();

		var findparent = function(parent, n) {
			n = n || 0;

			if (parent && parent !== '/') {
				parent = parent.replace(/\/[^\/]+$/, '')
				return parentlist[parent] ? parent : findparent(parent, n + 1);
			}
		}

		for (var i in uris) {
			parent = findparent(uris[i]);

			if (!uris[i].match(/\.html$/) || !parent) {
				parentlist[ uris[i] ] = {
					uri:      uris[i],
					meta: docs[urimap[uris[i]]],
					children: []
				};

				if (parent) {
					parentlist[ parent ].children.push(parentlist[ uris[i] ]);
				}
			} else {
				parentlist[ parent ].children.push({
					uri:      uris[i],
					meta: docs[urimap[uris[i]]],
					children: []
				});
				cleanup.push(parent);
			}

			if (docs[urimap[uris[i]]])
				docs[urimap[uris[i]]].menu = parentlist[ uris[i] ];
		}

		// should fix the code properly, or be lazy as fuck...
		for (i in cleanup) {
			delete parentlist[cleanup[i]]
		}

		grunt.file.write(this.data.output, JSON.stringify(
			  {sitemap: parentlist, keyword: keyword, group: group}
			, null
			, 4));

		// copy files
		grunt.config('markdown.all.files', grunt.config(taskname + '.all.files'));
		grunt.config('markdown.all.options.parser',          this.data.parser);
		grunt.config('markdown.all.options.template',        'app/main.jst');
		grunt.config('markdown.all.options.preCompile',      this.data.preCompile || preCompile);
		grunt.config('markdown.all.options.postCompile',     this.data.postCompile || postCompile);
		grunt.config('markdown.all.options.templateContext', this.data.templateContext || {
			title:   "Markdown project"
		});

		grunt.config('markdown.all.options.markdownOptions', this.data.markdownOptions || {
			gfm: true,
			codeLines: {
				before: '<span>',
				after: '</span>',
			}
		});

		grunt.config('markdown.all.options.templateContext.sitemap', parentlist);

		grunt.task.run('markdown');
	});

};

module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-markdown');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadTasks('tasks');

	grunt.registerTask('default', ['clean', 'build', 'connect', 'watch']);
	grunt.registerTask('build', ['concat', 'copy', 'builddocs']);

	var menuProc = function(menu, uri, lvl) {
		lvl = lvl || 0;
		var css = ["level-" + lvl,
		           (menu.children.length > 0 ? "ancestor" : "")
		];

		if (null !== uri.match(new RegExp("^" + menu.uri))) {
			css.push('active');
		}

		var buf = '<li class="' + css.join(" ") + '">';
		buf += '<a href="' + menu.uri + '" title="' + menu.meta[0].title + '">' + menu.meta[0].title + '</a>';

		menu.children.sort(function(a, b) {
			return (a.meta[0].priority || a.meta[0].title) > (b.meta[0].priority || a.meta[0].title);
		});

		if (menu.children.length > 0) {
			buf += "<ul>\r\n";
			for (i in menu.children) {
				buf += menuProc(menu.children[i], uri, lvl+1);
			}
			buf += "</ul>\r\n";
		}
		buf += "</li>";

		return buf;
	};

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		dest: 'dist/',
		clean: ['./dist/'],
		watch: {
			scripts: {
				files: ['app/**/*.js'],
				tasks: ['jshint', 'concat', 'copy'],
				options: { spawn: false },
			},
			css: {
				files: ['app/**/*.css'],
				options: { spawn: false },
				tasks: ['concat', 'copy']
			},
			docs: {
				files: ['docs/**/*.md', 'app/**/*.md', 'app/**/*.jst'],
				tasks: 'build',
			}
		},
		connect: {
			server: {
				options: {
					base: 'dist/'
				}
			}
		},
		builddocs: {
			all: {
				files: [
					{
						expand: true,
						rename: function(a, b) {
							return a + b.replace(/^\/?docs/, '');
						},
						src: 'docs/**/*.md',
						dest: '<%= dest %>',
						ext: '.html'
					},
					{
						expand: true,
						flatten: true,
						src: 'app/index.md',
						dest: '<%= dest %>',
						ext: '.html'
					}
				],
				vsn: {
					cloud: "1.0.3",
					protocol: "1.38",
					workbench: "alpha"
				},
				pruneURI: function(uri) { return uri.replace(/^dist\//, ''); },
				parser: require('./mmarker.js'),
				output: 'dist/map.json',
				templateContext: {
					title: "Tinymesh Docs",
					menuproc: menuProc
				},
				templates: {
					'header': 'app/tpl/header.jst',
					'box': 'app/tpl/box.jst',
				}
			}
		},
		concat: {
			js: {
			  src: ['app/**/*.js'],
			  dest: '<%= dest %>/assets/js/app.js',
			},
			css: {
			  src: ['app/vendor/**/*.css', 'app/css/*.css'],
			  dest: '<%= dest %>/assets/css/style.css',
			},
		},
		copy: {
			fonts: {
				files: [
					{ src: 'app/img/branding.png'
					, dest: '<%= dest %>/assets/img/branding.png' },

					{ src: ['app/css/DejaVuSans*']
					, dest: '<%= dest %>/assets/css/'
					, flatten: true
					, expand: true
					, filter: 'isFile'},

					{ src: ['app/vendor/bootstrap/fonts/*']
					, dest: '<%= dest %>/assets/fonts/'
					, flatten: true
					, expand: true
					, filter: 'isFile'}
				],
			},
		},
	});
};

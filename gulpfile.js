var path = require('path');
var gulp = require('gulp');
var browserify = require('browserify');
var through = require('through2');
var notifier = require('node-notifier');
var extend = require('xtend');

var DEBUG = false;

function js(options) {
	return through.obj(function(file, enc, next) {
		if (options && options.standalone === true) {
			options = extend({}, options, {
				standalone: path.basename(file.path)
					.replace(/\.\w+$/, '')
					.replace(/-(\w+)/g, function(str, l) {
						return l.toUpperCase();
					})
			});
		}

		file.contents = browserify(extend({
			entries: file.path,
			detectGlobals: false,
			debug: DEBUG
		}, options || {}))
		.transform('6to5ify')
		.bundle(function(err, content) {
			if (err) {
				notifier.notify({
					title: 'Error', 
					message: err,
					sound: true
				});
			} else {
				// clean up file paths
				content = content.toString().replace(__dirname, '');
				file.contents = new Buffer(content);
			}
			next();
		});
		this.push(file);
	});
}

gulp.task('js', function() {
	return gulp.src(['./lib/{worker,app,preview-app}.js', './app/*.js'])
		.pipe(js({standalone: true}))
		.pipe(gulp.dest('./out'));
});

gulp.task('watch', function() {
	DEBUG = true;
	gulp.watch(['./{app,lib}/*.js', './node_modules/livestyle-patcher/lib/*.js'], ['default']);
});

gulp.task('default', ['js']);
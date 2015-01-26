var path = require('path');
var gulp = require('gulp');
var streamify = require('gulp-streamify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var through = require('through2');

function cleanup() {
	return through.obj(function(chunk, enc, next) {
		var str = chunk.toString();
		if (str.indexOf(__dirname)) {
			chunk = new Buffer(str.replace(__dirname, ''));
		}
		this.push(chunk);
		next();
	});
}

function compileJS(src, out) {
	return browserify({
		entries: src,
		detectGlobals: false
	})
	.bundle()
	.pipe(cleanup())
	.pipe(source(path.basename(out)))
	.pipe(gulp.dest(path.dirname(out)));
}

gulp.task('worker', function() {
	return compileJS('./lib/worker.js', './out/worker.js');
});

gulp.task('app', function() {
	return compileJS('./lib/app.js', './out/app.js');
});

gulp.task('preview-app', function() {
	return compileJS('./lib/preview-app.js', './out/preview-app.js');
});

gulp.task('watch', function() {
	gulp.watch(['./lib/*.js', './node_modules/livestyle-patcher/lib/*.js'], ['worker', 'app', 'preview-app']);
});

gulp.task('default', ['worker', 'app', 'preview-app']);
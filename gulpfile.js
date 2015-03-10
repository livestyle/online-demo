var gulp = require('gulp');
var jsBundler = require('js-bundler');

gulp.task('js', function() {
	return gulp.src('./lib/*.js')
		.pipe(jsBundler({standalone: true, sourceMap: false}))
		.pipe(gulp.dest('./out'));
});

gulp.task('watch', function() {
	jsBundler.watch({uglify: false, sourceMap: true});
	gulp.watch(['./lib/**/*.js', './node_modules/livestyle-patcher/lib/*.js'], ['default']);
});

gulp.task('default', ['js']);
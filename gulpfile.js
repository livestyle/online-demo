var path = require('path');
var gulp = require('gulp');
var jsBundler = require('js-bundler');
var minifyCSS = require('gulp-minify-css');
var gzip = require('gulp-gzip');

var srcOptions = {base: './'};
var outPath = './out';
var production = process.argv.indexOf('--production') !== -1;

function np(file) {
	return path.resolve(path.join('node_modules', file));
}

gulp.task('js', function() {
	return gulp.src('./js/*.js', srcOptions)
		.pipe(jsBundler({
			uglify: production,
			sourceMap: !production,
			noParse: [
				np('codemirror-movie/dist/movie.js'), 
				np('emmet-codemirror/dist/emmet.js'),
				np('codemirror/lib/codemirror.js')
			]
		}))
		.pipe(gulp.dest(outPath));
});

gulp.task('css', function() {
	return gulp.src('./css/*.css', srcOptions)
		.pipe(minifyCSS({processImport: true}))
		.pipe(gulp.dest(outPath))
});

gulp.task('html', function() {
	return gulp.src('./index.html', srcOptions)
		.pipe(gulp.dest(outPath))
});

gulp.task('assets', function() {
	return gulp.src('./img/**', srcOptions)
		.pipe(gulp.dest(outPath))
});

gulp.task('full', ['all'], function() {
	return gulp.src('./out/**/*.{html,css,js,ico}')
		.pipe(gzip({
			threshold: '1kb',
			gzipOptions: {level: 7}
		}))
		.pipe(gulp.dest(outPath));
});

gulp.task('watch', function() {
	jsBundler.watch({uglify: false, sourceMap: true});
	gulp.watch(['./js/**/*.js'], ['js']);
	gulp.watch(['./css/**/*.css'], ['css']);
	gulp.watch(['./*.html'], ['html']);
});

gulp.task('all', ['js', 'css', 'assets', 'html']);

gulp.task('default', ['all']);
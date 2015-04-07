var path = require('path');
var gulp = require('gulp');
var jsBundler = require('js-bundler');
var minifyCSS = require('gulp-minify-css');
var gzip = require('gulp-gzip');
var connect = require('gulp-connect');
var notifier = require('node-notifier');
var htmlTransform = require('html-transform');
var rewriteUrl = htmlTransform.rewriteUrl;
var stringifyDom = htmlTransform.stringifyDom;

var srcOptions = {base: './'};
var outPath = './out';
var production = process.argv.indexOf('--production') !== -1;

function np(file) {
	return path.resolve(path.join('node_modules', file));
}

function js(options) {
	return jsBundler(options).on('error', function(err) {
		notifier.notify({
			title: 'Error', 
			message: err,
			sound: true
		});
		console.error(err.stack);
		this.emit('end');
	});
}

gulp.task('js', ['worker'], function() {
	return gulp.src('./js/{main,editor,analyzer}.js', srcOptions)
		.pipe(js({
			detectGlobals: false,
			uglify: production,
			sourceMap: !production,
			standalone: true,
			noParse: [
				np('codemirror-movie/dist/movie.js'), 
				np('emmet-codemirror/dist/emmet.js'),
				np('codemirror/lib/codemirror.js')
			]
		}))
		.pipe(gulp.dest(outPath));
});

gulp.task('worker', function() {
	return gulp.src('./js/worker.js', srcOptions)
		.pipe(js({
			uglify: false, // Do not minify, it breaks code!
			sourceMap: !production,
			detectGlobals: false
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
		.pipe(rewriteUrl(function(url, file, ctx) {
			if (ctx.stats) {
				url = '/-/' + ctx.stats.hash + '/analyzer' + url;
			}
			return url;
		}))
		.pipe(stringifyDom('xhtml'))
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

gulp.task('server', function() {
	connect.server({
		root: './out',
		middleware: function() {
			return [function(req, res, next) {
				req.url = req.url.replace(/^\/\-\/\w+\/analyzer\//, '/');
				next();
			}];
		}
	});
});

gulp.task('all', ['js', 'css', 'assets', 'html']);

gulp.task('default', ['all']);

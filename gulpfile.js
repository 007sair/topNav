(function(){

	//基础包
	var gulp = require("gulp");
	var sass = require('gulp-sass');
	var sourcemaps = require('gulp-sourcemaps');

	/**
	 * JS
	 */
	var concat = require('gulp-concat');
	var uglify = require("gulp-uglify");
	var rename = require('gulp-rename');
	
	/**
	 * CSS
	 */
	var cleanCSS = require('gulp-clean-css');
	//PostCSS
	var postcss = require('gulp-postcss');
	var autoprefixer = require('autoprefixer');
	var processors = [
		autoprefixer({
			browsers: ['ie >= 9', 'Chrome >= 20', 'Android >= 3.0', 'Firefox >= 10']
		})
	];

	//增强
	var browserSync = require('browser-sync').create();
	var reload = browserSync.reload;

	var changed = require('gulp-changed');
	var replace = require('gulp-replace');
	var filter  = require('gulp-filter');


	var paths = {
		root: './',
		src: 'src/',
		dist: 'dist/',
		sass: 'sass/',
		css: 'css/'
	};


	/**
	 * sass转css任务
	 * 生成css.css & css.min.css文件
	 */
	gulp.task('sass', function() {
		return gulp.src(paths.sass + '**/*.scss')
			.pipe(sourcemaps.init())
			.pipe(sass({
				outputStyle: 'compact'
			}).on('error', sass.logError))
			.pipe(postcss(processors))
			.pipe(cleanCSS({
				keepBreaks: true,
				compatibility: 'ie7',
				advanced: false
			}))
			.pipe(rename({
				basename : 'css'
			}))
			.pipe(sourcemaps.write('.map/'))
			.pipe(gulp.dest(paths.css))
			.pipe(filter(paths.css + '**/*.css')) // Filtering stream to only css files
			.pipe(reload({stream:true})) //need browserSync
			.pipe(gulp.dest(paths.css))
			.pipe(cleanCSS({
				keepBreaks: false,
				compatibility: 'ie7'
			}))
			.pipe(rename({
				basename : 'css.min'
			}))
			.pipe(gulp.dest(paths.css));  
	});

	gulp.task('script', function(){
		return gulp.src(paths.src + '**/*.js')
			.pipe(uglify())
			.pipe(rename({
				suffix : '.min'
			}))
			.pipe(gulp.dest(paths.dist));
	})


	gulp.task('default', function() {
		//指定文件，用browserSync监听文件变化
		browserSync.init({
			server: {
	            baseDir: "./"
	        }
		});

		//监听文件变化并执行sass任务
		gulp.watch(paths.sass + '**/*.scss', ['sass']);

		gulp.watch(paths.src + '**/*.js', ['script']);

		//监听html发生变化时手动重载浏览器
		gulp.watch("*.html").on("change", browserSync.reload);

	});



})();
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var browserify = require('browserify');

gulp.task('default', ['lint']);

gulp.task('lint', function() {
    return gulp.src('./powermap/static/powermap/*.js')
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

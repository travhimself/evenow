var gulp = require('gulp'),
    less = require('gulp-less'),
    watch = require('gulp-watch');

gulp.task('less', function() {
   gulp.src('static/css/*.less')
      .pipe(watch('static/css/*.less', ['less']))
      .pipe(less())
      .pipe(gulp.dest('static/css'));
});
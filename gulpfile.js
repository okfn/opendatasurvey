var gulp = require('gulp');
var gulpConcatPo = require('gulp-concat-po');
var gulpXgettext = require('gulp-xgettext');
var gulpReplace = require('gulp-replace');
var exec = require('child_process').exec;

gulp.task('pot', function(){
  return gulp.src('templates/**/*.html', {
    base: '.'
  }).pipe(gulpReplace(/or gettext/g, "|| gettext")).pipe(gulpXgettext({
    language: 'jinja',
    keywords: [{
      name: '_'
    }].concat([{
      name: 'format'
    }]),
    bin: 'node_modules/.bin/jsxgettext'
  })).pipe(gulpConcatPo('messages.pot')).pipe(gulp.dest("locale/templates/LC_MESSAGES"));
});

gulp.task('update-po', function(){
  return exec('./node_modules/.bin/merge-po locale');
});

// Task to prepare all /census/locale/*/LC_MESSAGES/*.po files to
// use with i18n-abide
gulp.task('compile-po', function() {
  return exec('./node_modules/.bin/compile-json ./census/locale ./census/locale');
});
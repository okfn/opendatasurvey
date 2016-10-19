var gulp = require('gulp');
var gulpConcatPo = require('gulp-concat-po');
var gulpXgettext = require('gulp-xgettext');
var gulpReplace = require('gulp-replace');
var gulpRename = require('gulp-rename');
var gulpSass = require('gulp-ruby-sass');
var exec = require('child_process').exec;

gulp.task('pot', pot);
gulp.task('update-po', updatePo);
// Prepare all /census/locale/*/LC_MESSAGES/*.po files to use with i18n-abide
gulp.task('compile-po', compilePo);
gulp.task('compile-styles', compileStyles);

function pot() {
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
  })).pipe(gulpConcatPo('messages.pot'))
    .pipe(gulp.dest("locale/templates/LC_MESSAGES"));
}

function updatePo() {
  return exec('./node_modules/.bin/merge-po locale');
}

function compilePo() {
  return exec(
    './node_modules/.bin/compile-json ./census/locale ./census/locale');
}

function compileStyles() {
  return gulpSass(['census/static/scss/styles.scss'])
    //.pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(gulpRename('styles.css'))
    .pipe(gulp.dest('census/static/css'));
}
'use strict';

const gulp = require('gulp');
const gulpConcatPo = require('gulp-concat-po');
const gulpXgettext = require('gulp-xgettext');
const gulpReplace = require('gulp-replace');
const gulpRename = require('gulp-rename');
const gulpSass = require('gulp-ruby-sass');
const gutil = require('gulp-util');
const exec = require('child_process').exec;

gulp.task('pot', pot);
gulp.task('update-po', updatePo);
// Prepare all /census/locale/*/LC_MESSAGES/*.po files to use with i18n-abide
gulp.task('compile-po', compilePo);
gulp.task('compile-styles', compileStyles);

function pot() {
  return gulp.src('census/views/**/*.html', {base: 'census'})
  // jsxgettext hates 'or' in templates, so make these special exceptions.
  // https://github.com/zaach/jsxgettext/issues/78
  .pipe(gulpReplace(/or gettext/g, '|| gettext'))
  .pipe(gulpReplace(/or false/g, '|| false'))
  .pipe(gulpReplace(/or \'\'/g, '|| \'\''))
  .pipe(gulpXgettext({
    language: 'jinja',
    keywords: [{
      name: 'gettext'
    }],
    bin: 'node_modules/.bin/jsxgettext'
  }))
  .on('error', gutil.log)
  .pipe(gulpConcatPo('messages.pot'))
  .pipe(gulp.dest('census/locale/templates/LC_MESSAGES'));
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
    // .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(gulpRename('styles.css'))
    .pipe(gulp.dest('census/static/css'));
}

'use strict';

const path = require('path');

const _ = require('lodash');
const Metalsmith = require('metalsmith');
const request = require('metalsmith-request');
const layouts = require('metalsmith-layouts');
const assets = require('metalsmith-assets');
const markdown = require('metalsmith-markdown');
const permalinks = require('metalsmith-permalinks');
const debug = require('metalsmith-debug');

const templateFilters = require('../census/filters');
const nunjucks = require('nunjucks');
const i18n = require('i18n-abide');

const godiModifyData = require('./metalsmith-godi-modifydata');

const templatePath = path.join(__dirname, '../census/views/');
// const templatePath = path.join(__dirname, './layouts/');
const env = nunjucks.configure(templatePath,
  {watch: false, autoescape: false});
_.each(templateFilters, function(value, key, list) {
  env.addFilter(key, value);
});

Metalsmith(__dirname)
  .metadata({
    is_index: true,
    // Pass-through str for the moment. Can i18n-abide be used here?
    gettext: function(str) {
      return str;
    },
    // format function needs to be available in templates
    format: i18n.format
  })
  .source('./src')
  .destination('./build')
  .clean(true)
  .use(request({
    datasets: 'http://global-test.dev.census.org:5000/api/datasets.json',
    places: 'http://global-test.dev.census.org:5000/api/places/score/2016.json',
    entries: 'http://global-test.dev.census.org:5000/api/entries.json',
    questions: 'http://global-test.dev.census.org:5000/api/questions.json'
  }, {
    json: true
  }))
  .use(godiModifyData())
  .use(markdown())
  .use(permalinks())
  .use(layouts({
    engine: 'nunjucks',
    rename: true,
    directory: templatePath
  }))
  .use(debug())
  .use(assets({
    source: '../census/static', // relative to the working directory
    destination: '.' // relative to the build directory
  }))
  .build(function(err) {
    if (err) throw err;
  });

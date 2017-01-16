'use strict';

const path = require('path');

const _ = require('lodash');
const Metalsmith = require('metalsmith');
const request = require('metalsmith-request');
const layouts = require('metalsmith-layouts');
const debug = require('metalsmith-debug');
const assets = require('metalsmith-assets');
const markdown = require('metalsmith-markdown');
const permalinks = require('metalsmith-permalinks');

const templateFilters = require('../census/filters');
const nunjucks = require('nunjucks');
const i18n = require('i18n-abide');

const templatePath = path.join(__dirname, '../census/views/');
// const templatePath = path.join(__dirname, './layouts/');
var env = nunjucks.configure(templatePath,
  {watch: false, autoescape: false});
_.each(templateFilters, function(value, key, list) {
  env.addFilter(key, value);
});

// console.log(env);

Metalsmith(__dirname)
  .use(debug())
  .metadata({
    is_index: true,
    // Pass-through str for the moment. Can i18n-abide be used here?
    gettext: function(str) {
      return str;
    },
    // format function needs to be available in templates
    format: i18n.format
  })
  .use(request({
    entries: 'http://global-test.dev.census.org:5000/api/entries/2016.cascade.json'
  }, {
    json: true
  }))
  .source('./src')
  .destination('./build')
  .clean(true)
  .use(markdown())
  .use(permalinks())
  .use(layouts({
    engine: 'nunjucks',
    rename: true,
    directory: templatePath
  }))
  .use(assets({
    source: '../census/static', // relative to the working directory
    destination: '.' // relative to the build directory
  }))
  .build(function(err) {
    if (err) throw err;
  });

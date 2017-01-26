'use strict';

const path = require('path');
// const util = require('util');

const _ = require('lodash');
const commandLineArgs = require('command-line-args');
const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const assets = require('metalsmith-assets');
const markdown = require('metalsmith-markdown');
const permalinks = require('metalsmith-permalinks');
const debug = require('metalsmith-debug');
const timer = require('metalsmith-timer');
const paths = require('metalsmith-paths');
const msIf = require('metalsmith-if');

const templateFilters = require('../census/filters');
const nunjucks = require('nunjucks');
const i18n = require('i18n-abide');

const godiGetData = require('./metalsmith-godi-getdata');
const jsonToFiles = require('metalsmith-json-to-files');

const templatePath = path.join(__dirname, '../census/views/');

const optionDefinitions = [
  {name: 'clean', alias: 'c', type: Boolean, defaultValue: false},
  {name: 'static', alias: 's', type: Boolean, defaultValue: false}
];
const options = commandLineArgs(optionDefinitions);

const env = nunjucks.configure(templatePath,
  {watch: false, autoescape: false});
_.each(templateFilters, function(value, key, list) {
  env.addFilter(key, value);
});

const domain = 'global-test';
const baseUrlPattern = 'http://localhost:8000';
// const baseUrl = util.format(baseUrlPattern, domain);
const baseUrl = baseUrlPattern;
const siteTitle = 'Global Open Data Index';

Metalsmith(__dirname)
  .use(timer('init'))
  .metadata({
    is_index: true,
    // Pass-through str for the moment. Can i18n-abide be used here?
    gettext: function(str) {
      return str;
    },
    // format function needs to be available in templates
    format: i18n.format,
    site_url: baseUrl,
    site_title: siteTitle
  })
  .source('./src')
  .destination('./build')
  .clean(options.clean)
  // Populate metadata with data from Survey
  .use(godiGetData({domain: domain, year: 2016}))
  .use(jsonToFiles({use_metadata: true}))
  .use(markdown())
  .use(permalinks())
  .use(paths({property: 'paths', directoryIndex: 'index.html'}))
  .use(layouts({
    engine: 'nunjucks',
    rename: true,
    directory: templatePath
  }))
  .use(debug())
  .use(msIf(
    options.static,
    assets({
      source: '../census/static', // relative to the working directory
      destination: '.' // relative to the build directory
    })
  ))
  .use(timer('finished'))
  .build(function(err) {
    if (err) throw err;
  });

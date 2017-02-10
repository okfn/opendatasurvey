'use strict';

const path = require('path');
const util = require('util');

const _ = require('lodash');
const AWS = require('aws-sdk');
const commandLineArgs = require('command-line-args');
const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const assets = require('metalsmith-assets');
const markdown = require('metalsmith-markdown');
const permalinks = require('metalsmith-permalinks');
const msdebug = require('metalsmith-debug');
const debug = require('debug')('metalsmith-godi-generate');
const timer = require('metalsmith-timer');
const ignore = require('metalsmith-ignore');
const paths = require('metalsmith-paths');
const s3 = require('metalsmith-s3');
const msIf = require('metalsmith-if');

const templateFilters = require('../census/filters');
const nunjucks = require('nunjucks');
const i18n = require('i18n-abide');

const godiGetData = require('./metalsmith-godi-getdata');
const godiDataFiles = require('./metalsmith-godi-updatedatafiles');
const godiIndexSettings = require('./metalsmith-godi-indexsettings'); // Add data from Index settings.
const godiStripBuild = require('./metalsmith-godi-stripbuild');
const godiEnsureBucket = require('./metalsmith-godi-ensurebucket');
const jsonToFiles = require('metalsmith-json-to-files');

const templatePath = path.join(__dirname, '../census/views/');

// Grab cli args
const optionDefinitions = [
  {name: 'clean', alias: 'c', type: Boolean, defaultValue: false},
  {name: 'static', alias: 's', type: Boolean, defaultValue: false},
  {name: 'deploy', alias: 'd', type: Boolean, defaultValue: false}
];
const options = commandLineArgs(optionDefinitions);

// Set up Nunjucks env
const njEnv = nunjucks.configure(templatePath,
  {watch: false, autoescape: false});
_.each(templateFilters, function(value, key, list) {
  njEnv.addFilter(key, value);
});

// Set up AWS creds
if (options.deploy &&
    !process.env.AWS_ACCESS_KEY_ID &&
    !process.env.AWS_SECRET_ACCESS_KEY) {
  debug('No AWS credentials in env, attempting from settings file.');
  try {
    AWS.config.loadFromPath(
      path.join(path.dirname(__dirname), '/settings_index.json'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      debug('Could not load credentials file. Please check settings_index.json.');
    }
    throw err;
  }
}

const isGodi = false;
const domain = 'global-test';
const bucketSite = (isGodi) ? '' : util.format('%s-', domain);
const bucketName = util.format('%sindex.okfn.org', bucketSite);
// const baseUrl = 'http://localhost:8000';
const baseUrl = util.format('http://%s', bucketName);
const siteTitle = 'Global Open Data Index';

Metalsmith(__dirname)
  .use(timer('Start pipeline'))
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
  .use(godiGetData({domain: domain, year: 2016})) // Populate metadata with data from Survey
  .use(jsonToFiles({use_metadata: true}))
  .use(godiDataFiles()) // Add file metadata to each entry file populated by json-to-files
  .use(godiIndexSettings({domain: domain})) // Add data from Index settings.
  .use(markdown())
  .use(permalinks())
  .use(paths({property: 'paths', directoryIndex: 'index.html'}))
  .use(layouts({
    engine: 'nunjucks',
    rename: true,
    directory: templatePath
  }))
  .use(msIf(
    options.static || options.deploy,
    assets({
      source: '../census/static', // relative to the working directory
      destination: '.' // relative to the build directory
    })
  ))
  .use(ignore([
    'scss/*',
    '.DS_Store'
  ]))
  .use(msIf(
    options.deploy,  // We're pushing to AWS, so ensure the bucket exists.
    godiEnsureBucket({bucketName: bucketName})
  ))
  .use(msIf(
    options.deploy,  // Push to AWS.
    s3({
      action: 'write',
      bucket: bucketName
    })
  ))
  .use(msIf(  // If we're pushing to AWS, strip all files from the local build.
    options.deploy,
    godiStripBuild()
  ))
  .use(msdebug())
  .use(timer('finished'))
  .build(err => {
    if (err) throw err;
  });

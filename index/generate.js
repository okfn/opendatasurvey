'use strict';

const path = require('path');

const _ = require('lodash');
const AWS = require('aws-sdk');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
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
const request = require('metalsmith-request');

const templateFilters = require('../census/filters');
const nunjucks = require('nunjucks');
const i18n = require('i18n-abide');

const godiGetData = require('./metalsmith-godi-getdata');
const godiApiDataToFiles = require('./metalsmith-godi-apidatatofiles');
const godiDataFiles = require('./metalsmith-godi-updatedatafiles');
const godiIndexSettings = require('./metalsmith-godi-indexsettings'); // Add data from Index settings.
const godiStripBuild = require('./metalsmith-godi-stripbuild');
const godiEnsureBucket = require('./metalsmith-godi-ensurebucket');
const jsonToFiles = require('metalsmith-json-to-files');

const templatePath = path.join(__dirname, '../census/views/');

// Usage instructions
const usageSections = [
  {
    header: 'Index website generator',
    content: 'Generate a static Open Data Index website from Survey data for the provided [italic]{site}.'
  },
  {
    header: 'Synopsis',
    content: [
      '$ generate_index example-site [bold]{--year=2016} [bold]{--local} [[bold]{--clean}] [[bold]{--static}]',
      '$ generate_index example-site [bold]{--year=2016} [bold]{--deploy}',
      '$ generate_index [bold]{--help}'
    ]
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'site',
        typeLabel: '[underline]{string}',
        defaultOption: true,
        description: 'Name of the site to generate.'
      },
      {
        name: 'year',
        alias: 'y',
        typeLabel: '[underline]{YYYY}',
        description: 'Survey year to generate.'
      },
      {
        name: 'local',
        alias: 'l',
        description: 'Write files locally to a build directory.'
      },
      {
        name: 'deploy',
        alias: 'd',
        description: 'Write files to an S3 bucket (always includes static assets).'
      },
      {
        name: 'clean',
        alias: 'c',
        description: 'Clean the build directory prior to build (if building locally).'
      },
      {
        name: 'static',
        alias: 's',
        description: 'Copy the static assets directory to the build (if building locally).'
      },
      {
        name: 'dryrun',
        description: 'Process the pipeline, but don\'t write or deploy the data.'
      },
      {
        name: 'help',
        alias: 'h',
        description: 'Display this message.'
      }
    ]
  }
];
const usage = getUsage(usageSections);

// Grab cli args
const optionDefinitions = [
  {name: 'site', type: String, defaultOption: true},
  {name: 'year', alias: 'y', type: Number},
  {name: 'clean', alias: 'c', type: Boolean, defaultValue: false},
  {name: 'static', alias: 's', type: Boolean, defaultValue: false},
  {name: 'deploy', alias: 'd', type: Boolean, defaultValue: false},
  {name: 'local', alias: 'l', type: Boolean, defaultValue: false},
  {name: 'dryrun', type: Boolean, defaultValue: false},
  {name: 'help', alias: 'h', type: Boolean, defaultValue: false}
];
const options = commandLineArgs(optionDefinitions);

// Usage validation
if ((options.local && options.deploy) || (!options.local && !options.deploy)) {
  console.error('Please provide either --local OR --deploy options.');
  process.exit(1);
} else if (options.help) {
  console.log(usage);
  process.exit(0);
}
if (!options.site) {
  console.error('Please provide a site to build.');
  process.exit(1);
}
if (!options.year) {
  console.error('Please provide a year to build.');
  process.exit(1);
}
if (options.dryrun) {
  debug('This is a dry run. No files will be written or deployed.');
  // Don't clean, if a dryrun
  options.clean = false;
}

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
      console.error('Could not load AWS credentials. Please check env or settings_index.json.');
    }
    process.exit(1);
  }
}

// Suffix to append to index subdomain. Useful to differentiate between
// development, staging and production.
const indexDomainSuffix = (process.env.INDEX_DOMAIN_SUFFIX) ?
  `-${process.env.INDEX_DOMAIN_SUFFIX}` : '';
// If this is not the production instance, there MUST be an
// INDEX_DOMAIN_SUFFIX set in the env.
if (process.env.NODE_ENV !== 'production' && indexDomainSuffix === '') {
  console.error('NODE_ENV is not \'production\', so INDEX_DOMAIN_SUFFIX must be set to prevent overwriting production sites.');
  process.exit(1);
}
const isGodi = (options.site === 'global' || options.site === 'global-test');
const domain = options.site;
const year = options.year;
const bucketSite = (isGodi) ? '' : `${domain}-`;
const bucketName = `${bucketSite}index${indexDomainSuffix}.okfn.org`;
let baseUrl = `http://${bucketName}`;
if (process.env.INDEX_DOMAIN_SUFFIX === 'dev') {
  baseUrl = 'http://localhost:8000';
}
let surveyUrl = `http://${domain}.survey.okfn.org`;
if (process.env.BASE_DOMAIN) {
  surveyUrl = `http://${domain}.${process.env.BASE_DOMAIN}`;
}

/* eslint-disable camelcase */
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
    map: {  // Initial map presets.
      embed_width: '100%',
      embed_height: '300px',
      // filter_year: filter_year,
      filter_year: year,
      // filter_dataset: filter_dataset,
      filter_dataset: 'all',
      years: [year],
      panel_tools: 'true',
      panel_share: 'true',
      // map_place: map_place
      map_place: ''
    }
  })
  .source('./src')
  .destination('./build')
  .clean(options.clean)
  .use(request({
    datasetsApi: `${surveyUrl}/api/datasets/score/${year}.json`,
    entriesApi: `${surveyUrl}/api/entries.json`,
    questionsApi: `${surveyUrl}/api/questions.json`,
    placesApi: `${surveyUrl}/api/places/score/${year}.json`
  }, {json: true}))
  .use(godiApiDataToFiles()) // Set api stored on metaddata, retrieved using metalsmith-request above, to files.
  .use(godiGetData({domain: domain, year: year})) // Populate metadata with data from Survey
  .use(jsonToFiles({use_metadata: true}))
  .use(paths({property: 'paths', directoryIndex: 'index.html'}))
  .use(godiIndexSettings({domain: domain})) // Add data from Index settings.
  .use(godiDataFiles()) // Add file metadata to each entry file populated by json-to-files
  .use(markdown())
  .use(permalinks())
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
    options.deploy && !options.dryrun,  // We're pushing to AWS, so ensure the bucket exists.
    godiEnsureBucket({bucketName: bucketName})
  ))
  .use(msIf(
    options.deploy && !options.dryrun,  // Push to AWS.
    s3({
      action: 'write',
      bucket: bucketName
    })
  ))
  .use(msIf(  // If we're pushing to AWS, strip all files from the local build.
    options.deploy || options.dryrun,
    godiStripBuild()
  ))
  .use(msdebug())
  .use(timer('finished'))
  .build(err => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }
  });
/* eslint-enable camelcase */

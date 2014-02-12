var path = require('path')
  , request = require('request')
  , Q = require('q')
  , assert = require('assert')

  , model = require('./model')
  ;

var deployerConfigPath = '.deploy.json'

exports.setupDeployerConfig = function() {
}

try {
  var deployConfig = require('../.deploy.js').config;
} catch (e) {
  console.error('ERROR: No deploy config');
  throw e;
}

exports.create = function(slug) {
  assert(slug, 'slug must not be a string');

  console.log('Starting deployment ...');

  var backend = new model.Backend({
    key: deployConfig.db_key,
    user: deployConfig.user,
    password: deployConfig.password
  });

  backend.login(function(err) {
    assert(!err, 'Failed to login');
    backend.get(deployConfig.db_sheet_index, {slug: slug}, function(err, instanceInfo) {
      assert(!err);
      assert(instanceInfo, 'No instance found with slug ' + slug);
      // console.log(instanceInfo);
      var cmds = [];
      var bootcmd = 'heroku apps:create opendatacensus-SLUG --remote SLUG'.replace(/SLUG/g, instanceInfo.slug);
      cmds.push(bootcmd);
      
      var envvars = [
        'CONFIG_URL',
        'GOOGLE_APP_ID',
        'GOOGLE_APP_SECRET',
        'GOOGLE_USER',
        'GOOGLE_PASSWORD'
      ];
      var confcmd = 'heroku config:set --remote SLUG '.replace(/SLUG/g, instanceInfo.slug);
      envvars.forEach(function(envvar) {
        confcmd += envvar + '="' + instanceInfo[envvar.toLowerCase().replace(/_/g, '')] + '"';
        confcmd += ' ';
      })
      // will probably override in config but set a default value so that login works out of the box
      confcmd += 'SITE_URL=' + 'http://opendatacensus-SLUG.herokuapp.com/'.replace(/SLUG/g, instanceInfo.slug) + ' ';

      var pushcmd = 'git push SLUG master'.replace(/SLUG/g, instanceInfo.slug);

      console.log(bootcmd);
      console.log(confcmd);
      console.log(pushcmd);
    });
  });
}


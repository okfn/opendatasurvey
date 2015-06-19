var path = require('path')
  , request = require('request')
  , Q = require('q')
  , assert = require('assert')
  , colors = require('colors')
  , execSync = require('execSync')

  , model = require('./model')
  ;

exports.setupDeployerConfig = function() {
}

try {
  var deployConfig = require('../.deploy.js').config;
} catch (e) {
  console.error('ERROR: No deploy config'.red);
  var depconfig = "exports.config = {\n\
    // instance database key and sheet index\n\
      db_key: '0AqR8dXc6Ji4JdHZoLXhLMjNVNjVPQzVlaU0tSjNUYlE'\n\
    , db_sheet_index: 1\n\
\n\
    // your personal username and password (will need to be authorized to central (google spreadsheet) instance database\n\
    , user: '...'\n\
    , password: '...'\n\
};";

  console.log([
    '',
    'You must create a deploy config at ".deploy.js"',
    '',
    'Format is like:',
    '',
    depconfig
    ].join('\n')
  )
  throw 'Deploy config at .deploy.js does not exist or is wrongly formatted';
}

function getAllInstanceInfo(cb) {
  var backend = new model.Backend({
    key: deployConfig.db_key,
    user: deployConfig.user,
    password: deployConfig.password
  });
  backend.login(function(err) {
    assert(!err, 'Failed to login');
    backend.select(deployConfig.db_sheet_index, {}, function(err, instanceInfo) {
      assert(!err, err);
      assert(instanceInfo, 'No data found');
      cb(err, instanceInfo)
    });
  });
}

function getInstanceInfo(id, cb) {
  getAllInstanceInfo(function(err, instances) {
    instanceInfo = instances.filter(function(inst) {
      return (inst.censusid === id);
    });
    instanceInfo = instanceInfo.length > 0 ? instanceInfo[0] : null;
    assert(instanceInfo, 'No instance found with id ' + id);
    cb(err, instanceInfo)
  });
}

exports.create = function(id) {
  assert(id, 'id must be a string');

  console.log('Starting deployment ...');

  getInstanceInfo(id, function(err, instanceInfo) {
    var bootcmd = 'heroku apps:create opendatacensus-SLUG --remote SLUG'.replace(/SLUG/g, instanceInfo.censusid)
      , pushcmd = 'git push SLUG master'.replace(/SLUG/g, instanceInfo.censusid)
      , domainscmd = 'heroku domains:add SLUG.census.okfn.org -r SLUG'.replace(/SLUG/g, instanceInfo.censusid)
      , confcmd = getConfCmd(instanceInfo)
      ;

    [ bootcmd,
      , confcmd
      , pushcmd
      , domainscmd
    ].forEach(function(cmd) {
      console.log(cmd);
      var result = execSync.run(cmd);
      console.log('exited with ' + result.code);
    });

    console.log([
      'Your new census instance is live at',
      '',
      instanceInfo.siteurl,
      ''
      ].join('\n')
    )
  });
}

exports.config = function(id) {
  if (id === 'all') {
    getAllInstanceInfo(function(err, instances) {
      instances.forEach(function(instanceInfo) {
        confcmd = getConfCmd(instanceInfo);
        execSync.run(confcmd);
      });
    });
  } else {
    getInstanceInfo(id, function(err, instanceInfo) {
      confcmd = getConfCmd(instanceInfo);
      execSync.run(confcmd);
    });
  }
}

// add collaborator to heroku instance
exports.sharing = function(email, id) {
  function makeCmd(instanceInfo) {
    return confcmd = 'heroku sharing:add --remote SLUG EMAIL'
      .replace(/SLUG/g, instanceInfo.censusid)
      .replace(/EMAIL/g, email)
      ;
  }
  if (id === 'all') {
    getAllInstanceInfo(function(err, instances) {
      instances.forEach(function(instanceInfo) {
        // console.log(makeCmd(instanceInfo));
        execSync.run(makeCmd(instanceInfo));
      });
    });
  } else {
    getInstanceInfo(id, function(err, instanceInfo) {
      // console.log(makeCmd(instanceInfo));
      execSync.run(makeCmd(instanceInfo));
    });
  }
}

function getConfCmd(instanceInfo) {
  var confcmd = 'heroku config:set --remote SLUG '.replace(/SLUG/g, instanceInfo.censusid);

  var envvars = [
    'CONFIG_URL',
    'GOOGLE_APP_ID',
    'GOOGLE_APP_SECRET',
    'GOOGLE_USER',
    'GOOGLE_PASSWORD',
    'CENSUS_ID'
  ];

  envvars.forEach(function(envvar) {
    confcmd += envvar + '="' + instanceInfo[envvar.toLowerCase().replace(/_/g, '')] + '"';
    confcmd += ' ';
  })
  // will probably override in config but set a default value so that login works out of the box
  confcmd += 'SITE_URL=' + instanceInfo.siteurl + ' ';
  return confcmd;
}

exports.remotes = function() {
  getAllInstanceInfo(function(err, instances) {
    instances.forEach(function(inst) {
      cmd = 'heroku git:remote -r SLUG -a opendatacensus-SLUG'.replace(/SLUG/g, inst.censusid);
      console.log(cmd);
      execSync.run(cmd);
    });
  });
}


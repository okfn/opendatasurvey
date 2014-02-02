var fs = require('fs')
  , path = require('path')
  , request = require('request')
  , sinon = require('sinon')

  , config     = require('../lib/config.js')
  ;

exports.options = {
 'key': '0AqR8dXc6Ji4JdHR5WWdUU2dYUElPaFluUlBJbkFOMUE'
};

// use the test database
config.set('database_spreadsheet_key', exports.options.key);

exports.setFixtures = function() {
  var data = {};
  ['config', 'questions', 'datasets', 'places'].forEach(function(name) {
    data[name] = fs.readFileSync(path.join('tests', 'fixtures', name + '.csv'), 'utf8');
  });
  global.request = require('request');
  sinon
    .stub(request, 'get', stubbed);
        
  function stubbed(url, cb) {
    if (url == config.get('configUrl')) {
      cb(null, null, data['config']);
    } else if (url == config.get('question')) {
      cb(null, null, data['questions'])
    } else if (url == config.get('datasets')) {
      cb(null, null, data['datasets'])
    } else if (url == config.get('places')) {
      cb(null, null, data['places'])
    } else {
      request.get.restore();
      request.get(url, function(err,res,body) {
        // restub
        sinon.stub(request, 'get', stubbed);
        cb(err,res,body)
      });
      // console.error('No fixture for url ' + url);
    }
  }
}



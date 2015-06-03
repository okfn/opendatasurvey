// var fs = require('fs')
//   , path = require('path')
//   , request = require('request')
//   , sinon = require('sinon')
//   , argv = require('optimist').argv

//   , config     = require('../lib/config.js')
//   , util = require('../lib/util')
//   ;


// exports.options = {
//  'key': '0AqR8dXc6Ji4JdHR5WWdUU2dYUElPaFluUlBJbkFOMUE',
//  'userDbKey': '0AqR8dXc6Ji4JdE5IdEhuQTZCTGp1em84VEZZcC04aUE',
//  censusid: 'test'
// };

// // set timeouts
// exports.TIMEOUT = 3000;
// exports.LONG_TIMEOUT = 10000;
// if (argv.patient) {
//   exports.TIMEOUT *= 3;
//   exports.LONG_TIMEOUT *= 3;
// }

// exports.simpleConfigUrl = 'https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdEg2elXXXX&usp=drive_web#gid=2';
// exports.simpleConfigUrlCsv = 'https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdEg2elXXXX&single=true&gid=2&output=csv';

// // use the test database
// config.set('database_spreadsheet_key', exports.options.key);
// config.set('display_year', 2013);

// exports.setFixtures = function() {
//   var data = {};
//   ['config', 'questions', 'datasets', 'places', 'config-simple'].forEach(function(name) {
//     data[name] = fs.readFileSync(path.join('tests', 'fixtures', name + '.csv'), 'utf8');
//   });

//   sinon
//     .stub(request, 'get', stubbed);

//   function _csv(name) {
//     return util.getCsvUrlForGoogleSheet(config.get(name))
//   };

//   function stubbed(url, cb) {
//     if (url === exports.simpleConfigUrlCsv) {
//       cb(null, null, data['config-simple']);
//     } else if (url == _csv('configUrl')) {
//       cb(null, null, data['config']);
//     } else if (url == _csv('questions')) {
//       cb(null, null, data['questions'])
//     } else if (url == _csv('datasets')) {
//       cb(null, null, data['datasets'])
//     } else if (url == _csv('places')) {
//       cb(null, null, data['places'])
//     } else {
//       request.get.restore();
//       request.get(url, function(err,res,body) {
//         // restub
//         sinon.stub(request, 'get', stubbed);
//         cb(err,res,body)
//       });
//       // console.error('No fixture for url ' + url);
//     }
//   }
// }

// exports.unsetFixtures = function() {
//   request.get.restore();
// };

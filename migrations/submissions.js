var _ = require('underscore');
var chalk = require('chalk');
var csv = require('csv');
var CSVRow = require('./utils').CSVRow;
var fs = require('fs');
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');


csv.parse(fs.readFileSync(process.argv[2]), function(E, D) {
  var columns = (D || [])[0];


  if(E)
    RJ(E);

  Promise.all([_.rest(D).map(function(U) {
    var row = CSVRow(U, columns);


    return new Promise(function(RSU, RJU) {
      models.Entry.upsert({
        id             : row('submissionid').toString(),
        site           : row('censusid'),
        year           : moment(row('timestamp'), moment.ISO_8601).year(),
        place          : row('place'),
        dataset        : row('dataset'),
        answers        : [],
        submissionNotes: row('details'),
        reviewed       : parseInt(row('reviewed')) === 1,
        reviewResult   : row('reviewresult') === 'accepted',
        reviewComments : row('reviewcomments'),
        details        : '',
        is_current     : row('reviewresult') === 'accepted'
      })
        .then(function() { RSU(); })
        .catch(function(E) { RJU(E); });
    });
  })])
    .then(function() { console.log(chalk.green((D.length - 1) + ' submission(s) successfully loaded!')); })
    .catch(function(E) { console.log(chalk.red('Error while loading data: ' + E)); });
});
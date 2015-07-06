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
      models.User.upsert({
        id       : row('userid'),
        email    : row('email'),
        firstName: row('givenname'),
        homepage : row('homepage'),
        lastName : row('familyname'),
        photo    : row('photo'),
        anonymous: false
      })
        .then(function() { RSU(false); })
        .catch(function(E) { RJU(E); });
    });
  })])
    .then(function(C) { console.log(chalk.green((D.length - 1) + ' user(s) successfully loaded!')); })
		.catch(function(E) { console.log(chalk.red('Error while loading data: ' + E)); });
});
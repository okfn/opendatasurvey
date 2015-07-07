var _ = require('underscore');
var chalk = require('chalk');
var csv = require('csv');
var fs = require('fs');
var fileData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');


csv.parse(fileData, {columns: true}, function(ER, D) {
  Promise.each(D, function(E) {
      models.Entry.upsert({
        id     : E.submissionid.toString(),
        site   : E.censusid,
        year   : moment(E.timestamp, moment.ISO_8601).year(),
        place  : E.place,
        dataset: E.dataset,

        answers: _.chain([
          'exists',
          'digital',
          'public',
          'machinereadable',
          'bulk',
          'openlicense',
          'uptodate',
          'online',
          'free'
        ]).map(function(Q) { return [Q, E[Q]]; }).object().value(),

        submissionNotes: E.details,
        reviewed       : parseInt(E.reviewed) === 1,
        reviewResult   : E.reviewresult === 'accepted',
        reviewComments : E.reviewcomments,
        details        : '',
        is_current     : E.reviewresult === 'accepted'
      });
  })
    .then(function() { console.log(chalk.green((D.length - 1) + ' submission(s) successfully loaded!')); })
    .catch(function(E) { console.log(chalk.red('Error while loading data: ' + E)); });
});
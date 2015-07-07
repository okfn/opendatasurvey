var _ = require('underscore');
var chalk = require('chalk');
var csv = require('csv');
var fs = require('fs');
var submissionsData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
var entriesData = fs.readFileSync(process.argv[3], {encoding: 'utf-8'});
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');

var questions = [
  'exists',
  'digital',
  'public',
  'machinereadable',
  'bulk',
  'openlicense',
  'uptodate',
  'online',
  'free'
];


csv.parse(submissionsData, {columns: true}, function(SER, SD) {
  // All Submissions get into DB with isCurrent === false
  Promise.each(SD, function(S) {
    models.Entry.upsert({
      id             : S.submissionid.toString(),
      site           : S.censusid,
      year           : S.timestamp ? moment(S.timestamp, moment.ISO_8601).year() : S.year,
      place          : S.place,
      dataset        : S.dataset,
      answers        : _.chain(questions).map(function(Q) { return [Q, S[Q]]; }).object().value(),
      submissionNotes: S.details,
      reviewed       : parseInt(S.reviewed) === 1,
      reviewResult   : S.reviewresult === 'accepted',
      reviewComments : S.reviewcomments,
      details        : '',
      isCurrent     : false
    })
      .catch(function(E) { console.log(chalk.red('Error while loading data: ' + E)); });
  })
    .catch(function(E) { console.log(chalk.red('Error while loading data: ' + E)); });

  // Walk over Entries sheet and find a match for each one in Submissions sheet.
  // Merge non-empty properties of Entry into Submission properties.
  csv.parse(entriesData, {columns: true}, function(EER, ED) {
    Promise.each(ED, function(E) {
      var recentSubmission = _.chain(SD)
        .filter(function(S) {
          var entryYear = E.timestamp ? moment(E.timestamp, moment.ISO_8601).year() : E.year;
          var submissionYear = S.timestamp ? moment(S.timestamp, moment.ISO_8601).year() : S.year;


          return entryYear === submissionYear && S.reviewresult === 'accepted' && _.every(
            ['censusid', 'place', 'dataset'],
            function(F) { return E[F] === S[F]; }
          );
        })

        .sortBy(function(S) {
          // Sort by unix time
          return S.timestamp ? moment(S.timestamp, moment.ISO_8601).format('X') : S.year;
        })

        .last()
        .value();

      if(!recentSubmission)
        return false;

      console.log(chalk.dim(recentSubmission.submissionid));

      // Merge non-empty properties of Entry into Submissions properties and save to DB
      // with isCurrent === true
      models.Entry.upsert({
        id: recentSubmission.submissionid.toString(),
        site: E.censusid,

        answers: _.chain(questions)
          .map(function(Q) { return [Q, E[Q] || recentSubmission[Q]]; })
          .object()
          .value(),

        submissionNotes: E.details || recentSubmission.details,
        reviewed       : parseInt(E.reviewed) === 1,
        reviewResult   : E.reviewresult === 'accepted',
        reviewComments : E.reviewcomments || recentSubmission.reviewcomments,
        details        : '',
        isCurrent     : true
      });
    })
      .then(function() { console.log(chalk.green((ED.length + SD.length - 2) + ' submission(s) successfully loaded!')); })
      .catch(function(E) { console.log(chalk.red('Error while loading data: ' + E)); });
  });
});

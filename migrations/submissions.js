var _ = require('underscore');
var chalk = require('chalk');
var csv = require('csv');
var fs = require('fs');
var submissionsData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
var entriesData = fs.readFileSync(process.argv[3], {encoding: 'utf-8'});
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');


csv.parse(submissionsData, {columns: true}, function(SER, SD) {
  csv.parse(entriesData, {columns: true}, function(EER, ED) {
    _.each(ED, function(E) {
      // Find most recent Submission with same key properties as Entry. Merge Submission
      // properties into empty properties of Entry
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
    });
  });
});
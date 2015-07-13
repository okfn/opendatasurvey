var _ = require('lodash');
var csv = require('csv');
var fs = require('fs');
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var validator = require('validator');
var entriesData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
var anonymousUserId = '0e7c393e-71dd-4368-93a9-fcfff59f9fff';
var questions = [
  'exists',
  'digital',
  'public',
  'machinereadable',
  'bulk',
  'openlicense',
  'uptodate',
  'online',
  'free',
  'url',
  'format',
  'licenseurl',
  'dateavailable',
  'officialtitle',
  'publisher',
  'qualityinfo',
  'qualitystructure',
  'details'
];


var submissionQuery = models.Entry.findAll(
  {
    where: {
      isCurrent: false
      //reviewResult: true
    }
  }
);


submissionQuery
  .then(function(submissions) {

    csv.parse(entriesData, {columns: true}, function(R, D) {

      console.log('Entry count:');
      console.log(D.length);

      Promise.each(D, function(obj) {

        var entryData = {},
            normalized_timestamp,
            matches,
            match;

        // normalize timestamps
        if (obj.timestamp) {
          normalized_timestamp = moment(obj.timestamp.trim());
          if (normalized_timestamp.format() === "Invalid date") {
            normalized_timestamp = moment(obj.timestamp.trim(), 'DD/MM/YYYY HH:mm:ss');
          }
          obj.timestamp = normalized_timestamp.format();
        }

        if (!obj) {console.log('not');console.log(obj);}

        // assign year correctly to fix old issues with mistmatched submission timestamp + year
        if (obj.timestamp && normalized_timestamp.year() <= 2013) {
          obj.year = 2013;
        } else if (normalized_timestamp) {
          obj.year = normalized_timestamp.year();
        }

        matches = _.filter(submissions, function(s) {
          return (s.year === parseInt(obj.year, 10)) && (s.site === obj.censusid) &&
            (s.place === obj.place) && (s.dataset === obj.dataset);
        });

        // normalize the answers to questions
        obj.answers = _.chain(questions).map(function(Q) {

          var correcter = {
            'yes': true,
            'no': false,
            'unsure': null
          };

          if (obj[Q] && (_.indexOf(_.keys(correcter), obj[Q].trim().toLowerCase())) >= 0) {

            obj[Q] = correcter[obj[Q].trim().toLowerCase()];

          }

          return [Q, obj[Q]];

        }).object().value();

        // matches = _.sortBy(matches, function(s) {
        //   if (s.timestamp) {
        //     return moment(s.timestamp);
        //   } else {
        //     return moment('01-01-2012 00:00:00');
        //   }
        // });

        if (matches.length === 0) {

          console.log(obj.year, obj.censusid, obj.place, obj.dataset, obj.timestamp);
          console.log(matches.length);

        } else {

          matches[0].details = obj.details;
          matches[0].answers = obj.answers;
          matches[0].reviewed = true;
          matches[0].reviewResult = true;
          matches[0].details = obj.details;
          matches[0].isCurrent = true;

          matches[0].save()
            .then(function(obj) {
              console.log('SAVED AS ENTRY');
              console.log(obj.year, obj.censusid, obj.place, obj.dataset, obj.updatedAt);
            });
        }

        // return models.Entry.create(submissionData)
        //   .then(function(entry) {

        //     console.log('saved new entry');
        //     console.log(entry.createdAt);
        //     console.log(' --- ');

        //   })
        //   .catch(function(error) {console.log('error::::');console.log(error);});

      });

    });

  })
  .catch(function(error) {console.log(error);});

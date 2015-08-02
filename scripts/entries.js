var _ = require('lodash');
var fs = require('fs');
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');
var csv = require('csv');
var uuid = require('node-uuid');
var validator = require('validator');
var entriesData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
var parser = Promise.promisify(csv.parse);
var utils = require('./utils');


var cleanEntry = function(obj) {

  var entryData = {},
      normalized_timestamp,
      matches,
      match;

  // correct identifiers
  if (_.indexOf(_.keys(utils.idMapper), obj.censusid) >= 0) {
    console.log('correct id :: ' + obj.censusid);
    obj.censusid = utils.idMapper[obj.censusid];
  }

  // normalize timestamps
  if (obj.timestamp) {
    normalized_timestamp = moment(obj.timestamp.trim());
    if (normalized_timestamp.format() === "Invalid date") {
      normalized_timestamp = moment(obj.timestamp.trim(), 'DD/MM/YYYY HH:mm:ss');
    }
    obj.timestamp = normalized_timestamp.format();
  }

  // assign year correctly to fix old issues with mistmatched timestamp + year
  if (obj.timestamp && normalized_timestamp.year() <= 2013) {
    obj.year = 2013;
  } else if (normalized_timestamp) {
    obj.year = normalized_timestamp.year();
  }

  // normalize the answers to questions
  obj.answers = _.chain(utils.questions).map(function(Q) {
    if (obj[Q] && (_.indexOf(_.keys(utils.qCorrecter), obj[Q].trim().toLowerCase())) >= 0) {
      obj[Q] = utils.qCorrecter[obj[Q].trim().toLowerCase()];
    }
    return [Q, obj[Q]];
  }).object().value();

  delete obj.answers.details;

  return obj;

};


utils.loadData({

  submissions: models.Entry.findAll(),
  entries: parser(entriesData, {columns: true})

}).then(function(D) {

  console.log('submission count: ' + D.submissions.length);
  console.log('entry count: ' + D.entries.length);

  var matches = [];

  _.each(D.entries, function(obj) {

    obj = cleanEntry(obj);
    matches.push({
      entry: obj,
      submissions: _.filter(D.submissions, function(s) {
        return (s.site === obj.censusid) && (s.place === obj.place) &&
          (s.dataset === obj.dataset);
        })
      });
  });

  _.each(matches, function(m, i, l) {

    var entryYear = parseInt(m.entry.year, 10),
        submissionYears = _.map(m.submissions, function(s) {return s.year;}),
        matchYear,
        candidates,
        candidate;

    if (m.submissions.length === 0 ||
       _.indexOf(submissionYears, entryYear) === -1) {

      // some census instances have entries with no submissions!
      // and, some have only matching future submissions (which is actually the same)!
      // Looking at you global census, 2013 :)
      console.log('Entry has no matching submission');
      console.log(m.entry.year, m.entry.censusid, m.entry.place, m.entry.dataset);
      console.log('  ------  ');

      m.toSave = _.merge(m.entry, {
        id: uuid.v4(),
        site: m.entry.censusid,
        submitterId: utils.anonymousUserId,
        reviewerId: utils.anonymousUserId,
        reviewed: true,
        reviewResult: true,
        isCurrent: true
      });
      m.saveStrategy = 'create';

    } else {

      if (_.indexOf(submissionYears, entryYear) >= 0) {
        matchYear = entryYear;
      } else if  (_.indexOf(submissionYears, (entryYear - 1)) >= 0) {
        matchYear = entryYear - 1;
      } else if (_.indexOf(submissionYears, (entryYear - 2)) >= 0) {
        matchYear = entryYear - 2;
      } else {
        console.log('we should never get here!');
        console.log('matchYear is ' + matchYear);
      }

      console.log('For ' + entryYear + ', the matching year is: ' + matchYear);

      candidates = _.filter(m.submissions, function(s) {return s.year === matchYear;});
      candidate = _.first(_.sortBy(candidates, function(o) {return -o.createdAt;}));

      if (!candidate) {
        console.log('somehow we do not have a candidate match. This should not happen.');
      } else {

        if (matchYear === entryYear) {

          candidate.answers = m.entry.answers;
          candidate.details = m.entry.details;
          candidate.isCurrent = true;
          candidate.reviewed = true;
          candidate.reviewResult = true;
          m.toSave = candidate;
          m.saveStrategy = 'update';

        } else {

          m.toSave = _.merge(candidate.dataValues, {
            id: uuid.v4(),
            reviewed: true,
            reviewResult: true,
            isCurrent: true
          });
          m.saveStrategy = 'create';

        }

      }

    }
  });

  Promise.each(matches, function(m) {

    if (m.saveStrategy === 'create') {
      return models.Entry.create(m.toSave).then(function(r){console.log('created');}).catch(console.log.bind(console));
    } else {
      // update
      return m.toSave.save().then(function(r) {console.log('updated');}).catch(console.log.bind(console));
    }

  });

}).catch(console.log.bind(console));

var _ = require('lodash');
var fs = require('fs');
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');
var csv = require('csv');
var uuid = require('node-uuid');
var validator = require('validator');
var submissionsData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
var parser = Promise.promisify(csv.parse);
var utils = require('./utils');


var cleanSubmission = function(obj, users) {

  var normalized_timestamp,
      subId,
      subName,
      revId,
      revName,
      revLookup;

  // correct identifiers
  if (_.indexOf(_.keys(utils.idMapper), obj.censusid) >= 0) {
    console.log('correct id ' + obj.censusid);
    obj.censusid = utils.idMapper[obj.censusid];
  }

  // fix old ids that are ints as strings
  if (!validator.isUUID(obj.submissionid, 4)) {
    obj.submissionid = uuid.v4();
  }

  // normalize timestamps
  normalized_timestamp = moment(obj.timestamp.trim());
  if (normalized_timestamp.format() === "Invalid date") {
    normalized_timestamp = moment(obj.timestamp.trim(), 'DD/MM/YYYY HH:mm:ss');
  }
  obj.timestamp = normalized_timestamp.format();

  // assign year correctly to fix old issues with mistmatched submission timestamp + year
  if (normalized_timestamp.year() <= 2013) {
    obj.year = 2013;
  } else {
    obj.year = normalized_timestamp.year();
  }

  // manipulate the submitter and reviewer data so we can reference the User table
  // submitter can be anonymous, and we created an anonymous user for this
  // backwards compat of anonymous
  // reviewer can be empty, as some submissions can immediately become entries.
  // in this case, we set the reviewer to the same user as the submitter.
  subId = obj.submitterid.split(':');
  subName = obj.submitter.split(' ');
  revId = obj.reviewerid.split(':');
  revName = obj.reviewer.split(' ');

  // resolve our info on submitters and reviewers into user objects
  if (subId[1] === 'anonymous' || subId[0] === '') {
    obj.submitter = _.find(users, function(user) {
      return user.id === utils.anonymousUserId;
    });
  } else {
    obj.submitter = _.find(users, function(user) {
      return user.providers.google === subId[1];
    });
  }

  if (!revId[0]) {
    revLookup = subId[1];
  } else {
    revLookup = revId[1];
  }

  if (revLookup === 'anonymous' || revId[0] === '' && subId[0] === '') {
    obj.reviewer = _.find(users, function(user) {
      return user.id === utils.anonymousUserId;
    });
  } else {
    obj.reviewer = _.find(users, function(user) {
      return user.providers.google === revLookup;
    });
  }

  // normalize the answers to questions
  obj.answers = _.chain(utils.questions).map(function(Q) {

    if (obj[Q] && (_.indexOf(_.keys(utils.qCorrecter), obj[Q].trim().toLowerCase())) >= 0) {
      obj[Q] = utils.qCorrecter[obj[Q].trim().toLowerCase()];
    }
    return [Q, obj[Q]];
  }).object().value();

  delete obj.submitterid;
  delete obj.reviewerid;

  return obj;
};


utils.loadData({

  users: models.User.findAll(),
  submissions: parser(submissionsData, {columns: true})

}).then(function(D) {

  var dataset = [];

  _.each(D.submissions, function(obj) {

    var data = {};

    obj = cleanSubmission(obj, D.users);

    // now let's explicitly set the data we want to save
    data.id = obj.submissionid;
    data.site = obj.censusid;
    data.createdAt = obj.timestamp;
    data.year = obj.year;
    data.place = obj.place;
    data.dataset = obj.dataset;
    data.answers = obj.answers;
    data.submissionNotes = obj.details;
    data.reviewed = parseInt(obj.reviewed) === 1;
    data.reviewResult = obj.reviewresult === 'accepted';
    data.reviewComments = obj.reviewcomments;
    data.details = obj.details;
    data.isCurrent = false;
    data.submitterId = obj.submitter.id;
    data.reviewerId = obj.reviewer.id;

    dataset.push(data);

  });

  return models.Entry.bulkCreate(dataset, {returning: true})
    .then(function(results) {

      console.log('Saved ' + results.length + ' submission entries.');

    }).catch(console.log.bind(console));

}).catch(console.log.bind(console));

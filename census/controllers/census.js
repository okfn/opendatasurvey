'use strict';

var _ = require('lodash');
var config = require('../config');
var uuid = require('node-uuid');
var utils = require('./utils');
var modelUtils = require('../models').utils;


var submitGetHandler = function(req, res, data) {

  var addDetails = _.find(data.questions, function(q) { return q.id === 'details'; }),
      current = data.currentState.match;

  res.render('create.html', {
    canReview: true, // flag always on for submission
    submitInstructions: req.params.site.settings.submit_page,
    places: modelUtils.translateSet(req, data.places),
    current: current,
    datasets: modelUtils.translateSet(req, data.datasets),
    questions: data.questions,
    addDetails: addDetails,
    year: req.app.get('year')
  });
  return;
};


var submitPostHandler = function(req, res, data) {

  var errors,
      objToSave = {},
      answers,
      saveStrategy,
      anonymous = true,
      submitterId = utils.ANONYMOUS_USER_ID,
      query,
      approveFirstSubmission,
      current = data.currentState.match,
      pending = data.currentState.pending;

  if (req.params.site.settings.approve_first_submission) {
    approveFirstSubmission = req.params.site.settings.approve_first_submission;
  }

  errors = utils.validateData(req);

  if (pending) {
    if (!Array.isArray(errors)) {
      errors = [];
    }
    errors.push({
      param: 'conflict',
      msg: 'There is already a queued submission for this data. ' +
        '<a href="/place/PL/YR">See the queued submission</a>'.replace('PL', current.place).replace('YR', current.year)
    });
  }

  if (errors) {

    var addDetails = _.find(data.questions, function(q) { return q.id === 'details'; });

    res.statusCode = 400;
    res.render('create.html', {
      canReview: true, // flag always on for submission
      submitInstructions: req.params.site.settings.submit_page,
      places: modelUtils.translateSet(req, data.places),
      datasets: modelUtils.translateSet(req, data.datasets),
      questions: data.questions,
      addDetails: addDetails,
      year: req.app.get('year'),
      current: current,
      errors: errors,
      formData: req.body
    });
    return;

  } else {

    if (req.body.anonymous && req.body.anonymous === 'false') {
      anonymous = false;
      submitterId = req.user.id;
    }

    if (!current || current.year !== req.app.get('year')) {
      console.log('we are definitely creating a new entry');

      objToSave.id = uuid.v4();
      objToSave.site = req.params.site.id;
      objToSave.place = req.body.place;
      objToSave.dataset = req.body.dataset;
      objToSave.details = req.body.details;
      objToSave.year = req.app.get('year');
      objToSave.submitterId = submitterId;

      if (approveFirstSubmission) {
        objToSave.isCurrent = true;
        objToSave.reviewed = true;
        objToSave.reviewResult = true;
        objToSave.reviewerId = submitterId;
      } else {
        objToSave.isCurrent = false;
      }

      saveStrategy = 'create';

    } else if (current.isCurrent) {
      console.log('we have existing current entry, so create a new submission');

      objToSave.id = uuid.v4();
      objToSave.site = req.params.site.id;
      objToSave.place = req.body.place;
      objToSave.dataset = req.body.dataset;
      objToSave.submissionNotes = req.body.details;
      objToSave.details = req.body.details;
      objToSave.year = req.app.get('year');
      objToSave.isCurrent = false;
      objToSave.submitterId = submitterId;

      saveStrategy = 'create';

    } else {
      console.log('we have existing submission and no current entry. we usually ' +
                  'should not get here because of earlier condition that lodges a ' +
                  'conflict error on the form');

      objToSave = current;

      saveStrategy = 'update';

    }

    answers = req.body;
    delete answers.place;
    delete answers.dataset;
    delete answers.year;
    delete answers.details;
    delete answers.anonymous;
    objToSave.answers = utils.normalizedAnswers(answers);

    if (saveStrategy === 'create') {
      query = req.app.get('models').Entry.create(objToSave);
    } else if (saveStrategy === 'update') {
      query = objToSave.save();
    }

    query
      .then(function(result) {

        var msg,
            msgTmpl,
            redirectPath,
            submissionPath;

        if (!result) {

          msg = 'There was an error!';
          req.flash('error', msg);

        } else {

          msgTmpl = 'Thanks for your submission.REVIEWED You can check back here any time to see the current status.';

          if (!result.isCurrent) {

            msg = msgTmpl.replace('REVIEWED', ' It will now be reviewed by the editors.');
            submissionPath = '/submission/' + result.id;
            redirectPath = submissionPath;

          } else {

            msg = msgTmpl.replace('REVIEWED', '');
            submissionPath = '/submission/' + result.id;
            redirectPath = '/place/' + result.place;

          }

          req.flash('info', msg);

        }

        res.redirect(redirectPath + '?post_submission=' + submissionPath);
        return;

      }).catch(console.log.bind(console));
  }
};


var pendingEntry = function (req, res) {

  var dataOptions,
      entryQueryParams = {where: {id: req.params.id},
                          include: [{model: req.app.get('models').User, as: 'Submitter'},
                                    {model: req.app.get('models').User, as: 'Reviewer'}]};

  req.app.get('models').Entry.findOne(entryQueryParams)
    .then(function(result) {
      if (!result) {
        res.status(404).send('There is no submission with id ' + req.params.id);
        return;
      }
      dataOptions = _.merge(modelUtils.getDataOptions(req),
                            {place: result.place, dataset: result.dataset,
                             ynQuestions: false, with: {Entry: false}});
      modelUtils.getData(dataOptions)
        .then(function(data) {
          data.current = result;
          data.reviewers = utils.getReviewers(req, data);
          data.canReview = utils.canReview(data.reviewers, req.user);
          data.disqus_shortname = config.get('disqus_shortname');
          data.reviewClosed = result.reviewResult || (result.year !== req.app.get('year'));
          data.reviewInstructions = config.get('review_page');
          data.questions = utils.getFormQuestions(req, data.questions);
          res.render('review.html', data);
        }).catch(console.log.bind(console));
    });
};


var submit = function (req, res) {
  var dataOptions = _.merge(modelUtils.getDataOptions(req), {ynQuestions: false});
  modelUtils.getData(dataOptions)
    .then(function(data) {
      data.questions = utils.getFormQuestions(req, data.questions);
      data.currentState = utils.getCurrentState(data, req);
      if (req.method === 'POST') {
        submitPostHandler(req, res, data);
      } else {
        submitGetHandler(req, res, data);
      }
    }).catch(console.log.bind(console));
};


var reviewPost = function (req, res) {

  var  acceptSubmission = req.body.submit === 'Publish',
      answers;

  req.app.get('models').Entry.findById(req.params.id).then(function(result){
    if (!result) {
      res.send(400, 'There is no matching entry.');
      return;
    }

    var dataOptions = _.merge(modelUtils.getDataOptions(req),
                              {place: result.place, dataset: result.dataset,
                               cascade: true, with: {Dataset: false, Place: false, Question: false}});
    modelUtils.getData(dataOptions)
      .then(function(data) {

        if (!utils.canReview(data.reviewers, req.user)) {
          res.status(403).send('You are not allowed to review this entry');
          return;
        }

        var ex = _.first(data.entries);
        result.reviewerId = req.user.id;
        result.reviewed = true;
        result.reviewComments = req.body.reviewcomments;
        result.details = req.body.details;

        answers = req.body;
        delete answers.place;
        delete answers.dataset;
        delete answers.year;
        delete answers.anonymous;
        delete answers.reviewcomments;
        delete answers.submit;
        delete answers.details;
        result.answers = utils.normalizedAnswers(answers);

        if (acceptSubmission) {
          result.isCurrent = true;
          result.reviewResult = true;
        } else {
          result.reviewResult = false;
        }

        result.save().then(function() {

          if (ex) {

            if (acceptSubmission) {
              ex.isCurrent = false;
            }

            ex.save().then(function() {
              var msg;
              if (acceptSubmission) {
                msg = "Submission processed and entered into the census.";
                req.flash('info', msg);
              } else {
                msg = "Submission marked as rejected.";
                req.flash('info', msg);
              }
              res.redirect('/');
              return;

            }).catch(console.log.bind(console));

          } else {
            var msg;
            if (acceptSubmission) {
              msg = "Submission processed and entered into the census.";
              req.flash('info', msg);
            } else {
              msg = "Submission marked as rejected.";
              req.flash('info', msg);
            }
            res.redirect('/');
            return;
          }

        }).catch(console.log.bind(console));
      }).catch(console.log.bind(console));
  }).catch(console.log.bind(console));
};


module.exports = {
  submit: submit,
  pendingEntry: pendingEntry,
  reviewPost: reviewPost
};

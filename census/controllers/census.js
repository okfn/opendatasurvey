'use strict';

var _ = require('lodash');
var config = require('../config');
var uuid = require('node-uuid');
var routeUtils = require('../routes/utils');
var modelUtils = require('../models').utils;
var anonymousUserId = '0e7c393e-71dd-4368-93a9-fcfff59f9fff';


var _normalizedAnswers = function(answers) {

  var normed = {};

  _.each(answers, function(v, k) {

    if (v === 'true') {
      normed[k] = true;
    } else if (v === 'false') {
      normed[k] = false;
    } else if (v === 'null') {
      normed[k] = null;
    } else {
      normed[k] = v;
    }
  });

  return normed;
};


var _getFormQuestions = function(req, questions) {

  // resolve question dependants, and filter dependants out of top-level list
  questions = modelUtils.translateSet(req, questions);
  _.each(questions, function(q) {
    if (q.dependants) {
      _.each(q.dependants, function(d, i, l) {
        l[i] = _.find(questions, function(_q) {
          if (_q.id === d) {
            questions = _.reject(questions, function(__q) {return __q.id === _q.id;});
            return true;
          }
          return false;
        });
      });
    }
  });

  // need to sort by order for the form
  questions = _.sortBy(questions, function(q) {return q.order;});

  return questions;

};


var _getCurrentMatch = function(entries, queryParams) {

  var match;

  if (!entries) {
    match = queryParams;
  } else {
    entries = _.sortByOrder(entries, 'createdAt', 'desc');
    match = _.find(entries, function(e) {return e.isCurrent;});
    if (!match){
      match = _.first(entries);
    }
  }
  return match;

};


var _submitGetHandler = function(req, res, current, questions, places, datasets) {

  var addDetails = _.find(questions, function(q) {return q.id === 'details';});

  res.render('create.html', {
    canReview: true, // flag always on for submission
    submitInstructions: req.params.site.settings.submit_page,
    places: modelUtils.translateSet(req, places),
    current: current,
    datasets: modelUtils.translateSet(req, datasets),
    questions: questions,
    addDetails: addDetails,
    year: req.app.get('year')
  });
  return;

};


var _submitPostHandler = function(req, res, current, questions, places, datasets, anonymousUser) {

  var errors,
      objToSave = {},
      answers,
      saveStrategy,
      anonymous = true,
      submitterId = anonymousUserId,
      query;

  errors = routeUtils.validateSubmitForm(req);

  if (current.year === req.app.get('year') && current.isCurrent === false) {
    if (!Array.isArray(errors)) {
      errors = [];
    }
    errors.push({
      param: 'conflict',
      msg: 'There is already a queued submission for this data. ' +
        '<a href="/submission/ID">See the queued submission</a>'.replace('ID', current.id)
    });
  }

  if (errors) {

    var addDetails = _.find(questions, function(q) {return q.id === 'details';});

    res.statusCode = 400;
    res.render('create.html', {
      canReview: true, // flag always on for submission
      submitInstructions: req.params.site.settings.submit_page,
      places: modelUtils.translateSet(req, places),
      datasets: modelUtils.translateSet(req, datasets),
      questions: questions,
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
      objToSave.year = req.app.get('year');
      objToSave.isCurrent = false;
      objToSave.submitterId = submitterId;

      saveStrategy = 'create';

    } else if (current.isCurrent) {
      console.log('we have existing current entry, so create a new submission');

      objToSave.id = uuid.v4();
      objToSave.site = req.params.site.id;
      objToSave.place = req.body.place;
      objToSave.dataset = req.body.dataset;
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
    console.log(answers);
    delete answers['place'];
    delete answers['dataset'];
    delete answers['year'];
    delete answers['anonymous'];
    objToSave.answers = _normalizedAnswers(answers);

    console.log(objToSave);

    if (saveStrategy === 'create') {
      query = req.app.get('models').Entry.create(objToSave);
    } else if (saveStrategy === 'update') {
      query = objToSave.save();
    }

    query
      .then(function(result) {

        var msg,
            msg_tmpl,
            redirect_path,
            submission_path;

        if (!result) {

          msg = 'There was an error!';
          req.flash('error', msg);

        } else {

          msg_tmpl = 'Thanks for your submission.REVIEWED You can check back here any time to see the current status.';

          if (!result.reviewed) {

            msg = msg_tmpl.replace('REVIEWED', ' It will now be reviewed by the editors.');
            submission_path = '/census/submission/' + result.id;
            redirect_path = submission_path;

          } else {

            msg = msg_tmpl.replace('REVIEWED', '');
            submission_path = '/census/submission/' + result.id;
            redirect_path = '/place/' + result.place;

          }

          req.flash('info', msg);

        }

        res.redirect(redirect_path + '?post_submission=' + submission_path);
        return;

      }).catch(console.log.bind(console));

  }

};


var pendingEntry = function (req, res) {

  var placeQueryParams,
      datasetQueryParams,
      entryQueryParams = {where: {id: req.params.id},
                          include: [{model: req.app.get('models').User, as: 'Submitter'},
                                    {model: req.app.get('models').User, as: 'Reviewer'}]};

  req.app.get('models').Entry.findOne(entryQueryParams)
    .then(function(result) {

      if (!result) {
        res.status(404).send('There is no submission with id ' + req.params.id);
        return;
      }

      placeQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: result.place}});
      datasetQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: result.dataset}});

      modelUtils.loadModels({

        dataset: req.app.get('models').Dataset.findOne(datasetQueryParams),
        place: req.app.get('models').Place.findOne(placeQueryParams),
        questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req))

      }).then(function(D) {

        res.render('review.html', {
          canReview: true,//(_.intersection(req.params.site.settings.reviewers, req.user.emails).length >= 1),
          reviewClosed: result.reviewResult || (result.year !== req.app.get('year')),
          reviewInstructions: config.get('review_page'),
          questions: _getFormQuestions(req, D.questions),
          current: result,
          dataset: D.dataset.translated(req.locale),
          place: D.place.translated(req.locale)
        });
      }).catch(console.log.bind(console));

    });
};


var submit = function (req, res) {

  var current,
      questions,
      entryQueryParams = modelUtils.siteQuery(req);

  if (req.query.place && req.query.dataset) {
    entryQueryParams = _.merge(entryQueryParams, {where: {place: req.query.place, dataset: req.query.dataset}});
  }

  modelUtils.loadModels({

    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req)),
    entries: req.app.get('models').Entry.findAll(entryQueryParams)

  }).then(function(D) {

    questions = _getFormQuestions(req, D.questions);
    current = _getCurrentMatch(D.entries, req.query);

    if (req.method === 'POST') {
      _submitPostHandler(req, res, current, questions, D.places, D.datasets);
    } else {
      _submitGetHandler(req, res, current, questions, D.places, D.datasets);
    }

  }).catch(console.log.bind(console));
};


var reviewPost = function (req, res) {

  var submissionId,
      acceptSubmission = req.body['submit'] === 'Publish',
      answers;

  req.app.get('models').Entry.findById(req.params.id).then(function(result){

    if (!result) {
      res.send(400, 'There is no matching entry.');
      return;
    }

    req.app.get('models').Entry.findAll(
      _.merge(modelUtils.siteQuery(req, true),
              {where: {place: result.place, dataset:
                       result.dataset, isCurrent: true}}))
      .then(function(exes) {
        var ex = _.find(_.sortByOrder(exes, 'year', 'desc'));

        result.reviewerId = req.user.id;
        result.reviewComments = req.body.reviewcomments;
        result.details = req.body.details;

        answers = req.body;
        delete answers['place'];
        delete answers['dataset'];
        delete answers['year'];
        delete answers['anonymous'];
        delete answers['reviewcomments'];
        delete answers['submit'];
        delete answers['details'];
        result.answers = _normalizedAnswers(answers);

        console.log(result.id, result.year, result.site, result.place, result.dataset);
        console.log(ex.id, ex.year, ex.site, ex.place, ex.dataset);

        if (acceptSubmission) {
          result.isCurrent = true;
          result.reviewResult = true;
        } else {
          result.reviewResult = false;
        }

        result.save().then(function() {

          if (ex) {

            ex.isCurrent = false;
            ex.save().then(function() {

              if (acceptSubmission) {
                var msg = "Submission processed and entered into the census.";
                req.flash('info', msg);
              } else {
                var msg = "Submission marked as rejected.";
                req.flash('info', msg);
              }
              res.redirect('/');
              return;

            }).catch(console.log.bind(console));

          } else {

            if (acceptSubmission) {
              var msg = "Submission processed and entered into the census.";
              req.flash('info', msg);
            } else {
              var msg = "Submission marked as rejected.";
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

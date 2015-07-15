'use strict';

var _ = require('lodash');
var config = require('../config');
var uuid = require('node-uuid');
var routeUtils = require('../routes/utils');
var modelUtils = require('../models').utils;

var _renderSubmit = function(req, res, data, current, status, errors, formData) {

  var addDetails = _.find(data.questions, function(q) {return q.id === 'details';});

    res.statusCode = status;
    res.render('create.html', {
      canReview: true, // flag always on for submission
      submitInstructions: req.params.site.settings.submit_page,
      places: modelUtils.translateSet(req, data.places),
      prefill: req.query,
      datasets: modelUtils.translateSet(req, data.datasets),
      questions: data.questions,
      addDetails: addDetails,
      year: req.app.get('year'),
      current: current,
      errors: errors,
      formData: formData
    });
  return;
};


var pendingEntry = function (req, res) {

  var placeQueryParams,
      datasetQueryParams;

  req.app.get('models').Entry.findById(req.params.id)
    .then(function(result) {

      if (!result) {

        res.status(404).send('There is no submission with id ' + req.params.id);
        return;

      }

      placeQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: result.place}});
      datasetQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: result.dataset}});

      modelUtils.loadModels({

        dataset: req.app.get('models').Dataset.findOne(datasetQueryParams),
        place: req.app.get('models').Dataset.findOne(placeQueryParams),
        questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req))

      }).then(function(D) {

        res.render('review.html', {
          canReview: true,
          reviewClosed: result.reviewResult,
          reviewInstructions: config.get('review_page'),
          questions: modelUtils.translateSet(D.questions),
          prefill: result,
          currrecord: result,
          dataset: D.dataset && D.dataset.translated(req.locale),
          place: D.place && D.place.translated(req.locale),
          disqus_shortname: req.app.get('config').get('disqus_shortname'),
          reviewState: true
        });

      }).catch(function(E) { console.log(E); });

    });
};


var submit = function (req, res) {

  var prefill = req.query,
      entryQueryParams = _.merge(modelUtils.siteQuery(req), {where: {place: prefill.place, dataset: prefill.dataset}}),
      questionQueryParams = modelUtils.siteQuery(req),
      objToSave = {},
      answers,
      errors,
      reboundFormData,
      responseStatus = 200;

  modelUtils.loadModels({

    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(questionQueryParams),
    entries: req.app.get('models').Entry.findAll(entryQueryParams)

  }).then(function(D) {

    // resolve question dependants, and filter dependants out of top-level list
    D.questions = modelUtils.translateSet(req, D.questions);
    _.each(D.questions, function(q) {
      if (q.dependants) {
        _.each(q.dependants, function(d, i, l) {
          l[i] = _.find(D.questions, function(_q) {
            if (_q.id === d) {
              //D.questions = _.reject(D.questions, function(__q) {return __q.id === _q.id;});
              return true;
            }
            return false;
          });
        });
      }
    });

    // need to sort by order for the form
    D.questions = _.sortBy(D.questions, function(q) {return q.order;});

    // validate the POST data and put the results on `errors`
    if (req.method === 'POST') {

      errors = routeUtils.validateSubmitForm(req);
      if (errors) {
        reboundFormData = req.body;
        responseStatus = 400;
      }

    }

    if (req.method === 'POST' && !errors) {

      objToSave.id = uuid.v4();
      objToSave.site = req.params.site.id;
      objToSave.place = req.body.place;
      objToSave.dataset = req.body.dataset;
      objToSave.year = req.app.get('year');
      objToSave.isCurrent = false;
      objToSave.submitter = req.user;

      answers = req.body;
      delete answers['place'];
      delete answers['dataset'];
      delete answers['year'];
      objToSave.answers = answers;

      console.log('modified');
      console.log(objToSave);
      console.log('does we have entry??');

      // if current entry is same year as now year

        // if current entry isCurrent = true;
          // set current entry isCurrent to false;
          // set new entry isCurrent to true;

        // if current entry isCurrent = false;
          // set new entry isCurrent to true;
          // don't have to change current entry;
          // but the entries SHOULD have he same id!!!!

      // else if current entry is previous year to now year

      // else if current entry is future year to now year


      console.log(D.entries);

      req.app.get('models').Entry.create(objToSave)
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
              submission_path = '/submission/' + result.id;
              redirect_path = submission_path;

            } else {

              msg = msg_tmpl.replace('REVIEWED', '');
              submission_path = '/submission/' + result.id;
              redirect_path = '/place/' + result.place;

            }

            req.flash('info', msg);

          }

          res.redirect(redirect_path + '?post_submission=' + submission_path);
          return;

        }).catch(console.log.bind(console));

    } else if (prefill.dataset && prefill.place) {

      if (D.entry) {

        prefill = _.extend(D.entry, prefill);

      }

      _renderSubmit(req, res, D, prefill, responseStatus, errors, reboundFormData);

    } else {

      _renderSubmit(req, res, D, prefill, responseStatus, errors, reboundFormData);

    }

  }).catch(console.log.bind(console));
};


var reviewPost = function (req, res) {

  var acceptSubmission = req.body['submit'] === 'Publish';

  // TODO: all process submission will look different, it was very specific to the
  // previous implementation

};


module.exports = {
  submit: submit,
  pendingEntry: pendingEntry,
  reviewPost: reviewPost
};

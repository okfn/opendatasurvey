'use strict';

var _ = require('lodash');
var config = require('../config');
var uuid = require('node-uuid');
var routeUtils = require('../routes/utils');
var modelUtils = require('../models').utils;


var submit = function (req, res) {

  var prefill = req.query,
      entryQueryParams = _.extend(modelUtils.siteQuery(req, true), {where: {place: prefill.place, dataset: prefill.dataset}}),
      submissionData = req.body,
      objToSave = {},
      errors,
      reboundFormData,
      response_status = 200;

  var render = function(data, current, status) {

    var addDetails;

    // resolve dependant questions
    data.questions = modelUtils.translateSet(req, data.questions);
    _.each(data.questions, function(obj, index, list) {
      _.each(obj.dependants, function(d, i, l) {
        if (d) {
          l[i] = _.find(data.questions, function(o) {
            if ((o.id === d)) {
              // remove the dependant from the top-level array
              data.questions = _.reject(data.questions, function(q) {return q.id === o.id;});
              return true;
            }
            return;
          });
        }
      });
    });

    addDetails = _.find(data.questions, function(q) {return q.id === 'details';});

    res.statusCode = status;
    res.render('create.html', {
      canReview: true, // flag always on for submission
      submitInstructions: req.params.site.settings.submit_page,
      places: modelUtils.translateSet(req, data.places),
      prefill: prefill,
      questions: data.questions,
      addDetails: addDetails,
      datasets: modelUtils.translateSet(req, data.datasets),
      year: req.app.get('year'),
      current: current,
      errors: errors,
      formData: reboundFormData
    });
    return;
  };

  modelUtils.loadModels({

    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req)),
    entry: req.app.get('models').Entry.findOne(entryQueryParams)

  }).then(function(D) {

    // validate the POST data and put the results on `errors`
    if (req.method === 'POST') {

      errors = routeUtils.validateSubmitForm(req);
      if (errors) {
        reboundFormData = submissionData;
        response_status = 400;
      }

    }

    if (req.method === 'POST' && !errors) {

      console.log('get stuff');
      console.log(submissionData);

      objToSave.id = uuid.v4();
      objToSave.site = req.params.site.id;
      objToSave.place = submissionData.place;
      objToSave.dataset = submissionData.dataset;
      objToSave.year = req.app.get('year');
      objToSave.isCurrent = false;
      objToSave.submitter = req.user;

      delete submissionData['place'];
      delete submissionData['dataset'];
      delete submissionData['year'];
      objToSave.answers = submissionData;

      console.log('modified');
      console.log(objToSave);
      console.log('does we have entry??');

      // TODO, logic to update entry
      // etc.

      console.log(D.entry);

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

        })
        .catch(function(error) {
          console.log('catching error');
          console.log(error);
        });

    } else if (prefill.dataset && prefill.place) {

      if (D.entry) {

        prefill = _.extend(D.entry, prefill);

      }

      render(D, prefill, response_status);

    } else {

      render(D, prefill, response_status);

    }

  });

};


var submission = function (req, res) {

  var placeQueryParams,
      datasetQueryParams;

  req.app.get('models').Entry.findById(req.params.id)
    .then(function(result) {

      if (!result) {

        res.status(404).send('There is no submission with id ' + req.params.id);
        return;

      }

      placeQueryParams = _.extend(modelUtils.siteQuery(req), {where: {id: result.place}});
      datasetQueryParams = _.extend(modelUtils.siteQuery(req), {where: {id: result.dataset}});

      modelUtils.loadModels({

        dataset: req.app.get('models').Dataset.findOne(datasetQueryParams),
        place: req.app.get('models').Dataset.findOne(placeQueryParams),
        questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req))

      }).then(function(D) {

        res.render('review.html', {
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
        return;

      }).catch(function(E) { console.log(E); });

    });
};


var reviewPost = function (req, res) {

  var acceptSubmission = req.body['submit'] === 'Publish';

  // TODO: all process submission will look different, it was very specific to the
  // previous implementation

};


module.exports = {
  submit: submit,
  submission: submission,
  reviewPost: reviewPost
};

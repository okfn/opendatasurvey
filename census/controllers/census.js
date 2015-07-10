'use strict';

var _ = require('lodash');
var uuid = require('node-uuid');
var routeUtils = require('../routes/utils');
var modelUtils = require('../models').utils;


var submit = function (req, res) {

  var prefill = req.query,
      entryQueryParams = {where: {place: prefill.place, dataset: prefill.dataset, year: req.app.get('year')}},
      submissionData = req.body,
      errors,
      reboundFormData,
      response_status = 200;

  var render = function(data, current, status) {
    res.statusCode = status;
    res.render('create.html', {
      canReview: true, // flag always on for submission
      submitInstructions: req.params.site.submit_page,
      places: modelUtils.translateSet(req, data.places),
      questions: modelUtils.translateSet(req, data.questions),
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

      req.app.get('models').Entry.insert(submissionData)
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
          canReview: routeUtils.canReview(req.user, D.place),
          reviewClosed: result.reviewResult,
          reviewInstructions: req.params.site.settings.review_page,
          questions: modelUtils.translateSet(D.questions),
          prefill: result,
          currrecord: result,
          dataset: D.dataset.translated(req.locale),
          place: D.place.translated(req.locale),
          disqus_shortname: req.app.get('config').get('disqus_shortname'),
          reviewState: true
        });

      });

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

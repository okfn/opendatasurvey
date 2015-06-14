'use strict';

var _ = require('underscore');
var config = require('../lib/config');
var routeUtils = require('../routes/utils');
var env = require('../lib/templateenv');
var util = require('../lib/util');
var model = require('../lib/model').OpenDataCensus;

var submit = function (req, res) {
  if (routeUtils.requireLoggedIn(req, res))
    return;

  var ynquestions = model.data.questions.slice(0, 9);
  var prefill = req.query;
  var year = prefill.year || config.get('submit_year');
  var submissionData = req.body,
    errors,
    reboundFormData,
    response_status = 200;

  function render(prefill_, status) {
    res.statusCode = status;
    res.render('submission/create.html', {
      canReview: true, // flag always on for submission
      submitInstructions: config.get('submit_page', req.locale),
      places: util.translateRows(model.data.places, req.locale),
      ynquestions: util.translateQuestions(ynquestions, req.locale),
      questions: util.translateQuestions(model.data.questions, req.locale),
      questionsById: util.translateObject(model.data.questionsById, req.locale),
      datasets: util.markupRows(util.translateRows(model.data.datasets, req.locale)),
      year: year,
      prefill: prefill_,
      currrecord: prefill_,
      errors: errors,
      formData: reboundFormData
    });
  }

  function insertSubmissionCallback(err, data) {
    var msg,
      msg_tmpl,
      redirect_path,
      submission_path;
    // TODO: Do flash messages properly
    if (err) {
      console.log(err);
      msg = 'There was an error! ' + err;
      req.flash('error', msg);
    } else {
      msg_tmpl = 'Thanks for your submission.REVIEWED You can check back here any time to see the current status.';
      if (!data.reviewed) {
        msg = msg_tmpl.replace('REVIEWED', ' It will now be reviewed by the editors.');
        submission_path = '/submission/' + data.submissionid;
        redirect_path = submission_path;
      } else {
        msg = msg_tmpl.replace('REVIEWED', '');
        submission_path = '/submission/' + data.submissionid;
        redirect_path = '/place/' + data.place;
      }
      req.flash('info', msg);
    }
    res.redirect(redirect_path + '?post_submission=' + submission_path);
  }

  // validate the POST data and put the results on `errors`
  if (req.method === 'POST') {
    errors = routeUtils.validateSubmitForm(req);
    if (errors) {
      reboundFormData = submissionData;
      response_status = 400;
    }
  }

  if (req.method === 'POST' && !errors) {
    model.backend.insertSubmission(submissionData, req.user,
      insertSubmissionCallback);

  } else if (prefill.dataset && prefill.place) {
    model.backend.getEntry({
      place: prefill.place,
      dataset: prefill.dataset,
      year: year
    }, function (err, entry) {
      // we allow query args to override entry values
      // might be useful (e.g. if we started having form errors and
      // redirecting here ...)
      if (entry) { // we might have a got a 404 etc
        prefill = _.extend(entry, prefill);
      }
      render(prefill, response_status);
    });

  } else {
    render(prefill, response_status);
  }

};

// Compare & update page
var submission = function (req, res) {
  var ynquestions = model.data.questions.slice(0, 9),
    reviewClosed;

  model.backend.getSubmission({submissionid: req.params.submissionid}, function (err, obj) {
    if (err) {
      res.send(500, 'There was an error ' + err);
    } else if (!obj) {
      res.send(404, 'There is no submission with id ' + req.params.submissionid);
    } else {

      if (obj.reviewresult) {
        // If the object has been reviewed, we close further reviews.
        reviewClosed = true;
      }

      // see if there is an entry
      model.backend.getEntry(obj, function (err, entry) {
        if (!entry) {
          entry = {};
        }
        var dataset = _.findWhere(model.data.datasets, {
          id: obj.dataset
        });
        var place = model.data.placesById[obj.place];

        res.render('submission/review.html', {
          canReview: routeUtils.canReview(req.user, place),
          reviewClosed: reviewClosed,
          reviewInstructions: config.get('review_page', req.locale),
          ynquestions: util.translateQuestions(ynquestions, req.locale),
          questions: util.translateQuestions(model.data.questions, req.locale),
          questionsById: util.translateObject(model.data.questionsById, req.locale),
          prefill: obj,
          currrecord: entry,
          dataset: util.markup(util.translate(dataset, req.locale)),
          place: util.translate(place, req.locale),
          disqus_shortname: config.get('disqus_shortname'),
          reviewState: true
        });
      });
    }
  });
};

var reviewPost = function (req, res) {
  if (routeUtils.requireLoggedIn(req, res))
    return;
  // Get the submission's place, so we can find the local reviewers
  model.backend.getSubmission({submissionid: req.params.submissionid}, function (err, obj) {
    if (!routeUtils.canReview(req.user, model.data.placesById[obj.place])) {
      res.send(401, 'Sorry, you are not an authorized reviewer');
      return;
    }
  });

  var acceptSubmission = req.body['submit'] === 'Publish';
  model.backend.processSubmission(req.user, acceptSubmission, req.params.submissionid, req.body, function (err) {
    if (err) {
      if (err.code) {
        res.send(err.code, err.message);
      } else {
        res.send(500, err);
      }
    } else {
      if (acceptSubmission) {
        var msg = "Submission processed and entered into the census.";
        req.flash('info', msg);
      } else {
        var msg = "Submission marked as rejected.";
        req.flash('info', msg);
      }
      // TODO: find a better way to update cached data
      // model.load(function() {
      res.redirect('/');
      // });
    }
  });
};

module.exports = {
  submit: submit,
  submission: submission,
  reviewPost: reviewPost
}

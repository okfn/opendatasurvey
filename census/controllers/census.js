'use strict';

var _ = require('underscore');
var routeUtils = require('../routes/utils');

var submit = function (req, res) {

  var places, questions, datasets;
  var prefill = req.query;
  var siteQuery = {where: {site: req.params.domain}};
  var year = req.app.get('year');
  var submissionData = req.body,
    errors,
    reboundFormData,
    response_status = 200;

  function render(prefill_, status) {

    res.statusCode = status;

    models.utils.loadModels({
      datasets: models.Dataset.findAll(siteQuery),
      places: models.Place.findAll(siteQuery),
      questions: models.Question.findAll(siteQuery)
    }).then(function(D) {

      res.render('submission/create.html', {
        canReview: true, // flag always on for submission
        submitInstructions: req.app.get('config').get('submit_page', req.locale),
        places: D.places, // TODO: translated
        ynquestions: D.questions,  // TODO: we want yn questions: model.data.questions.slice(0, 9);
        questions: D.questions,  // TODO: translated
        questionsById: D.questions,  // TODO: translated
        datasets: D.datasets,
        year: year,
        prefill: prefill_,
        currrecord: prefill_,
        errors: errors,
        formData: reboundFormData
      });

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
    models.Entry.findOne({
      place: prefill.place,
      dataset: prefill.dataset,
      year: year
    }).then(function(E) {
      // we allow query args to override entry values
      // might be useful (e.g. if we started having form errors and
      // redirecting here ...)
      if (E) { // we might have a got a 404 etc
        prefill = _.extend(E, prefill);
      }

      render(prefill, response_status);
    });

  } else {
    render(prefill, response_status);
  }

};

// Compare & update page
var submission = function (req, res) {
  models.Entry.findOne({id: req.params.submissionid, is_current: false}).then(function(E) {

    if (!E)
      return res.status(404).send('There is no submission with id ' + req.params.submissionid);

    models.utils.loadModels({
      dataset: models.Dataset.findByID(E.dataset),
      place: models.Dataset.findByID(E.place),
      questions: models.Question.findAll(),
      ynquestions: models.Question.findAll()
    }).then(function(D) {
      res.render('submission/review.html', {
        canReview: routeUtils.canReview(req.user, D.place),
        reviewClosed: Boolean(E.reviewResult),
        reviewInstructions: req.app.get('config').get('review_page', req.locale),
        ynquestions: util.translateQuestions(D.ynquestions, req.locale),
        questions: util.translateQuestions(D.questions, req.locale),
        prefill: obj,
        currrecord: E,
        dataset: util.markup(util.translate(D.dataset, req.locale)),
        place: util.translate(D.place, req.locale),
        disqus_shortname: req.app.get('config').get('disqus_shortname'),
        reviewState: true
      });
    });

  })
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
}

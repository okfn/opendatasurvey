'use strict';

const _ = require('lodash');
const marked = require('marked');
const config = require('../config');
const uuid = require('node-uuid');
const utils = require('./utils');
const modelUtils = require('../models').utils;
const Promise = require('bluebird');
const React = require('react'); // eslint-disable-line no-unused-vars
const renderToString = require('react-dom/server').renderToString;
const QuestionForm = require('../ui_app/QuestionForm');

var submitGetHandler = function(req, res, data) {
  var addDetails = _.find(data.questions, function(q) {
    return q.id === 'details';
  });
  var current = data.currentState.match;

  var settingName = 'submit_page';
  var submitInstructions = req.params.site.settings[settingName];
  res.render('create.html', {
    canReview: true, // flag always on for submission
    submitInstructions: submitInstructions ? marked(submitInstructions) : '',
    places: modelUtils.translateSet(req, data.places),
    current: current,
    datasets: modelUtils.translateSet(req, data.datasets),
    questions: data.questions,
    addDetails: addDetails,
    year: req.app.get('year')
  });
};

var submitPostHandler = function(req, res, data) {
  var objToSave = {};
  var answers;
  var saveStrategy;
  // var anonymous = true;
  var submitterId = utils.ANONYMOUS_USER_ID;
  var query;
  var approveFirstSubmission;
  var current = data.currentState.match;
  var pending = data.currentState.pending;

  var settingName = 'approve_first_submission';
  if (req.params.site.settings[settingName]) {
    approveFirstSubmission = req.params.site.settings[settingName];
  }

  utils.validateData(req).then(function(errors) {
    if (pending) {
      if (!Array.isArray(errors)) {
        errors = [];
      }
      errors.push({
        param: 'conflict',
        msg: 'There is already a queued submission for this data. ' +
          '<a href="/place/PL/YR">See the queued submission</a>'
          .replace('PL', current.place).replace('YR', current.year)
      });
    }

    if (errors) {
      var addDetails = _.find(data.questions, function(q) {
        return q.id === 'details';
      });

      res.statusCode = 400;
      var settingName = 'submit_page';
      res.render('create.html', {
        canReview: true, // flag always on for submission
        submitInstructions: req.params.site.settings[settingName],
        places: modelUtils.translateSet(req, data.places),
        datasets: modelUtils.translateSet(req, data.datasets),
        questions: data.questions,
        addDetails: addDetails,
        year: req.app.get('year'),
        current: current,
        errors: errors,
        formData: req.body
      });
    } else {
      if (req.body.anonymous && req.body.anonymous === 'false') {
        // anonymous = false;
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
        console.log('we have existing submission and no current entry. we ' +
          'usually should not get here because of earlier condition that ' +
          'lodges a conflict error on the form');

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

      query.then(function(result) {
        var msg;
        var msgTmpl;
        var redirectPath;
        var submissionPath;

        if (!result) {
          msg = 'There was an error!';
          req.flash('error', msg);
        } else {
          msgTmpl = 'Thanks for your submission.REVIEWED You can check ' +
            'back here any time to see the current status.';

          if (!result.isCurrent) {
            msg = msgTmpl.replace('REVIEWED',
              ' It will now be reviewed by the editors.');
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
      }).catch(console.trace.bind(console));
    }
  });
};

var pendingEntry = function(req, res) {
  var dataOptions;
  var entryQueryParams = {
    where: {id: req.params.id},
    include: [
      {model: req.app.get('models').User, as: 'Submitter'},
      {model: req.app.get('models').User, as: 'Reviewer'}
    ]
  };

  req.app.get('models').Entry.findOne(entryQueryParams)
    .then(function(result) {
      if (!result) {
        res.status(404).send('There is no submission with id ' + req.params.id);
        return;
      }
      dataOptions = _.merge(modelUtils.getDataOptions(req), {
        place: result.place,
        dataset: result.dataset,
        ynQuestions: false,
        with: {
          Entry: false
        }
      });
      var settingName = 'disqus_shortname';
      modelUtils.getData(dataOptions)
        .then(function(data) {
          data.current = result;
          data.reviewers = utils.getReviewers(req, data);
          data.canReview = utils.canReview(data.reviewers, req.user);
          data[settingName] = config.get('disqus_shortname');
          data.reviewClosed = result.reviewResult ||
            (result.year !== req.app.get('year'));
          data.reviewInstructions = config.get('review_page');
          data.questions = utils.getFormQuestions(req, data.questions);
          res.render('review.html', data);
        }).catch(console.trace.bind(console));
    });
};

var submit = function(req, res) {
  var dataOptions = _.merge(modelUtils.getDataOptions(req), {
    ynQuestions: false
  });
  modelUtils.getData(dataOptions)
    .then(function(data) {
      data.questions = utils.getFormQuestions(req, data.questions);
      data.currentState = utils.getCurrentState(data, req);
      if (req.method === 'POST') {
        submitPostHandler(req, res, data);
      } else {
        submitGetHandler(req, res, data);
      }
    }).catch(console.trace.bind(console));
};

var submitReact = function(req, res) {
  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    ynQuestions: false
  });
  modelUtils.getData(dataOptions)
  .then(data => {
    data.currentState = utils.getCurrentState(data, req);

    let currentDataset = _.find(data.datasets,
                                {id: data.currentState.match.dataset});

    let places = modelUtils.translateSet(req, data.places);
    let datasets = modelUtils.translateSet(req, data.datasets);
    let qsSchemaPromise;
    let questionsPromise;
    if (currentDataset) {
      qsSchemaPromise = currentDataset.getQuestionSetSchema();
      questionsPromise = currentDataset.getQuestions();
    }
    Promise.join(qsSchemaPromise, questionsPromise, (qsSchema, questions) => {
      if (qsSchema === undefined) qsSchema = [];
      questions = _.map(questions, question => {
        return {
          id: question.id,
          text: question.question,
          type: question.type,
          description: question.description,
          placeholder: question.placeholder,
          config: question.config
        };
      });
      let initialHTML = renderToString(
        <QuestionForm questions={questions}
                      qsSchema={qsSchema}
                      labelPrefix={'B'} />
      );
      res.render('create-react.html', {
        places: places,
        datasets: datasets,
        qsSchema: JSON.stringify(qsSchema),
        questions: JSON.stringify(questions),
        current: data.currentState.match,
        initialRenderedQuestions: initialHTML,
        breadcrumbTitle: 'Make a Submission'
      });
    });
  }).catch(console.trace.bind(console));
};

var reviewPost = function(req, res) {
  var acceptSubmission = !_.isUndefined(req.body.publish);
  var answers;

  req.app.get('models').Entry.findById(req.params.id).then(function(result) {
    if (!result) {
      res.send(400, 'There is no matching entry.');
      return;
    }

    var dataOptions = _.merge(modelUtils.getDataOptions(req), {
      place: result.place,
      dataset: result.dataset,
      cascade: true,
      with: {
        Question: false
      }
    });
    modelUtils.getData(dataOptions)
      .then(function(data) {
        data.reviewers = utils.getReviewers(req, data);
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
          if (ex && ex.year === result.year) {
            if (acceptSubmission) {
              ex.isCurrent = false;
            }

            ex.save().then(function() {
              var msg;
              if (acceptSubmission) {
                msg = 'Submission processed and entered into the census.';
                req.flash('info', msg);
              } else {
                msg = 'Submission marked as rejected.';
                req.flash('info', msg);
              }
              res.redirect('/');
            }).catch(console.trace.bind(console));
          } else {
            var msg;
            if (acceptSubmission) {
              msg = 'Submission processed and entered into the census.';
              req.flash('info', msg);
            } else {
              msg = 'Submission marked as rejected.';
              req.flash('info', msg);
            }
            res.redirect('/');
          }
        }).catch(console.trace.bind(console));
      }).catch(console.trace.bind(console));
  }).catch(console.trace.bind(console));
};

module.exports = {
  submit: submit,
  pendingEntry: pendingEntry,
  reviewPost: reviewPost,
  submitReact: submitReact
};

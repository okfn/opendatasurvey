'use strict';

const _ = require('lodash');
const marked = require('marked');
const config = require('../config');
const uuid = require('node-uuid');
const utils = require('./utils');
const util = require('util');
const modelUtils = require('../models').utils;
const Promise = require('bluebird');
const nunjucks = require('nunjucks');
const React = require('react'); // eslint-disable-line no-unused-vars
const renderToString = require('react-dom/server').renderToString;
const EntryForm = require('../ui_app/EntryForm');

var submitGetHandler = function(req, res, data) { // eslint-disable-line no-unused-vars
  /*
  This controller is now orphaned, not called from anywhere and will soon be
  removed.
  */

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

var submitPostHandler = function(req, res, data) { // eslint-disable-line no-unused-vars
  /*
  This controller is now orphaned, not called from anywhere and will soon be
  removed.
  */

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

var submitReactGet = function(req, res, data) {
  let dataset = _.find(data.datasets,
                              {id: data.currentState.match.dataset});

  let places = modelUtils.translateSet(req, data.places);
  let datasets = modelUtils.translateSet(req, data.datasets);
  let qsSchemaPromise;
  let questionsPromise;
  let datasetContext = {};
  if (dataset) {
    qsSchemaPromise = dataset.getQuestionSetSchema();
    questionsPromise = dataset.getQuestions();
    datasetContext = _.assign(datasetContext, {
      characteristics: dataset.characteristics,
      datasetName: dataset.name,
      updateEvery: dataset.updateevery
    });
  }
  Promise.join(qsSchemaPromise, questionsPromise, (qsSchema, questions) => {
    if (qsSchema === undefined) qsSchema = [];
    questions = _.map(questions, question => {
      return {
        id: question.id,
        text: nunjucks.renderString(question.question,
                                    {datasetContext: datasetContext}),
        type: question.type,
        description: nunjucks.renderString(question.description,
                                           {datasetContext: datasetContext}),
        placeholder: question.placeholder,
        config: question.config
      };
    });
    // We might have form data to prefill the EntryForm with.
    let formData = _.get(data, 'formData', {
      place: data.currentState.match.place,
      dataset: data.currentState.match.dataset
    });
    let initialHTML = renderToString(<EntryForm questions={questions}
                                                qsSchema={qsSchema}
                                                context={datasetContext}
                                                answers={formData}
                                                place={formData.place}
                                                dataset={formData.dataset}
                                                isReview={false} />);

    let submitInstructions = _.get(req.params.site.settings, 'submit_page', '');
    res.render('create.html', {
      places: places,
      datasets: datasets,
      qsSchema: JSON.stringify(qsSchema),
      questions: JSON.stringify(questions),
      datasetContext: datasetContext,
      formData: formData,
      initialRenderedEntry: initialHTML,
      breadcrumbTitle: 'Make a Submission',
      submitInstructions: marked(submitInstructions),
      errors: _.get(data, 'errors'),
      isReview: false
    });
  });
};

var submitReactPost = function(req, res, data) {
  let approveFirstSubmission =
    _.get(req.params.site.settings, 'approve_first_submission', false);

  let current = data.currentState.match;
  let pending = data.currentState.pending;
  let errors = [];

  // validation would go here, encapsulating the bulk of the controller code

  if (pending) {
    if (!Array.isArray(errors)) errors = [];
    let msg = util.format('There is already a queued submission for this data. ' +
                          '<a href="/place/%s/%s">See the queued submission</a>',
                          current.place, req.params.year);
    errors.push({
      param: 'conflict',
      msg: msg
    });
  }

  // errors.push({param: 'fake', msg: 'My fake error'});

  if (errors.length) {
    res.statusCode = 400;
    data.formData = req.body;
    data.formData.answers = JSON.parse(data.formData.answers);
    data.errors = errors;
    // Call the GET submit page with formData.
    submitReactGet(req, res, data);
  } else {
    let saveStrategy;
    let objToSave = {};
    let submitterId = utils.ANONYMOUS_USER_ID;

    let defaultObjectToSave = {
      id: uuid.v4(),
      site: req.params.site.id,
      place: req.body.place,
      dataset: req.body.dataset,
      details: req.body.details,
      year: req.app.get('year'),
      submitterId: submitterId
    };

    if (!current || current.year !== req.app.get('year')) {
      console.log('We are definitely creating a new entry');

      objToSave = defaultObjectToSave;

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
      console.log('We have existing current entry, so create a new submission');

      objToSave = defaultObjectToSave;
      objToSave.isCurrent = false;

      saveStrategy = 'create';
    } else {
      console.log('We have existing submission and no current entry. We ' +
        'usually should not get here because of earlier condition that ' +
        'lodges a conflict error on the form');

      objToSave = current;

      saveStrategy = 'update';
    }

    objToSave.answers = JSON.parse(req.body.answers);
    // objToSave.answers = utils.normalizedAnswers(answers);

    let query;
    if (saveStrategy === 'create') {
      query = req.app.get('models').Entry.create(objToSave);
    } else if (saveStrategy === 'update') {
      query = objToSave.save();
    }

    query.then(function(result) {
      let msg;
      let redirectPath;
      let submissionPath;

      if (result) {
        let msgTmpl = 'Thanks for your submission.%s You can check ' +
          'back here any time to see the current status.';
        submissionPath = '/submission/' + result.id;
        if (result.isCurrent) {
          msg = util.format(msgTmpl, '');
          redirectPath = '/place/' + result.place;
        } else {
          msg = util.format(msgTmpl, ' It will now be reviewed by the editors.');
          redirectPath = submissionPath;
        }
        req.flash('info', msg);
      } else {
        msg = 'There was an error!';
        req.flash('error', msg);
      }

      res.redirect(redirectPath + '?post_submission=' + submissionPath);
    }).catch(console.trace.bind(console));
  }
};

var submit = function(req, res) {
  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    scoredQuestionsOnly: false
  });
  modelUtils.getData(dataOptions)
  .then(data => {
    data.currentState = utils.getCurrentState(data, req);
    if (req.method === 'POST') {
      submitReactPost(req, res, data);
    } else {
      submitReactGet(req, res, data);
    }
  });
};

var pending = function(req, res) {
  let entryQueryParams = {
    where: {id: req.params.id},
    include: [
      {model: req.app.get('models').User, as: 'Submitter'},
      {model: req.app.get('models').User, as: 'Reviewer'}
    ]
  };

  req.app.get('models').Entry.findOne(entryQueryParams)
  .then(function(entry) {
    if (!entry) {
      res.status(404).send('There is no submission with id ' + req.params.id);
      return;
    }
    let dataOptions = _.merge(modelUtils.getDataOptions(req), {
      scoredQuestionsOnly: false
    });
    modelUtils.getData(dataOptions)
    .then(function(data) {
      let dataset = _.find(data.datasets, {id: entry.dataset});
      let place = _.find(data.places, {id: entry.place});
      let places = modelUtils.translateSet(req, data.places);
      let datasets = modelUtils.translateSet(req, data.datasets);
      let qsSchemaPromise;
      let questionsPromise;
      let datasetContext = {};
      if (dataset) {
        qsSchemaPromise = dataset.getQuestionSetSchema();
        questionsPromise = dataset.getQuestions();
        datasetContext = _.assign(datasetContext, {
          characteristics: dataset.characteristics,
          datasetName: dataset.name,
          updateEvery: dataset.updateevery
        });
      }

      Promise.join(qsSchemaPromise, questionsPromise, (qsSchema, questions) => {
        if (qsSchema === undefined) qsSchema = [];
        questions = _.map(questions, question => {
          return {
            id: question.id,
            text: nunjucks.renderString(question.question,
                                        {datasetContext: datasetContext}),
            type: question.type,
            description: nunjucks.renderString(question.description,
                                               {datasetContext: datasetContext}),
            placeholder: question.placeholder,
            config: question.config
          };
        });
        // We might have form data to prefill the EntryForm with.
        let formData = {
          place: entry.place,
          dataset: entry.dataset,
          answers: entry.answers,
          details: entry.details,
          anonymous: (entry.submitterId === null) ? 'Yes' : 'No',
          reviewComments: entry.reviewComments
          // yourKnowledge* fields here too
        };

        let initialHTML = renderToString(<EntryForm questions={questions}
                                                    qsSchema={qsSchema}
                                                    context={datasetContext}
                                                    answers={formData}
                                                    place={entry.place}
                                                    dataset={entry.dataset}
                                                    isReview={true} />);
        let reviewersData = {place: place, dataset: dataset};
        let reviewers = utils.getReviewers(req, reviewersData);
        res.render('create.html', {
          places: places,
          datasets: datasets,
          qsSchema: JSON.stringify(qsSchema),
          questions: JSON.stringify(questions),
          datasetContext: datasetContext,
          formData: formData,
          initialRenderedEntry: initialHTML,
          breadcrumbTitle: 'Review a Submission',
          submitInstructions: config.get('review_page'),
          errors: _.get(data, 'errors'),
          isReview: true,
          canReview: utils.canReview(reviewers, req.user),
          reviewClosed: entry.reviewResult ||
            (entry.year !== req.app.get('year'))
        });
      });
    })
    .catch(err => console.log(err.stack));
  })
  .catch(err => console.log(err.stack));
};

var pendingEntry = function(req, res) { // eslint-disable-line no-unused-vars
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
      scoredQuestionsOnly: false,
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
    }).catch(err => console.log(err.stack));
  });
};

var reviewPost = function(req, res) {
  var acceptSubmission = !_.isUndefined(req.body.publish);
  var answers;

  req.app.get('models').Entry.findById(req.params.id)
  .then(function(result) {
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

var review = function(req, res) {
  if (req.method === 'POST') {
    reviewPost(req, res);
  } else {
    pending(req, res);
  }
};

module.exports = {
  submit: submit,
  review: review
};

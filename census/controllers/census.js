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

var submitGet = function(req, res, data) {
  let dataset = _.find(data.datasets,
                       {id: data.currentState.match.dataset});
  if (!dataset)
    dataset = data.datasets[0];

  let place = _.find(data.places,
                     {id: data.currentState.match.place});
  if (!place)
    place = data.places[0];
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
      datasetDescription: dataset.description,
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
      place: _.get(place, 'id'),
      dataset: _.get(dataset, 'id')
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
      placeName: _.get(place, 'name'),
      datasetName: _.get(dataset, 'name'),
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

var submitPost = function(req, res, data) {
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

  if (errors.length) {
    res.statusCode = 400;
    data.formData = req.body;
    data.formData.answers = JSON.parse(data.formData.answers);
    data.errors = errors;
    // Call the GET submit page with formData.
    submitGet(req, res, data);
  } else {
    let saveStrategy;
    let objToSave = {};
    let submitterId = utils.ANONYMOUS_USER_ID;

    if (req.body.anonymous && req.body.anonymous === 'No') {
      submitterId = req.user.id;
    }

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

    query.then(result => {
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
    }).catch(err => console.log(err.stack));
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
      submitPost(req, res, data);
    } else {
      submitGet(req, res, data);
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
  .then(entry => {
    if (!entry) {
      res.status(404).send('There is no submission with id ' + req.params.id);
      return;
    }
    let dataOptions = _.merge(modelUtils.getDataOptions(req), {
      scoredQuestionsOnly: false
    });
    return modelUtils.getData(dataOptions)
    .then(data => [data, entry]);
  })
  .spread(function(data, entry) {
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
        datasetDescription: dataset.description,
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
      // Prefill the EntryForm with entry data.
      let formData = {
        place: entry.place,
        dataset: entry.dataset,
        answers: entry.answers,
        details: entry.details,
        anonymous: (entry.submitterId === utils.ANONYMOUS_USER_ID) ?
          'Yes' : 'No',
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
      let entryStatus = 'pending';
      if (entry.isCurrent) {
        entryStatus = 'accepted';
      } else if (entry.reviewed && !entry.reviewResult) {
        entryStatus = 'rejected';
      }
      res.render('create.html', {
        places: places,
        datasets: datasets,
        placeName: _.get(place, 'name'),
        datasetName: _.get(dataset, 'name'),
        qsSchema: JSON.stringify(qsSchema),
        questions: JSON.stringify(questions),
        datasetContext: datasetContext,
        formData: formData,
        initialRenderedEntry: initialHTML,
        breadcrumbTitle: 'Review a Submission',
        submitInstructions: config.get('review_page'),
        errors: _.get(data, 'errors'),
        isReview: true,
        entryStatus: entryStatus,
        entry: entry,
        canReview: utils.canReview(reviewers, req.user),
        reviewClosed: entry.reviewResult ||
          (entry.year !== req.app.get('year'))
      });
    });
  }).catch(err => console.log(err.stack));
};

var reviewPost = function(req, res) {
  // Get the entry from the DB
  req.app.get('models').Entry.findById(req.params.id)
  .then(entry => {
    if (!entry) {
      res.status(404).send('There is no entry with id ' + req.params.id);
      return;
    }

    // Get current data for this place/dataset
    let dataOptions = _.merge(modelUtils.getDataOptions(req), {
      place: entry.place,
      dataset: entry.dataset,
      cascade: true,
      with: {
        Question: false
      }
    });
    return modelUtils.getData(dataOptions)
    .then(data => [entry, data]);
  })
  .spread((entry, data) => {
    // Save the proposed entry
    let acceptSubmission = (req.body.reviewAction === 'publish');

    data.reviewers = utils.getReviewers(req, data);
    if (!utils.canReview(data.reviewers, req.user)) {
      res.status(403).send('You are not allowed to review this entry.');
      return;
    }
    entry.reviewerId = req.user.id;
    entry.reviewed = true;
    entry.reviewComments = req.body.reviewComments;
    entry.details = req.body.details;
    entry.answers = JSON.parse(req.body.answers);

    entry.isCurrent = acceptSubmission;
    entry.reviewResult = acceptSubmission;

    return entry.save()
    .then(() => [entry, data, acceptSubmission]);
  })
  .spread((entry, data, acceptSubmission) => {
    // Update the previous existing entry, if necessary.
    let existingEntry = _.first(data.entries);
    if (acceptSubmission &&
        existingEntry &&
        existingEntry.year === entry.year &&
        entry.id !== existingEntry.id) {
      existingEntry.isCurrent = false;

      return existingEntry.save()
      .then(acceptSubmission => acceptSubmission);
    }
    return acceptSubmission;
  })
  .then(acceptSubmission => {
    // Set the flash message and redirect to homepage.
    if (acceptSubmission) {
      let msg = 'Submission processed and entered into the census.';
      req.flash('info', msg);
    } else {
      let msg = 'Submission marked as rejected.';
      req.flash('info', msg);
    }
    res.redirect('/');
  }).catch(err => console.log(err.stack));
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

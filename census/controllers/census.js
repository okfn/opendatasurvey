'use strict';

const _ = require('lodash');
const marked = require('marked');
const config = require('../config');
const uuid = require('node-uuid');
const url = require('url');
const querystring = require('querystring');
const utils = require('./utils');
const util = require('util');
const modelUtils = require('../models').utils;
const Promise = require('bluebird');
const nunjucks = require('nunjucks');
const React = require('react'); // eslint-disable-line no-unused-vars
const renderToString = require('react-dom/server').renderToString;
const EntryForm = require('../ui_app/EntryForm');

let submitGet = function(req, res, data) {
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
    let currentAnswers = _.get(data.currentState.match, 'answers');
    questions = _.map(questions, question => {
      return {
        id: question.id,
        text: nunjucks.renderString(question.question,
                                    {datasetContext: datasetContext}),
        type: question.type,
        description: nunjucks.renderString(question.description,
                                           {datasetContext: datasetContext}),
        placeholder: question.placeholder,
        config: question.config,
        currentValue: _.get(_.find(currentAnswers, {id: question.id}), 'value', '')
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
      breadcrumbTitle: req.gettext('Make a Submission'),
      submitInstructions: marked(submitInstructions),
      errors: _.get(data, 'errors'),
      isReview: false
    });
  });
};

let submitPost = function(req, res, data) {
  let approveFirstSubmission =
    _.get(req.params.site.settings, 'approve_first_submission', false);

  let current = data.currentState.match;
  let pending = data.currentState.pending;
  let errors = [];

  // validation would go here, encapsulating the bulk of the controller code

  if (pending) {
    if (!Array.isArray(errors)) errors = [];
    let msg = req.format(req.gettext('There is already a queued submission for this data. ' +
                                     '<a href="/place/%s/%s">See the queued submission</a>.'),
                          [current.place, req.params.year]);
    errors.push({
      param: 'conflict',
      msg: msg
    });
  }

  if (errors.length) {
    res.statusCode = 400;
    data.formData = req.body;
    data.formData.answers = JSON.parse(data.formData.answers);
    data.formData.aboutYouAnswers = JSON.parse(data.formData.aboutYouAnswers);
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
      year: res.locals.surveyYear,
      submitterId: submitterId
    };

    if (!current || current.year !== res.locals.surveyYear) {
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
    objToSave.aboutYouAnswers = JSON.parse(req.body.aboutYouAnswers);

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
        let msgTmpl = req.gettext('Thanks for your submission.%s You can check ' +
                  'back here any time to see the current status.');
        submissionPath = '/submission/' + result.id;
        if (result.isCurrent) {
          msg = util.format(msgTmpl, '');
          redirectPath = '/place/' + result.place;
        } else {
          msg = util.format(msgTmpl, req.gettext(' It will now be reviewed by the editors.'));
          redirectPath = submissionPath;
        }
        req.flash('info', msg);
      } else {
        msg = req.gettext('There was an error!');
        req.flash('error', msg);
      }

      res.redirect(redirectPath + '?post_submission=' + submissionPath);
    }).catch(err => console.log(err.stack));
  }
};

let submit = function(req, res) {
  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    scoredQuestionsOnly: false
  });
  modelUtils.getData(dataOptions)
  .then(data => {
    let match = _.merge(req.query, req.body);
    data.currentState = utils.getCurrentState(data, match, req.params.year);
    if (req.method === 'POST') {
      submitPost(req, res, data);
    } else {
      submitGet(req, res, data);
    }
  });
};

let _getDiscussionURL = function(req, dataset, place) {
  /*
    If `submission_discussion_url` is defined in settings and it is in the
    format: https://discuss.okfn.org/c/<topic>/<subtopic>, return a new topic
    url with a prepopulated topic for place and dataset. Otherwise, return the
    original `submission_discussion_url` without modification. If
    `submission_discussion_url` is undefined return an empty string.
  */
  let submissionDiscussionURL =
    _.get(req.params.site.settings, 'submission_discussion_url', '');
  let parsedURL = url.parse(submissionDiscussionURL);
  // URL is a discourse link
  if (parsedURL.hostname === config.get('submission_discourse_hostname', '')) {
    let splitPathName = _.trimLeft(parsedURL.pathname, '/').split('/');
    // URL is a category link
    if (splitPathName[0] === 'c') {
      // Create a new topic link
      let newTopicURL = url.parse('');
      newTopicURL.protocol = parsedURL.protocol;
      newTopicURL.host = parsedURL.host;
      newTopicURL.pathname = 'new-topic';
      newTopicURL.search = querystring.stringify({
        title: util.format(req.gettext('Entry for %s / %s'), dataset, place),
        body: util.format(req.gettext('This is a discussion about the submission for [%s / %s](%s).'),
                          dataset, place, req.res.locals.current_url),
        category: _.rest(splitPathName).join('/').replace(/-/g, ' ')
      });
      submissionDiscussionURL = url.format(newTopicURL);
    }
  }
  return submissionDiscussionURL;
};

let pending = function(req, res) {
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
      res.status(404).send(util.format(req.gettext('There is no submission with id %s'),
                           req.params.id));
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
    let submissionDiscussionURL = _getDiscussionURL(req, dataset.name, place.name);
    Promise.join(qsSchemaPromise, questionsPromise, (qsSchema, questions) => {
      if (qsSchema === undefined) qsSchema = [];
      let match = {place: place.id, dataset: dataset.id};
      data.currentState = utils.getCurrentState(data, match, req.params.year);
      let currentAnswers = _.get(data.currentState.match, 'answers');
      questions = _.map(questions, question => {
        return {
          id: question.id,
          text: nunjucks.renderString(question.question,
                                      {datasetContext: datasetContext}),
          type: question.type,
          description: nunjucks.renderString(question.description,
                                             {datasetContext: datasetContext}),
          placeholder: question.placeholder,
          config: question.config,
          currentValue: _.get(_.find(currentAnswers, {id: question.id}),
                              'value', '')
        };
      });
      // Prefill the EntryForm with entry data.
      let formData = {
        place: entry.place,
        dataset: entry.dataset,
        answers: entry.answers,
        aboutYouAnswers: entry.aboutYouAnswers,
        details: entry.details,
        anonymous: (entry.submitterId === utils.ANONYMOUS_USER_ID) ?
          'Yes' : 'No',
        reviewComments: entry.reviewComments
      };

      let reviewersData = {place: place, dataset: dataset};
      let reviewers = utils.getReviewers(req, reviewersData);
      let canReview = utils.canReview(reviewers, req.user);
      let initialHTML = renderToString(<EntryForm questions={questions}
                                                  qsSchema={qsSchema}
                                                  context={datasetContext}
                                                  answers={formData}
                                                  place={entry.place}
                                                  dataset={entry.dataset}
                                                  isReview={true}
                                                  canReview={canReview}
                                                  submissionDiscussionURL={submissionDiscussionURL} />);
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
        breadcrumbTitle: req.gettext('Review a Submission'),
        submitInstructions: config.get('review_page'),
        submissionDiscussionURL: submissionDiscussionURL,
        errors: _.get(data, 'errors'),
        isReview: true,
        entryStatus: entryStatus,
        entry: entry,
        canReview: canReview,
        reviewClosed: entry.reviewResult ||
          (entry.year !== res.locals.surveyYear)
      });
    });
  }).catch(err => console.log(err.stack));
};

let reviewPost = function(req, res) {
  // Get the entry from the DB
  req.app.get('models').Entry.findById(req.params.id)
  .then(entry => {
    if (!entry) {
      res.status(404).send(util.format(req.gettext('There is no entry with id %s'),
                           req.params.id));
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
      res.status(403).send(req.gettext('You are not allowed to review this entry.'));
      return;
    }
    entry.reviewerId = req.user.id;
    entry.reviewed = true;
    entry.reviewComments = req.body.reviewComments;
    entry.details = req.body.details;
    entry.answers = JSON.parse(req.body.answers);
    entry.aboutYouAnswers = JSON.parse(req.body.aboutYouAnswers);

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
      let msg = req.gettext('Submission processed and entered into the census.');
      req.flash('info', msg);
    } else {
      let msg = req.gettext('Submission marked as rejected.');
      req.flash('info', msg);
    }
    res.redirect('/');
  }).catch(err => console.log(err.stack));
};

let review = function(req, res) {
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

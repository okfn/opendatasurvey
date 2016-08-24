'use strict';

var _ = require('lodash');
var modelUtils = require('../models/utils');
var FIELD_SPLITTER = /[\s,]+/;
var ANONYMOUS_USER_ID = process.env.ANONYMOUS_USER_ID ||
  '0e7c393e-71dd-4368-93a9-fcfff59f9fff';
var marked = require('marked');
const Promise = require('bluebird');

var makeChoiceValidator = function(param) {
  return function(req) {
    req.checkBody(param, 'You must make a valid choice').isChoice();
  };
};

var validators = {
  exists: {
    validate: makeChoiceValidator('exists'),
    require: ['digital', 'public', 'uptodate']
  },
  digital: {
    validate: makeChoiceValidator('digital'),
    require: ['online', 'machinereadable', 'bulk'],
    expectFalse: ['online', 'machinereadable', 'bulk']
  },
  public: {
    validate: makeChoiceValidator('public'),
    require: ['free'],
    expectFalse: ['free', 'online', 'openlicense', 'bulk']
  },
  free: {
    validate: makeChoiceValidator('free'),
    require: ['openlicense'],
    expectFalse: ['openlicense']
  },
  online: {
    validate: makeChoiceValidator('online'),
    require: ['url']
  },
  openlicense: {
    validate: makeChoiceValidator('openlicense'),
    require: ['licenseurl']
  },
  machinereadable: {
    validate: makeChoiceValidator('machinereadable'),
    require: ['format']
  },
  bulk: {
    validate: makeChoiceValidator('bulk')
  },
  uptodate: {
    validate: makeChoiceValidator('uptodate')
  },
  format: {
    type: 'string',
    validate: function(req) {
      req.checkBody('format', 'You must specify the data format').notEmpty();
    }
  },
  url: {
    type: 'string',
    validate: function(req) {
      req.checkBody('url', 'You must specify a valid URL').isURL();
    }
  },
  licenseurl: {
    type: 'string',
    validate: function(req) {
      req.checkBody('licenseurl', 'You must specify a valid URL').isURL();
    }
  }
};

var validateQuestion = function(req, question, parentQuestion, validated) {
  /**
   * Validate the question.
   *
   * If the answer is positive ("true") validate the field with all
   * possible values.
   *
   * If it's "false":
   *
   *  * check that all the "expectFalse" question values are "false".
   *
   * Then if the answer is negative ("false" or "null"):
   *
   *  * check all the required fields have the same values as its
   *    parent ("false" or "null") unless the field's type is string,
   *    in that case ensure that the string is empty.
   *
   * Iterate over the required questions recursively.
   */

  parentQuestion = parentQuestion || null;
  validated = validated || [];
  var validator = validators[question];
  var value = req.body[question];
  var parentValue = req.body[parentQuestion] || 'true';

  if (value === undefined) {
    req.checkBody(question, 'You must specify ' + question).equals('any');
  }

  // ensure false values for expectFalse questions
  if (value === 'false' && validator.expectFalse) {
    validator.expectFalse.forEach(function(child) {
      if (validated.indexOf(child) === -1) {
        req.checkBody(child, 'You can specify only \'false\'').equals('false');
        validated.push(child);
      }
    });
  }

  if (validated.indexOf(question) === -1) {
    // not yet validated
    // validate depending on the question value
    if (parentValue === 'null' || parentValue === 'false') {
      // validate falsy values
      if (validator.type === 'string') {
        req.checkBody(question, 'You must not specify this field').equals('');
      } else if (!(
        (parentValue === 'null') && (validators[parentQuestion].expectFalse))
      ) {
        req.checkBody(question, 'You can specify only \'' +
          parentValue + '\'').equals(parentValue);
      }
    } else {
      // parentValue has a truthy value, validate as normal
      validator.validate(req);
    }
    validated.push(question);
  }

  // validate recursively
  if (validator.require) {
    validator.require.forEach(function(child) {
      validateQuestion(req, child, question, validated);
    });
  }
};

var validateData = function(req, mappedErrors) {
  /**
   * Ensure valid data is submitted by checking the POST data on req.body
   * according to the declared validation logic. Used for new data
   * submissions, and revision proposals. Returns a promise.
   */
  var mapped = mappedErrors || false;

  req.checkBody('place', 'You must select a Place').notEmpty();
  req.checkBody('dataset', 'You must select a Dataset').notEmpty();

  validateQuestion(req, 'exists');

  // place and dataset must exist
  return Promise.join(
    req.app.get('models').Place.findAll({attributes: ['id']}),
    req.app.get('models').Dataset.findAll({attributes: ['id']}),
    function(places, datasets) {
      let placeIds = _.map(places, p => p.id);
      req.checkBody('place', 'You must select a valid Place').isIn(placeIds);

      let datasetIds = _.map(datasets, p => p.id);
      req.checkBody('dataset', 'You must select a valid Dataset')
      .isIn(datasetIds);

      return req.validationErrors(mapped);
    }
  );
};

var splitFields = function(data) {
  return _.each(data.trim().split(FIELD_SPLITTER), function(str) {
    str.trim();
  });
};

/*
  Return an array of field values where the keys match the regexp pattern.

  Returns an empty array if no matches.
*/
var commonFieldArray = function(data, pattern) {
  return _.filter(data, (v, k) => {
    return (pattern.test(k) && v !== '');
  });
};

var placeMapper = function(data, site) {
  var reviewers = (data.reviewers) ? splitFields(data.reviewers) : [];
  return _.defaults({
    id: data.id.toLowerCase(),
    reviewers: reviewers
  }, data);
};

var datasetMapper = function(data, site) {
  let characteristics = commonFieldArray(data, /^characteristics:\d+$/i);
  let reviewers = (data.reviewers) ? splitFields(data.reviewers) : [];
  let disableforyears =
    (data.disableforyears) ? splitFields(data.disableforyears) : [];
  let qsurl = (data.questionseturl !== '') ?
    data.questionseturl : site.settings.question_set_url;
  return _.defaults({
    id: data.id.toLowerCase(),
    description: marked(data.description),
    name: data.title,
    order: data.order || 100,
    reviewers: reviewers,
    disableforyears: disableforyears,
    characteristics: characteristics,
    qsurl: qsurl
  }, data);
};

var questionMapper = function(data, site) {
  var dependants = (data.dependants) ? splitFields(data.dependants) : null;
  return _.defaults({
    id: data.id.toLowerCase(),
    description: marked(data.description),
    dependants: dependants,
    score: data.score || 0,
    order: data.order || 100
  }, data);
};

var normalizedAnswers = function(answers) {
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

var ynuAnswers = function(answers) {
  var ynu = {};
  _.each(answers, function(v, k) {
    if (v === null) {
      ynu[k] = 'Unsure';
    } else if (v === false) {
      ynu[k] = 'No';
    } else if (v === true) {
      ynu[k] = 'Yes';
    } else {
      ynu[k] = v;
    }
  });
  return ynu;
};

var getFormQuestions = function(req, questions) {
  questions = modelUtils.translateSet(req, questions);
  _.each(questions, function(q) {
    if (q.dependants) {
      _.each(q.dependants, function(d, i, l) {
        var match = _.find(questions, function(o) {
          return o.id === d;
        });
        l[i] = match;
        questions = _.reject(questions, function(o) {
          return o.id === match.id;
        });
      });
    }
  });
  return _.sortByOrder(questions, 'order', 'asc');
};

var getCurrentState = function(data, req) {
  var match = _.merge(req.query, req.body);
  var pending;
  var matches;

  if (!match.place || !match.dataset) {
    match = {};
  } else {
    matches = _.filter(data.entries, {
      isCurrent: true,
      place: match.place,
      dataset: match.dataset
    });
    pending = _.any(data.pending, {
      isCurrent: false,
      year: req.params.year,
      place: match.place,
      dataset: match.dataset
    });
    if (matches.length) {
      match = _.first(matches);
    }
  }
  return {
    match: match,
    pending: pending
  };
};

var getReviewers = function(req, data) {
  var reviewers = [];
  if (!req.user) {
    return reviewers;
  } else {
    if (req.params.site.settings.reviewers) {
      reviewers = reviewers.concat(req.params.site.settings.reviewers);
    }
    if (data.place.reviewers) {
      reviewers = reviewers.concat(data.place.reviewers);
    }
    if (data.dataset.reviewers) {
      reviewers = reviewers.concat(data.dataset.reviewers);
    }
    return reviewers;
  }
};

var canReview = function(reviewers, user) {
  if (user) {
    return (_.intersection(reviewers, user.emails).length >= 1);
  }
  return false;
};

module.exports = {
  validateData: validateData,
  placeMapper: placeMapper,
  datasetMapper: datasetMapper,
  questionMapper: questionMapper,
  normalizedAnswers: normalizedAnswers,
  ynuAnswers: ynuAnswers,
  getFormQuestions: getFormQuestions,
  getCurrentState: getCurrentState,
  getReviewers: getReviewers,
  canReview: canReview,
  FIELD_SPLITTER: FIELD_SPLITTER,
  ANONYMOUS_USER_ID: ANONYMOUS_USER_ID
};

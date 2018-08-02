'use strict';

const csv = require('csv');
const _ = require('lodash');
const moment = require('moment');
const modelUtils = require('../models').utils;

let outputItemsAsJson = function(response, items, mapper) {
  if (_.isFunction(mapper)) {
    items = _.map(items, mapper);
  }
  response.json({count: items.length, results: items});
};

let outputItemsAsCsv = function(response, items, mapper, columns) {
  let options = {
    delimiter: ',',
    quote: '"',
    quoted: true,
    rowDelimiter: 'unix'
  };
  if (_.isArray(columns)) {
    options.header = true;
    options.columns = columns;
  }
  if (_.isFunction(mapper)) {
    items = _.map(items, mapper);
  }
  let stringify = csv.stringify(items, options);
  response.header('Content-Type', 'text/csv');
  stringify.pipe(response);
};

let questions = function(req, res) {
  // Get request params
  const format = req.params.format;
  // Initial data options
  const dataOptions = _.merge(
    modelUtils.getDataOptions(req),
    {
      scoredQuestionsOnly: false,
      cascade: false,
      with: {Place: false, Entry: false, Dataset: false}
    }
  );

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {
    const columns = [
      'id',
      'site',
      'question',
      'questionshort',
      'description',
      'type',
      'placeholder',
      'score',
      'config',
      'openquestion',
      'icon'
    ];
    const results = data.questions;
    let mapper = function(item) {
      let result = {};
      _.each(columns, function(name) {
        result[name] = item[name];
      });
      return result;
    };

    switch (format) {
      case 'json': {
        outputItemsAsJson(res, results, mapper);
        break;
      }
      case 'csv': {
        outputItemsAsCsv(res, results, mapper, columns);
        break;
      }
      default: {
        res.send(404);
        break;
      }
    }
  }).catch(console.trace.bind(console));
};

let datasets = function(req, res, next) {
  // Get request params
  const report = req.params.report;
  const strategy = req.params.strategy;
  const format = req.params.format;

  // Report can be only `score`
  let isScore = false;
  if (report === 'score') {
    isScore = true;
  } else if (report) {
    return res.sendStatus(404);
  }

  // Initial data options
  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    cascade: false,
    with: {Place: false, Entry: isScore, Question: isScore}
  });

  // Strategy can be only `cascade`
  if (strategy === 'cascade') {
    dataOptions = _.merge(dataOptions, {cascade: true});
  } else if (strategy) {
    return res.sendStatus(404);
  }

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {
    let columns = [
      'id',
      'site',
      'name',
      'description',
      'characteristics',
      'updateevery',
      'category',
      'icon',
      'order'
    ];
    if (isScore) {
      columns = columns.concat([
        'rank',
        'score',
        'relativeScore'
      ]);
    }
    const results = data.datasets;
    let mapper = function(item) {
      let result = {};
      item.score = item.computedScore;
      item.relativeScore = item.computedRelativeScore;
      _.each(columns, function(name) {
        result[name] = item[name];
      });
      return result;
    };

    switch (format) {
      case 'json': {
        outputItemsAsJson(res, results, mapper);
        break;
      }
      case 'csv': {
        outputItemsAsCsv(res, results, mapper, columns);
        break;
      }
      default: {
        res.sendStatus(404);
        break;
      }
    }
  }).catch(console.trace.bind(console));
};

let places = function(req, res, next) {
  // Get request params
  const report = req.params.report;
  const strategy = req.params.strategy;
  const format = req.params.format;

  // Report can be only `score`
  let isScore = false;
  if (report === 'score') {
    isScore = true;
  } else if (report) {
    return res.sendStatus(404);
  }

  // Initial data options
  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    cascade: false,
    with: {Dataset: false, Entry: isScore, Question: isScore}
  });

  // Strategy can be only `cascade`
  if (strategy === 'cascade') {
    dataOptions = _.merge(dataOptions, {cascade: true});
  } else if (strategy) {
    return res.sendStatus(404);
  }

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {
    let columns = [
      'id',
      'site',
      'name',
      'slug',
      'region',
      'continent'
    ];
    if (isScore) {
      columns = columns.concat([
        'rank',
        'score',
        'relativeScore'
      ]);
    }
    const results = data.places;
    let mapper = function(item) {
      let result = {};
      item.score = item.computedScore;
      item.relativeScore = item.computedRelativeScore;
      _.each(columns, function(name) {
        result[name] = item[name];
      });
      return result;
    };

    switch (format) {
      case 'json': {
        outputItemsAsJson(res, results, mapper);
        break;
      }
      case 'csv': {
        outputItemsAsCsv(res, results, mapper, columns);
        break;
      }
      default: {
        res.sendStatus(404);
        break;
      }
    }
  }).catch(console.trace.bind(console));
};

let _outputEntryResults = function(results, questions, format, res) {
  let mapper = function(item) {
    let answers = item.getSimpleAnswersForQuestions(questions);
    return {
      id: item.id,
      site: item.site,
      timestamp: moment(item.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
      year: item.year,
      place: item.place,
      dataset: item.dataset,
      answers: answers,
      reviewed: item.reviewed ? 'Yes' : 'No',
      reviewResult: item.reviewResult ? 'Yes' : 'No',
      reviewComments: item.reviewComments,
      details: item.details,
      isCurrent: item.isCurrent ? 'Yes' : 'No',
      isOpen: item.isOpenForQuestions(questions) ? 'Yes' : 'No',
      submitter: item.Submitter ? item.Submitter.fullName() : '',
      reviewer: item.Reviewer ? item.Reviewer.fullName() : '',
      score: item.computedScore,
      relativeScore: item.computedRelativeScore
    };
  };

  switch (format) {
    case 'json': {
      outputItemsAsJson(res, results, mapper);
      break;
    }
    case 'csv': {
      var columns = [
        'id',
        'site',
        'timestamp',
        'year',
        'place',
        'dataset',
        'answers',
        'reviewed',
        'reviewResult',
        'reviewComments',
        'details',
        'isCurrent',
        'isOpen',
        'submitter',
        'reviewer',
        'score',
        'relativeScore'
      ];
      outputItemsAsCsv(res, results, mapper, columns);
      break;
    }
    default: {
      res.sendStatus(404);
      break;
    }
  }
};

let _outputFlatEntryResults = function(results, questions, format, res) {
  // Count
  let maxFormats = 0;
  let maxCharacts = 0;
  let maxLocations = 0;
  for (const item of results) {
    let answers = item.getSimpleAnswersForQuestions(questions);
    let getAnswerById = id => answers.find(answer => answer.id === id) || {};
    maxFormats = Math.max(maxFormats, (getAnswerById('format').value || []).length);
    maxCharacts = Math.max(maxCharacts, (getAnswerById('characteristics').value || []).length);
    maxLocations = Math.max(maxLocations, (getAnswerById('location').value || []).length);
  }

  // Mapper
  let mapper = function(item) {
    let answers = item.getSimpleAnswersForQuestions(questions);
    let getAnswerById = id => answers.find(answer => answer.id === id) || {};
    let result = {};

    // General
    Object.assign(result, {
      id: item.id,
      site: item.site,
      timestamp: moment(item.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
      year: item.year,
      place: item.place,
      dataset: item.dataset
    });

    // License
    let openLicence = getAnswerById('open_licence');
    let licenceURL = getAnswerById('licence_url');
    Object.assign(result, {
      'Openly licenced?': openLicence.value,
      'Comments licence': openLicence.commentValue,
      'Licence URL': licenceURL.value,
      'Comments Licence URL': licenceURL.commentValue
    });

    // Publicly available
    let onlineFree = getAnswerById('online_free');
    Object.assign(result, {
      'Publicly available online (no access controls)': onlineFree.value,
      'Comments publicly available': onlineFree.commentValue
    });

    // Online otherwise
    let onlineOtherwise = getAnswerById('online_otherwise');
    Object.assign(result, {
      'Online_otherwise?': onlineOtherwise.value,
      'Comments online_otherwise': onlineOtherwise.commentValue
    });

    // Collector gov
    let collectorGov = getAnswerById('collector_gov');
    let collectorName = getAnswerById('collector_name');
    Object.assign(result, {
      'Collector_Gov': collectorGov.value,
      'Comment_gov collector': collectorGov.commentValue,
      'Collector name': collectorName.value,
      'Comments collector name': collectorName.commentValue
    });

    // Collector non-gov
    let collectorNonGov = getAnswerById('collector_non_gov');
    Object.assign(result, {
      'Collector_non-gov': collectorNonGov.value,
      'Comment_non-gov': collectorNonGov.commentValue
    });

    // Findable
    let findable = getAnswerById('findable');
    let findableSteps = getAnswerById('findable_steps');
    Object.assign(result, {
      'Findable': findable.value,
      'Findable_comment': findable.commentValue,
      'Findable_steps taken': findableSteps.value,
      'Comments_steps taken': findableSteps.commentValue
    });

    // Timely
    let timely = getAnswerById('timely');
    Object.assign(result, {
      Timely: timely.value,
      Timely_comment: timely.commentValue
    });

    // Free
    let free = getAnswerById('free');
    Object.assign(result, {
      Free: free.value,
      Free_comment: free.commentValue
    });

    // Usability
    let usability = getAnswerById('usability');
    Object.assign(result, {
      Usability: usability.value,
      Usability_comment: usability.commentValue
    });

    // Bulk
    let bulk = getAnswerById('bulk');
    Object.assign(result, {
      'Downloadable at once': bulk.value,
      'Downloadable at once comment': bulk.commentValue
    });

    // Format
    let format = getAnswerById('format');
    for (const index of _.range(maxFormats)) {
      result[`Format ${index + 1}`] = format.value[index];
    }
    result['Format comment'] = format.commentValue;

    // Characteristics
    let characts = getAnswerById('characteristics');
    for (const index of _.range(maxCharacts)) {
      result[`Data element ${index + 1}`] = characts.value[index];
    }
    result['Data element comment'] = characts.commentValue;

    // Location
    let location = getAnswerById('location');
    for (const index of _.range(maxLocations)) {
      const data = location.value[index];
      result[`URL ${index + 1}`] = data ? data.urlValue : '';
      result[`Description URL ${index + 1}`] = data ? data.descValue : '';
    }
    result['URL comment'] = location.commentValue;

    // Metadata
    Object.assign(result, {
      reviewed: item.reviewed ? 'Yes' : 'No',
      reviewResult: item.reviewResult ? 'Yes' : 'No',
      reviewComments: item.reviewComments,
      details: item.details,
      isCurrent: item.isCurrent ? 'Yes' : 'No',
      isOpen: item.isOpenForQuestions(questions) ? 'Yes' : 'No',
      submitter: item.Submitter ? item.Submitter.fullName() : '',
      reviewer: item.Reviewer ? item.Reviewer.fullName() : '',
      score: item.computedScore,
      relativeScore: item.computedRelativeScore
    });

    return result;
  };

  // Response
  switch (format) {
    case 'json': {
      outputItemsAsJson(res, results, mapper);
      break;
    }
    case 'csv': {
      const columns = (results.length) ? Object.keys(mapper(results[0])) : [];
      outputItemsAsCsv(res, results, mapper, columns);
      break;
    }
    default: {
      res.sendStatus(404);
      break;
    }
  }
};

let pendingEntries = function(req, res, next) {
  const format = req.params.format;

  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    cascade: false,
    scoredQuestionsOnly: false,
    with: {Dataset: false, Place: false, Question: true}
  });

  // If year is implicitly set
  if (req.params.isYearImplicitlySet) {
    dataOptions = _.merge(dataOptions, {year: false});
  }

  modelUtils.getData(dataOptions)
  .then(data => {
    const pendingResults = data.pending;
    const questions = data.questions;
    _outputEntryResults(pendingResults, questions, format, res);
  }).catch(console.trace.bind(console));
};

let entries = function(req, res, next) {
  // Get request params
  const format = req.params.format;
  const strategy = req.params.strategy;
  const modifier = req.params.modifier;

  // Initial data options
  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    cascade: false,
    scoredQuestionsOnly: false,
    with: {Dataset: false, Place: false, Question: true}
  });

  // If year is implicitly set
  if (req.params.isYearImplicitlySet) {
    dataOptions = _.merge(dataOptions, {year: false});
  }

  // Strategy can be only `cascade` or `all`
  if (strategy === 'cascade') {
    dataOptions = _.merge(dataOptions, {cascade: true});
  } else if (strategy === 'all') {
    dataOptions = _.merge(dataOptions, {keepAll: true});
  } else if (strategy) {
    return res.sendStatus(404);
  }

  // Modifier can be only `flat` or `undefined`
  let outputFunction;
  if (modifier === 'flat') {
    outputFunction = _outputFlatEntryResults;
  } else if (modifier === undefined) {
    outputFunction = _outputEntryResults;
  } else {
    return res.sendStatus(404);
  }

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {
    const results = data.entries;
    const questions = data.questions;
    outputFunction(results, questions, format, res);
  }).catch(console.trace.bind(console));
};

module.exports = {
  entries: entries,
  pendingEntries: pendingEntries,
  datasets: datasets,
  places: places,
  questions: questions
};

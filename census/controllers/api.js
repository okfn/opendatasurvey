'use strict';

const csv = require('csv');
const _ = require('lodash');
const moment = require('moment');
const utils = require('./utils');
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

let entries = function(req, res, next) {
  // Get request params
  const format = req.params.format;
  const strategy = req.params.strategy;

  // Initial data options
  let dataOptions = _.merge(modelUtils.getDataOptions(req), {
    cascade: false,
    scoredQuestionsOnly: false,
    with: {Dataset: false, Place: false, Question: true}
  });

  // If year is implicitly set
  if (!!req.params.isYearImplicitlySet) {
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

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {
    const results = data.entries;
    let mapper = function(item) {
      const answers = utils.ynuAnswers(item.answers || {});
      return {
        id: item.id,
        site: item.site,
        timestamp: moment(item.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
        year: item.year,
        place: item.place,
        dataset: item.dataset,
        exists: answers.exists,
        digital: answers.digital,
        public: answers.public,
        online: answers.online,
        free: answers.free,
        machinereadable: answers.machinereadable,
        bulk: answers.bulk,
        openlicense: answers.openlicense,
        uptodate: answers.uptodate,
        url: answers.url,
        format: answers.format,
        licenseurl: answers.licenseurl,
        dateavailable: answers.dateavailable,
        officialtitle: answers.officialtitle,
        publisher: answers.publisher,
        reviewed: item.reviewed ? 'Yes' : 'No',
        reviewResult: item.reviewResult ? 'Yes' : 'No',
        reviewComments: item.reviewComments,
        details: item.details,
        isCurrent: item.isCurrent ? 'Yes' : 'No',
        isOpen: item.isOpenForQuestions(data.questions) ? 'Yes' : 'No',
        submitter: item.Submitter ? item.Submitter.fullName() : '',
        reviewer: item.Reviewer ? item.Reviewer.fullName() : '',
        score: item.computedScore
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
          'exists',
          'digital',
          'public',
          'online',
          'free',
          'machinereadable',
          'bulk',
          'openlicence',
          'uptodate',
          'url',
          'format',
          'licenseurl',
          'dateavailable',
          'officialtitle',
          'publisher',
          'reviewed',
          'reviewResult',
          'reviewComments',
          'details',
          'isCurrent',
          'isOpen',
          'submitter',
          'reviewer',
          'score'
        ];
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

module.exports = {
  entries: entries,
  datasets: datasets,
  places: places,
  questions: questions
};

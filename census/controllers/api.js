'use strict';

var csv = require('csv');
var _ = require('lodash');
var moment = require('moment');
var utils = require('./utils');
var modelUtils = require('../models').utils;

var outputItemsAsJson = function(response, items, mapper) {
  if (_.isFunction(mapper)) {
    items = _.map(items, mapper);
  }
  response.json({count: items.length, results: items});
};

var outputItemsAsCsv = function(response, items, mapper, columns) {
  var options = {
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
  var stringify = csv.stringify(items, options);
  response.header('Content-Type', 'text/csv');
  stringify.pipe(response);
};

var questions = function(req, res) {

  // Get request params
  var format = req.params.format;

  // Initial data options
  var dataOptions = _.merge(
    modelUtils.getDataOptions(req),
    {
      cascade: false,
      with: {Place: false, Entry: false, Dataset: false}
    }
  );

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {

    var columns = [
      'id',
      'site',
      'question',
      'description',
      'type',
      'placeholder',
      'score',
      'order',
      'icon',
      'dependants',
    ];
    var results = data.questions;
    var mapper = function(item) {
      var result = {};
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

var datasets = function(req, res, next) {

  // Get request params
  var report = req.params.report;
  var strategy = req.params.strategy;
  var format = req.params.format;

  // Report can be only `score`
  var isScore = false;
  if (report === 'score') {
    var isScore = true;
  } else if (report) {
    return res.sendStatus(404);
  }

  // Initial data options
  var dataOptions = _.merge(
    modelUtils.getDataOptions(req),
    {
      cascade: false,
      with: {Place: false, Entry: isScore, Question: isScore}
    }
  );

  // Strategy can be only `cascade`
  if (strategy === 'cascade') {
    dataOptions = _.merge(dataOptions, {cascade: true});
  } else if (strategy) {
    return res.sendStatus(404);
  }

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {

    var columns = [
      'id',
      'site',
      'name',
      'description',
      'category',
      'icon',
      'order',
    ];
    if (isScore) {
      columns = columns.concat([
        'rank',
        'score',
      ]);
    }
    var results = data.datasets;
    var mapper = function(item) {
      var result = {};
      item.score = item.computedScore;
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

var places = function(req, res, next) {

  // Get request params
  var report = req.params.report;
  var strategy = req.params.strategy;
  var format = req.params.format;

  // Report can be only `score`
  var isScore = false;
  if (report === 'score') {
    var isScore = true;
  } else if (report) {
    return res.sendStatus(404);
  }

  // Initial data options
  var dataOptions = _.merge(
    modelUtils.getDataOptions(req),
    {
      cascade: false,
      with: {Dataset: false, Entry: isScore, Question: isScore}
    }
  );

  // Strategy can be only `cascade`
  if (strategy === 'cascade') {
    dataOptions = _.merge(dataOptions, {cascade: true});
  } else if (strategy) {
    return res.sendStatus(404);
  }

  // Make request for data, return it
  modelUtils.getData(dataOptions).then(function(data) {

    var columns = [
      'id',
      'site',
      'name',
      'slug',
      'region',
      'continent',
    ];
    if (isScore) {
      columns = columns.concat([
        'rank',
        'score',
      ]);
    }
    var results = data.places;
    var mapper = function(item) {
       var result = {};
       item.score = item.computedScore;
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

var entries = function(req, res, next) {

  // Get request params
  var format = req.params.format;
  var strategy = req.params.strategy;

  // Initial data options
  var dataOptions = _.merge(
    modelUtils.getDataOptions(req),
    {
      cascade: false,
      ynQuestions: false,
      with: {Dataset: false, Place: false, Question: true}
    }
  );

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

      var results = data.entries;
      var mapper = function(item) {
        var answers = utils.ynuAnswers(item.answers || {});
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
          isOpen: item.isOpen() ? 'Yes' : 'No',
          submitter: item.Submitter ? item.Submitter.fullName() : '',
          reviewer: item.Reviewer ? item.Reviewer.fullName() : '',
          score: item.computedYCount,
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
            'score',
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

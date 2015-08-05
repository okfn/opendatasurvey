'use strict';

var _ = require('lodash');


var loadModels = function(querysets, options) {
  return Promise.all(_.map(querysets, function(V, K) {
    return new Promise(function(RS, RJ) { V.then(function(D) { RS([K, D]); }); });
  })).then(function(V) { return {data: _.object(V), options: options}; });
};


var siteQuery = function(domain, year, byYear) {
  var whereParams = {site: domain};
  if (byYear && year) { whereParams.year = year; }
  return {where: whereParams};
};


var translateSet = function(locale, results) {
  _.each(results, function(result, index, list) {
    list[index] = result.translated(locale);
  });
  return results;
};


var queryData = function(options) {

  /**
   * Query the database for data.
   * if options.ynQuestions, then only get yn
   * options.models has models
   * options.with.{MODELNAME} to control queries actually made. can be done better.
   */
  var entryParams = _.merge(siteQuery(options.domain, options.year, !options.cascade),
                            {
                              order: '"updatedAt" DESC',
                              include: [
                                {model: options.models.User, as: 'Submitter'},
                                {model: options.models.User, as: 'Reviewer'}
                              ]
                            }),
      datasetParams = _.merge(siteQuery(options.domain), {order: '"order" ASC'}),
      placeParams = _.merge(siteQuery(options.domain), {order: 'id ASC'}),
      questionParams = _.merge(siteQuery(options.domain), {order: 'score DESC'}),
      querysets = {};

  if (options.ynQuestions) { questionParams =  _.merge(questionParams, {where: {type: ''}}); }

  // prep the querysets object
  if (options.place) {
    placeParams = _.merge(placeParams, {where: {id: options.place}});
    entryParams = _.merge(entryParams, {where: {place: options.place}});
    if (options.with.Place) { querysets.place = options.models.Place.findOne(placeParams); }
  } else {
    if (options.with.Place) { querysets.places = options.models.Place.findAll(placeParams); }
  }

  if (options.dataset) {
    datasetParams = _.merge(datasetParams, {where: {id: options.dataset}});
    entryParams = _.merge(entryParams, {where: {dataset: options.dataset}});
    if (options.with.Dataset) { querysets.dataset = options.models.Dataset.findOne(datasetParams); }
  } else {
    if (options.with.Dataset) { querysets.datasets = options.models.Dataset.findAll(datasetParams); }
  }

  if (options.with.Entry) { querysets.entries = options.models.Entry.findAll(entryParams); }
  if (options.with.Question) { querysets.questions = options.models.Question.findAll(questionParams); }

  return loadModels(querysets, options);
};


var processStats = function(data, options) {

  /**
   * Process all data for stats.
   */

  data.stats = {};

  if (Array.isArray(data.entries)) {
    data.stats.currentEntryCount = data.entries.length;
    data.stats.currentEntryOpenCount = _.filter(data.entries, function(e) { return e.isOpen() === true; }).length;
    data.stats.openDataPercent = parseInt((data.stats.currentEntryOpenCount / data.stats.currentEntryCount) * 100, 10);
  } else {
    data.stats.currentEntryCount = 0;
    data.stats.currentEntryOpenCount = 0;
    data.stats.openDataPercentCount = 0;
  }

  if (Array.isArray(data.places)) {
    data.stats.placeCount = data.places.length;
  } else {
    data.stats.placeCount = 0;
  }

  return data;
};


var cascadeEntries = function(entries, currentYear) {
  var cascaded = [];
  var grouped = _.groupBy(entries, function(e) { return e.place + '/' + e.dataset; });
  _.each(grouped, function(value) {
    var match, matches = [], candidates;
    if (value) {
      candidates = _.sortByOrder(value, ['year', 'updatedAt'], 'desc');
      match = _.find(candidates, {'isCurrent': true});
      if (match) { matches.push(match); }
      matches = matches.concat(_.filter(candidates, {'isCurrent': false, 'year': currentYear}) || []);
      cascaded = cascaded.concat(matches);
    }
  });
  return cascaded;
};


var setEntryUrl = function(entry) {
  if (entry.isCurrent) {
    return '/entry/PLACE/DATASET'
      .replace('PLACE', entry.place)
      .replace('DATASET', entry.dataset);
  } else {
    return '/census/submission/ID'.replace('ID', entry.id);
  }
};


var processEntries = function(data, options) {

  /**
   * Process the raw entries query.
   */

  if (data.entry) {
    // do nothing. But, still need its related pending submissions?
  } else {
    if (Array.isArray(data.entries)) {
      data.reviewers = [];
      data.submitters = [];
      if (options.cascade) { data.entries = cascadeEntries(data.entries, options.year); }
      _.each(data.entries, function(e) {
        e.computedYCount = e.yCount(data.questions);
        e.url = setEntryUrl(e);
        data.pending = _.where(data.entries, {'isCurrent': false, 'reviewed': false});
        data.rejected = _.where(data.entries, {'isCurrent': false, 'reviewed': true, 'reviewResult': false});
        data.reviewers.push(e.Reviewer);
        data.submitters.push(e.Submitter);
      });

      _.remove(data.entries, function(e) { return e.isCurrent === false; });
      data.reviewers = _.uniq(data.reviewers, 'id');
      data.submitters = _.uniq(data.submitters, 'id');
      // TODO: sort by e.yCount desc ??? was in dataset.html ...
    }
  }

  return data;
};


var processPlaces = function(data, options) {

  /**
   * Process the raw places query.
   */

  if (data.place) {
    data.place = data.place.translated(options.locale);
  } else {
    if (Array.isArray(data.entries)) {
      _.each(data.places, function(p) {
        p.computedScore = p.score(data.entries, data.questions);
      });
      data.places = _.sortByOrder(translateSet(options.locale, data.places), 'computedScore', 'desc');
    }
  }

  return data;
};


var processDatasets = function(data, options) {

  /**
   * Process the raw datasets query.
   */

  if (data.dataset) {
    data.dataset = data.dataset.translated(options.locale);
  } else {
    data.datasets = translateSet(options.locale, data.datasets);
  }

  return data;
};


var processQuestions = function(data, options) {

  /**
   * Process the raw questions query.
   */

  data.questions = translateSet(options.locale, data.questions);

  return data;
};


var processData = function (result) {

  /**
   * Process the raw query data.
   */
  var data = result.data,
      options = result.options;
  if (data.entries || data.entry) { data = processEntries(data, options); }
  if (data.places || data.place) { data = processPlaces(data, options); }
  if (data.datasets || data.dataset) { data = processDatasets(data, options); }
  if (data.questions) { data = processQuestions(data, options); }
  data = processStats(data, options);

  return data;
};


var getData = function(options) {

  /**
   * The interface to get data, all clean and ready like.
   */

  return queryData(options).then(processData);
};


var getDataOptions = function(req) {
  return {
    models: req.app.get('models'),
    domain: req.params.domain,
    dataset: req.params.dataset,
    place: req.params.place,
    year: req.params.year,
    cascade: req.params.cascade,
    ynQuestions: true,
    locale: req.params.locale,
    with: {Entry: true, Dataset: true, Place: true, Question: true}
  };
};


module.exports = {
  loadModels: loadModels,
  siteQuery: siteQuery,
  translateSet: translateSet,
  cascadeEntries: cascadeEntries,
  getDataOptions: getDataOptions,
  getData: getData
};

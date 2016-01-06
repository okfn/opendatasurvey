'use strict';

var _ = require('lodash');

var loadModels = function(querysets, options) {
  return Promise.all(_.map(querysets, function(V, K) {
    return new Promise(function(RS, RJ) {
      V.then(function(D) {
        RS([K, D]);
      });
    });
  })).then(function(V) {
    return {
      data: _.object(V),
      options: options
    };
  });
};

var siteQuery = function(domain, year, byYear) {
  var whereParams = {
    site: domain
  };
  if (byYear && year) {
    whereParams.year = year;
  }
  return {
    where: whereParams
  };
};

var translateSet = function(locale, results) {
  _.each(results, function(result, index, list) {
    list[index] = result.translated(locale);
  });
  return results;
};

/**
 * Query the database for data.
 * if options.ynQuestions, then only get yn
 * options.models has models
 * options.with.{MODELNAME} to control queries actually made can be done better.
 */
var queryData = function(options) {
  var entryParams = _.merge(
    siteQuery(options.domain, options.year, !options.cascade),
    {
      order: '"updatedAt" DESC',
      include: [
        {model: options.models.User, as: 'Submitter'},
        {model: options.models.User, as: 'Reviewer'}
      ]
    });
  var datasetParams = _.merge(siteQuery(options.domain), {
    order: '"order" ASC'
  });
  var placeParams = _.merge(siteQuery(options.domain), {
    order: 'id ASC'
  });
  var questionParams = _.merge(siteQuery(options.domain), {
    order: 'score DESC'
  });
  var querysets = {};

  if (options.ynQuestions) {
    questionParams =  _.merge(questionParams, {where: {type: ''}});
  }

  // prep the querysets object
  if (options.place) {
    placeParams = _.merge(placeParams, {where: {id: options.place}});
    entryParams = _.merge(entryParams, {where: {place: options.place}});
    if (options.with.Place) {
      querysets.place = options.models.Place.findOne(placeParams);
    }
  } else {
    if (options.with.Place) {
      querysets.places = options.models.Place.findAll(placeParams);
    }
  }

  if (options.dataset) {
    datasetParams = _.merge(datasetParams, {where: {id: options.dataset}});
    entryParams = _.merge(entryParams, {where: {dataset: options.dataset}});
    if (options.with.Dataset) {
      querysets.dataset = options.models.Dataset.findOne(datasetParams);
    }
  } else {
    if (options.with.Dataset) {
      querysets.datasets = options.models.Dataset.findAll(datasetParams);
    }
  }

  if (options.with.Entry) {
    querysets.entries = options.models.Entry.findAll(entryParams);
  }
  if (options.with.Question) {
    querysets.questions = options.models.Question.findAll(questionParams);
  }

  return loadModels(querysets, options);
};

/**
 * Process all data for stats.
 */
var processStats = function(data, options) {
  data.stats = {};

  if (Array.isArray(data.entries)) {
    data.stats.currentEntryCount = data.entries.length;
    data.stats.currentEntryOpenCount = _.filter(data.entries, function(e) {
      return e.isOpen() === true;
    }).length;
    data.stats.openDataPercent = parseInt(
      (data.stats.currentEntryOpenCount / data.stats.currentEntryCount) * 100,
      10);
  } else {
    data.stats.currentEntryCount = 0;
    data.stats.currentEntryOpenCount = 0;
    data.stats.openDataPercentCount = 0;
  }

  if (Array.isArray(data.datasets)) {
    data.stats.datasetCount = data.datasets.length;
  } else {
    data.stats.datasetCount = 0;
  }

  if (Array.isArray(data.places)) {
    data.stats.placeCount = data.places.length;
  } else {
    data.stats.placeCount = 0;
  }

  return data;
};

var cascadeEntries = function(entries, currentYear) {
  if (currentYear) {
    entries = _.filter(entries, function(entry) {
      return entry.year <= currentYear;
    });
  }
  var cascaded = [];
  var grouped = _.groupBy(entries, function(e) {
    return e.place + '/' + e.dataset;
  });
  _.each(grouped, function(value) {
    var match;
    var matches = [];
    var candidates;
    if (value) {
      candidates = _.sortByOrder(value, ['year', 'updatedAt'], 'desc');
      match = _.find(candidates, {isCurrent: true});
      if (match) { matches.push(match); }
      matches = matches.concat(_.filter(candidates, {
        isCurrent: false,
        year: currentYear
      }) || []);
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
    return '/submission/ID'.replace('ID', entry.id);
  }
};

/**
 * Process the raw entries query.
 */
var processEntries = function(data, options) {
  if (Array.isArray(data.entries)) {
    data.reviewers = [];
    data.submitters = [];

    if (options.cascade) {
      data.entries = cascadeEntries(data.entries, options.year);
    }

    // Apply exclude filter
    data.entries = _.reject(data.entries, function(entry) {
      var result = false;
      if (options.exclude_datasets) {
        result = result || _.contains(options.exclude_datasets, entry.dataset);
      }
      if (options.exclude_places) {
        result = result || _.contains(options.exclude_places, entry.place);
      }
      return result;
    });

    _.each(data.entries, function(e) {
      e.computedYCount = e.yCount(data.questions);
      e.url = setEntryUrl(e);
    });

    data.pending = _.where(data.entries, {
      isCurrent: false,
      reviewed: false
    });
    data.rejected = _.where(data.entries, {
      isCurrent: false,
      reviewed: true,
      reviewResult: false
    });
    if (!options.keepAll) {
      _.remove(data.entries, function(e) {
        return e.isCurrent === false;
      });
    }

    _.each(data.entries, function(e) {
      data.reviewers.push(e.Reviewer);
      data.submitters.push(e.Submitter);
    });

    data.reviewers = _.uniq(data.reviewers, 'id');
    data.submitters = _.uniq(data.submitters, 'id');
  }
  return data;
};

/**
 * Process the raw places query.
 */
var processPlaces = function(data, options) {

  // Single place
  if (data.place) {

    // Translate
    data.place = data.place.translated(options.locale);

  // Many places
  } else {

    // Apply exclude filter
    if (options.exclude_places) {
      data.places = _.reject(data.places, function(place) {
        return _.contains(options.exclude_places, place.id);
      });
    }

    // Add scores, translate
    if (Array.isArray(data.entries)) {
      var questionMaxScore = options.models.Question.maxScore(data.questions);
      var datasetMaxScore = options.models.Dataset.maxScore(data.entries, questionMaxScore);
      _.each(data.places, function(p) {
        p.computedScore = p.score(data.entries, data.questions);
        p.computedRelativeScore = 0;
        if (datasetMaxScore) {
          p.computedRelativeScore = Math.round(100 * p.computedScore / datasetMaxScore);
        }
      });
      data.places = rankPlaces(_.sortByOrder(
        translateSet(options.locale, data.places), ['computedScore', 'name'], ['desc', 'asc']
      ));
    } else {
      data.places = translateSet(options.locale, data.places);
    }

  }

  return data;

};

/**
 * Process the raw datasets query.
 */
var processDatasets = function(data, options) {

  // Single dataset
  if (data.dataset) {

    data.dataset = data.dataset.translated(options.locale);

  // Many datasets
  } else {

    // Apply exclude filter
    if (options.exclude_datasets) {
      data.datasets = _.reject(data.datasets, function(dataset) {
        return _.contains(options.exclude_datasets, dataset.id);
      });
    }

    // Add scores, translate
    if (Array.isArray(data.entries)) {
      var questionMaxScore = options.models.Question.maxScore(data.questions);
      var placeMaxScore = options.models.Place.maxScore(data.entries, questionMaxScore);
      _.each(data.datasets, function(d) {
        d.computedScore = d.score(data.entries, data.questions);
        d.computedRelativeScore = 0;
        if (placeMaxScore) {
          d.computedRelativeScore = Math.round(100 * d.computedScore / placeMaxScore);
        }
      });
      data.datasets = rankDatasets(_.sortByOrder(
        translateSet(options.locale, data.datasets), 'computedScore', 'desc'
      ));
    } else {
      data.datasets = translateSet(options.locale, data.datasets);
    }

  }

  return data;

};

/**
 * Process the raw questions query.
 */
var processQuestions = function(data, options) {
  data.questions = translateSet(options.locale, data.questions);
  return data;
};

/**
 * Process the raw query data.
 */
var processData = function(result) {
  var data = result.data;
  var options = result.options;
  if (data.entries) {
    data = processEntries(data, options);
  }
  if (data.places || data.place) {
    data = processPlaces(data, options);
  }
  if (data.datasets || data.dataset) {
    data = processDatasets(data, options);
  }
  if (data.questions) {
    data = processQuestions(data, options);
  }
  data = processStats(data, options);
  return data;
};

/**
 * The interface to get data, all clean and ready like.
 */
var getData = function(options) {
  return queryData(options).then(processData);
};

/**
 * Do leaderboard ranking on places by computedScore. Places MUST be ordered
 * by descending score. Tied places have equal rank.
 */
var rankPlaces = function(places) {
  var lastScore = null;
  var lastRank = 0;

  _.each(places, function(p, i) {
    if (lastScore === p.computedScore) {
      p.rank = lastRank;
    } else {
      p.rank = i + 1;
    }
    lastRank = p.rank;
    lastScore = p.computedScore;
  });

  return places;
};

/**
 * Do leaderboard ranking on datasets by computedScore. Places MUST be ordered
 * by descending score. Tied places have equal rank.
 */
var rankDatasets = function(datasets) {
  var lastScore = null;
  var lastRank = 0;

  _.each(datasets, function(d, i) {
    if (lastScore === d.computedScore) {
      d.rank = lastRank;
    } else {
      d.rank = i + 1;
    }
    lastRank = d.rank;
    lastScore = d.computedScore;
  });

  return datasets;
};

/**
 * Extract data options from the request.
 */
var getDataOptions = function(req) {
  // Base options
  var options = {
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

  // Add exclude_datasets
  try {
    options = _.merge(options, {
      exclude_datasets: req.query.exclude_datasets.split(','),
    });
  } catch (err) {}

  // Add exclude_places
  try {
    options = _.merge(options, {
      exclude_places: req.query.exclude_places.split(','),
    });
  } catch (err) {}

  return options;

};

module.exports = {
  loadModels: loadModels,
  siteQuery: siteQuery,
  translateSet: translateSet,
  cascadeEntries: cascadeEntries,
  getDataOptions: getDataOptions,
  getData: getData
};

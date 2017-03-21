'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const debug = require('debug')('metalsmith-godi-getdata');

const models = require('../census/models');
const modelUtils = require('../census/models').utils;

module.exports = plugin;

/**
 * GODI Metalsmith plugin to retrieve Index data and add retrieved objects to
 * the metalsmith.metadata object.
 *
 * @return {Function}
 */

function plugin(options) {
  let defaultOptions = {
    models: models,
    domain: options.domain,
    dataset: null,
    place: null,
    year: options.year,
    cascade: false,
    scoredQuestionsOnly: false,
    locale: null,
    with: {Entry: true, Dataset: true, Place: true, Question: true}
  };

  return (files, metalsmith, done) => {
    // Get all the data for the site and year.
    models.Site.findById(options.domain)
    .then(site => {
      // Validate that there's a site and site.indexSettings
      if (site) {
        if (_.isEmpty(_.get(site, 'indexSettings'))) {
          throw new Error(`Can't generate Index. Site '${options.domain}' has no index settings.`);
        } else {
          return modelUtils.getData(defaultOptions);
        }
      } else {
        throw new Error(`Can't generate Index. Site '${options.domain}' does not exist.`);
      }
    })
    .then(data => {
      let metadata = metalsmith.metadata();
      // Add keys for the retrieved data directly to metalsmith.metadata.
      const keys = ['datasets', 'dataset', 'place', 'places', 'entries', 'questions', 'stats'];
      _.each(keys, key => {
        if (data.hasOwnProperty(key)) {
          debug('Adding ' + key + ' to metadata.');
          metadata[key] = data[key];
        }
      });

      // Munge questions
      if (metadata.hasOwnProperty('questions')) {
        // We're only interested in open, scored questions.
        metadata.questions = metadata.questions.filter(function(q) {
          return q.openquestion && q.score > 0;
        });
      }

      return data;
    })
    .then(data => {
      let metadata = metalsmith.metadata();
      // Request place details for each place in places. Add stats object to
      // corresponding place in metadata.places.
      let placesData = _.map(data.places, place => {
        const options = _.merge(_.clone(defaultOptions), {place: place.id});
        return modelUtils.getData(options)
        .then(placeData => {
          let p = _.find(metadata.places, {id: placeData.place.id});
          p.stats = placeData.stats;
        });
      });
      let datasetsData = _.map(data.datasets, dataset => {
        const options = _.merge(_.clone(defaultOptions), {dataset: dataset.id});
        return modelUtils.getData(options)
        .then(datasetData => {
          let d = _.find(metadata.datasets, {id: datasetData.dataset.id});
          d.stats = datasetData.stats;
        });
      });
      debug('Adding stats to each place and dataset.');
      return Promise.all(placesData.concat(datasetsData))
      .then(() => data);
    })
    .then(data => {
      // For each file, append data.stats to file.stats.
      _.each(files, f => {
        f.stats = _.assign(f.stats, data.stats);
      });
      debug('Adding ODI stats to each file.');
    })
    .then(() => done())
    .catch(err => done(err));
  };
}

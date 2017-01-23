'use strict';

const debug = require('debug')('metalsmith-godi-modifydata');

const models = require('../census/models');
const modelUtils = require('../census/models').utils;

module.exports = plugin;

/**
 * GODI Metalsmith plugin to retrieve Index data and add retreived objects to
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
    modelUtils.getData(defaultOptions)
    .then(data => {
      let metadata = metalsmith.metadata();

      // Add keys for the retrived data directly to metalsmith.metadata.
      const keys = ['datasets', 'places', 'entries', 'questions', 'stats'];
      keys.forEach(function(key) {
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

      done();
    })
    .catch(err => done(err));
  };
}

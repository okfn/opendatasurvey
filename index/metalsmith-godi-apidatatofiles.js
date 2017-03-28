'use strict';

const _ = require('lodash');

const debug = require('debug')('metalsmith-godi-apidatatofiles');

module.exports = plugin;

/**
 * GODI Metalsmith plugin to write api data from metalsmith.metadata to files.
 *
 * @return {Function}
 */

function plugin(options) {
  return (files, metalsmith, done) => {
    let metadata = metalsmith.metadata();
    // Metalsmith files from api data stored on metalsmith.metadata.
    const apiFiles = {
      datasetsApiCsv: 'api/datasets.csv',
      entriesApiCsv: 'api/entries.csv',
      questionsApiCsv: 'api/questions.csv',
      placesApiCsv: 'api/places.csv',
      datasetsApiJson: 'api/datasets.json',
      entriesApiJson: 'api/entries.json',
      questionsApiJson: 'api/questions.json',
      placesApiJson: 'api/places.json'
    };
    _.each(apiFiles, (filePath, key) => {
      if (metadata.hasOwnProperty(key)) {
        debug('Adding ' + filePath + ' to files.');
        let contents = metadata[key];
        if (_.has(contents, 'results')) {
          contents = JSON.stringify(contents.results);
        }

        files[filePath] = {
          contents: contents
        };
      }
    });

    done();
  };
}

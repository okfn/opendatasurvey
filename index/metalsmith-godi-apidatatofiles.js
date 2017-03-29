'use strict';

const _ = require('lodash');
const jsonexport = require('jsonexport');

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
      datasetsApi: 'api/datasets',
      entriesApi: 'api/entries',
      questionsApi: 'api/questions',
      placesApi: 'api/places'
    };
    _.each(apiFiles, (filePath, key) => {
      if (metadata.hasOwnProperty(key)) {
        debug('Adding ' + filePath + ' to files.');
        let contents = metadata[key];

        if (_.has(contents, 'results')) {
          contents = contents.results;
        }

        if (key === 'placesApi') {
          _.each(contents, place => {
            place.score = place.relativeScore;
            delete place.relativeScore;
          });
        }

        if (key === 'datasetsApi') {
          _.each(contents, dataset => {
            dataset.score = dataset.relativeScore;
            delete dataset.relativeScore;

            dataset.title = dataset.name;
            delete dataset.name;
          });
        }

        if (key === 'entriesApi') {
          _.each(contents, entry => {
            entry.score = entry.relativeScore;
            delete entry.relativeScore;
          });
        }

        let csvContents = '';
        jsonexport(contents, function(err, csv) {
          if (err) return console.log(err);
          csvContents = csv;
        });

        contents = JSON.stringify(contents);

        files[`${filePath}.json`] = {
          contents: contents
        };
        files[`${filePath}.csv`] = {
          contents: csvContents
        };
      }
    });

    done();
  };
}

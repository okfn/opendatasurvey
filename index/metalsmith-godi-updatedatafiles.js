'use strict';

const _ = require('lodash');

const debug = require('debug')('metalsmith-godi-updatedatafiles');

module.exports = plugin;

/**
 * GODI Metalsmith plugin that takes the results of json-to-files and updates
 * the file data structures to what is expected by the templates.
 *
 * json-to-files puts its source data on a 'data' key. We want to be more
 * specific.
 *
 * @return {Function}
 */

function plugin(options) {
  return (files, metalsmith, done) => {
    debug('Updating entries, places, and dataset.');
    _.each(files, file => {
      if (_.has(file, 'metadata_key')) {
        if (file.metadata_key === 'places') {
          file.place = file.data;
          file.stats = file.data.stats;
          delete file.data;
        }

        if (file.metadata_key === 'datasets') {
          file.dataset = file.data;
          file.stats = file.data.datas;
          delete file.data;
        }
      }
    });
    done();
  };
}

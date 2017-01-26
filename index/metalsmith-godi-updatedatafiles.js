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
    let metadata = metalsmith.metadata();
    debug('Updating entries, places, and dataset.');
    _.each(files, file => {
      if (_.has(file, 'metadata_key')) {
        if (file.metadata_key === 'entries') {
          file.entry = file.data;
          file.place = _.find(metadata.places, {id: file.entry.place});
          file.dataset = _.find(metadata.datasets, {id: file.entry.dataset});
          delete file.data;
        }

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

    // entries.md is added to `files` as part of build of entries. It's not
    // needed, so delete it.
    debug('Remove unnecessary \'entries\' file.');
    delete files['entries.md'];
    done();
  };
}

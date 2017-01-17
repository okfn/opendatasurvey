'use strict';

const debug = require('debug')('metalsmith-godi-moveresults');

module.exports = plugin;

/**
 * GODI Metalsmith plugin to move the `results` property of the `datasets`,
 * `places` and `entries` objects.
 *
 * @return {Function}
 */

function plugin() {
  return function(files, metalsmith, done) {
    setImmediate(done);
    let metadata = metalsmith.metadata();
    const keys = ['datasets', 'places', 'entries'];
    keys.forEach(function(key) {
      if (metadata.hasOwnProperty(key) && metadata[key].hasOwnProperty('results')) {
        debug('Modifying metadata.' + key);
        metadata[key] = metadata[key].results;
      }
    });
  };
}

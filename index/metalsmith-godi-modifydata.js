'use strict';

const debug = require('debug')('metalsmith-godi-modifydata');

module.exports = plugin;

/**
 * GODI Metalsmith plugin to modify the `datasets`, `places` and `entries`
 * objects present in the metadata object (previously retrieved in the
 * pipeline using metalsmith-request).
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

    // Munge places
    if (metadata.hasOwnProperty('places')) {
      // We have a `relativeScore`, but we need a `computedRelativeScore`.
      metadata.places.forEach(function(place) {
        if (place.hasOwnProperty('relativeScore')) {
          place.computedRelativeScore = place.relativeScore;
          delete place.relativeScore;
        }
      });
    }
  };
}

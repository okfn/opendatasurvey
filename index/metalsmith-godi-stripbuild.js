'use strict';

const _ = require('lodash');

const debug = require('debug')('metalsmith-godi-stripbuild');

module.exports = plugin;

/**
 * GODI Metalsmith plugin that removes ALL files from the build, effectively
 * preventing a build from taking place.
 *
 * This is useful to conditionally include in the pipeline, for example when
 * pushing to S3, so no local build takes place.
 *
 * @return {Function}
 */

function plugin(options) {
  return (files, metalsmith, done) => {
    debug('Remove all files from build pipeline (do not build locally).');
    _.each(files, (v, k) => {
      delete files[k];
    });
    done();
  };
}

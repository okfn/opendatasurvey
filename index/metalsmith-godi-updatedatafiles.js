'use strict';

const _ = require('lodash');

const debug = require('debug')('metalsmith-godi-updatedatafiles');

const buildDiscussionUrl =
  require('../census/controllers/utils.js').buildDiscussionUrl;

module.exports = plugin;

/**
 * GODI Metalsmith plugin that takes the upstream results of godi-getdata and
 * json-to-files, and updates the file data structures to what is expected by
 * the templates.
 *
 * json-to-files puts its source data on a 'data' key in file metadata. Move
 * it to the specific entity name instead.
 *
 * Move metadata such as `stats` from `data` to top-level file metadata.
 *
 * For entries, find the specific entry `place` and `dataset` and add them as
 * file metadata.
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
          // Add discussion_url to entry data
          if (metadata.discussionUrl) {
            file.discussionUrl = buildDiscussionUrl(metadata.discussionUrl,
                                                    metadata.gettext,
                                                    `${metadata.site_url}${file.paths.href}`,
                                                    file.dataset.id,
                                                    file.place.id);
          }

          delete file.data;
        }

        if (file.metadata_key === 'places') {
          file.place = file.data;
          file.stats = file.data.stats;

          file.map = _.clone(metadata.map);
          file.map.map_place = file.place.id;
          file.map.panel_tools = false;
          file.map.panel_share = false;
          file.map.embed_title = `${file.place.name} ; ${file.map.filter_year}`;

          delete file.data;
        }

        if (file.metadata_key === 'datasets') {
          file.dataset = file.data;
          file.stats = file.data.stats;

          file.map = _.clone(metadata.map);
          file.map.filter_dataset = file.dataset.id;
          file.map.panel_tools = false;
          file.map.panel_share = false;
          file.map.embed_title = `${file.dataset.name} ; ${file.map.filter_year}`;

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

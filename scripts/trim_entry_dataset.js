'use strict';

const _ = require('lodash');
const models = require('../census/models');
const Promise = require('bluebird');

// Trim trailing whitespace from entry.dataset values
let trimEntryDataset = function() {
  models.Entry.findAll({
    where: {dataset: {$like: '% '}}
  }).then(function(entries) {
    _.each(entries, e => {
      e.dataset = _.trim(e.dataset);
    });
    console.log(entries.length +
      ' entries with trailing space in dataset value');
    return Promise.each(entries, function(entry) {
      return entry.save().then(function() {
        console.log('Fixed entry, ' + entry.id +
        ', for dataset \'' + entry.dataset + '\'');
      });
    });
  }).then(function() {
    models.sequelize.close();
  });
};

if (require.main === module) {
  trimEntryDataset();
}

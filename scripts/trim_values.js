'use strict';

const _ = require('lodash');
const models = require('../census/models');
const Promise = require('bluebird');

// Trim trailing whitespace from entry.dataset and .place values
let trimEntry = function() {
  return models.Entry.all().then(function(entries) {
    let toTrim = [];
    _.each(entries, e => {
      e.set('dataset', _.trim(e.dataset));
      e.set('place', _.trim(e.place));
      if (e.changed('place') || e.changed('dataset')) {
        toTrim.push(e);
      }
    });
    console.log('Trimming ' + toTrim.length + ' entries');
    return Promise.each(toTrim, function(entry) {
      console.log('Trimmed entry: ' + entry.id +
        ' for ' + entry.site + '/' + entry.place + '/' + entry.dataset);
      return entry.save();
    });
  }).then(function() {
    console.log('Finished trimming entries');
  });
};

// Trim trailing whitespace from place.id values
let trimPlace = function() {
  return models.Place.all().then(function(places) {
    let toTrim = [];
    _.each(places, p => {
      let origId = p.id;
      if (origId !== _.trim(origId)) {
        toTrim.push(p);
      }
    });
    console.log('Trimming ' + toTrim.length + ' places');
    return Promise.each(toTrim, function(place) {
      models.Place.update({id: _.trim(place.id)}, {where: {id: place.id}});
      console.log('Trimmed place: ' + place.site + '/' + place.id);
    });
  }).then(function() {
    console.log('Finished trimming places');
  });
};

if (require.main === module) {
  Promise.join(trimEntry(), trimPlace(), function() {
    console.log('Finished All!');
    models.sequelize.close();
  });
}

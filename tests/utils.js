var data = require('../fixtures/registry')
      .concat(require('../fixtures/site'))
      .concat(require('../fixtures/user'))
      .concat(require('../fixtures/place'))
      .concat(require('../fixtures/dataset'))
      .concat(require('../fixtures/question'))
      .concat(require('../fixtures/entry'));
var models = require('../census/models');
var Promise = require('bluebird');


module.exports.setupFixtures = function(done) {
  models.sequelize.getQueryInterface().dropAllTables()
    .then(function() {

      models.umzug.up().then(function() {

        return Promise.each(data, function(obj) {
          return models[obj.model].create(obj.data)
            .then(function() {})
            .catch(console.log.bind(console));
        })
          .then(function() {
            console.log('fixtures loaded');
            done();
          })
          .catch(console.log.bind(console));

      });

    });
}

module.exports.dropFixtures = function(done) {
  models.sequelize.getQueryInterface().dropAllTables()
    .then(function() {
      console.log('dropped all tables');
      done();
    })
    .catch(console.log.bind(console));
}

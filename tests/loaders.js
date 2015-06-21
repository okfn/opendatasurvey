IN_TESTING = true;

var _ = require('underscore');
var assert = require('chai').assert;
var config = require('../census/config');
var loaders = require('../census/loaders');
var models = require('../census/models');
var spreadSheetHandler = require('../census/loaders/includes/spreadSheetHandler');


describe('Data loaded from spread sheet into DB', function(){
  beforeEach(function(done) {
    models.sequelize.sync().then(function () {
      console.log('Synced!');
      done();
    });
  });

  it('Registry', function(done) {
    this.timeout(10000);

    models.Registry.destroy({truncate: true}).then(function() {
      var registryIDs;

      spreadSheetHandler.parse(config.get('registryUrl') || false).spread(function (E, R) {
        registryIDs = _.pluck(R, 'censusid');

        loaders.loadRegistry('demo').spread(function(E, D) {
          models.Registry.findAll().then(function(D) { assert.deepEqual(registryIDs, _.pluck(D, 'id')); done(); });
        });
      });
    });
  });
});

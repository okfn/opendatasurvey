'use strict';

var model = require('./lib/model').OpenDataCensus;
var routeUtils = require('./routes/utils');
var config = require('./lib/config');
var models = require('./models');
var app = require('./app').app;


if (config.get('debug')) {
  console.log(config.get());
}

model.load(function(err) {
  if (err) {
    console.error('Failed to load dataset info');
    throw err;
  }

  routeUtils.setupAuth();

  models.sequelize.sync().then(function () {
      app.listen(app.get('port'), function() {
          console.log("Listening on " + app.get('port'));
      });
  });

});

var model = require('./lib/model').OpenDataCensus
  , census = require('./routes/census')
  , config = require('./lib/config')
  ;

// Booting up
// ========================================================

if (config.get('debug')) {
  console.log(config.get());
}
model.load(function(err) {
  if (err) {
    console.error('Failed to load dataset info');
    throw err;
  }

  app = require('./app').app

  // Passport Auth Stuff (Facebook etc)
  // set up here rather than app.js as must be after config load to
  // get site_url
  census.setupAuth();
  app.listen(app.get('port'), function() {
    console.log("Listening on " + app.get('port'));
  });
});


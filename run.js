var model = require('./lib/model').OpenDataCensus
  , app = require('./app').app
  ; 

// Booting up
// ========================================================

model.load(function(err) {
  if (err) {
    console.error('Failed to load dataset info');
    throw err;
  }
  app.listen(app.get('port'), function() {
    console.log("Listening on " + app.get('port'));
  });
});


// Routes for the Open Data Index (presentation) only
//
// TODO: this should probably move out of the core census app ...

exports.addRoutes = function(app) {

  app.get('/press', function(req, res) {
    res.render('press.html');
  });

  app.get('/visualisations', function(req, res) {
    res.render('visualisations.html');
  });

};

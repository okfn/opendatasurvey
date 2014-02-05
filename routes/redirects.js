// Redirect routes added for backwards compatability

// for backwards compabibility (primarily post v2)

exports.addRoutes = function(app) {
  app.get('/country/login', function(req, res) {
    res.redirect('/login?next=' + req.query.next);
  });
}


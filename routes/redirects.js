// Redirect routes added for backwards compatability
//
// Primarily changes are v2 => v3
// see https://github.com/okfn/opendatacensus/issues/257

exports.addRoutes = function(app) {
  app.get('/country', makeRedirect('/'));
  app.get('/country/results.json', makeRedirect('/overview.json'))
  app.get('/country/overview/:place', function(req, res) {
    res.redirect('/place/' + req.params.place);
  });
  app.get('/country/dataset/:dataset', function(req, res) {
    res.redirect('/dataset/' + req.params.dataset);
  });

  app.get('/country/review/:submissionid', function(req, res) {
    res.redirect('/submission/' + req.params.submissionid);
  });

  app.get('/country/login', function(req, res) {
    res.redirect('/login?next=' + req.query.next);
  });

  app.get('/country/submit', makeRedirect('/submit'));
  app.get('/country/submission/:id', function(req, res) {
    res.redirect('/submission/' + req.params.id);
  });

  // comes last to avoid conflicts
  app.get('/country/:place/:dataset', function(req, res) {
    res.redirect('/entry/' + req.params.place + '/' + req.params.dataset);
  });
}

function makeRedirect(dest) {
  return function(req, res) {
    res.redirect(dest);
  };
}

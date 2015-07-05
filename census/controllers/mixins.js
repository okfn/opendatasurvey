'use strict';

var _ = require('underscore');


var requireDomain = function(req, res, next) {

  if (!req.params.domain) {

    res.status(404).send({status: 'error', message: 'Each census requires a subdomain to host it.'});
    return;

  } else {

    var query = req.app.get('models').Registry.findById(req.params.domain);

    query
      .then(function(result) {
        if (!result) {
          res.status(404).send({status: 'error', message: 'There is no matching census in the registry.'});
          return;
        } else {
          req.params.site = result;
          next();
          return;
        }
      })
      .catch(function() {
        res.status(404).send({status: 'error', message: 'There is no matching census in the registry SHIT.'});
      });

  }

};


var requireAuth = function (req, res, next) {

  if (!req.user) {
    res.redirect('/auth/login/?next=' + encodeURIComponent(req.url));
    return;
  }

  next();
  return;

};


var requireReviewer = function (req, res, next) {

  // Get both the main reviewers list...
  var reviewers = req.app.get('config').get('reviewers') || [];
  if (!!(~reviewers.indexOf(req.user.userid) || ~reviewers.indexOf(req.user.email))) {
    return true;
  }

  // TODO get reviewers for place
  // TODO get reviewers for all
  // TODO we are changing to reviewers for dataset anyway...

  return false;
};

var requireAdmin = function (req, res, next) {

  if (req.app.get('config').get('admins').indexOf(req.user.userid) !== -1) {
    res.status(403).send({status: 'error', message: 'not allowed'});
    return;
  }

  next();
  return;

};

var requireAvailableYear = function (req, res, next) {

  req.params.year = parseInt(req.params.year, 10);

  if (req.params.year && _.indexOf(req.app.get('years'), req.params.year) === -1) {
    res.status(404).send({status: 'not found', message: 'not found here'});
    return;
  }

  next();
  return;

};


module.exports = {
  requireDomain: requireDomain,
  requireAuth: requireAuth,
  requireReviewer: requireReviewer,
  requireAdmin: requireAdmin,
  requireAvailableYear: requireAvailableYear
};

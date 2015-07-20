'use strict';

var _ = require('lodash');


var requireDomain = function(req, res, next) {

  if (!req.params.domain) {

    res.status(404).render('404.html', {title: 'Not found', message: 'Not found'});
    return;

  } else if (req.params.domain === req.app.get('authDomain') ||
             req.params.domain === req.app.get('systemDomain')) {

    req.params.siteAdmin = [];

    next();
    return;

  } else {

    var query = req.app.get('models').Registry.findById(req.params.domain);

    query
      .then(function(result) {

        if (!result) {
          res.status(404).send({status: 'error', message: 'There is no matching census in the registry.'});
          return;
        } else {

          req.session.activeSite = req.params.domain;

          req.params.siteAdmin = _.each(result.settings.adminemail.split(','), function(e, i, l) {
            var pattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm,
                admin = e.trim(),
                match = admin.match(pattern);

            l[i] = match[0];
            return;
          });

          req.params.configUrl = result.settings.configurl;
          res.locals.configUrl = req.params.configUrl;
          res.locals.siteAdmin = req.params.siteAdmin;

          req.app.get('models').Site.findById(req.params.domain).then(function(result) {

            if (result) {

              if (result.settings.reviewers) {
                result.settings.reviewers = _.each(result.settings.reviewers.split(','), function(e, i, l) {
                  l[i] = e.trim(); return;
                });
              }
            }

            req.params.site = result;
            res.locals.site = result;
            next();
            return;
          });
        }
      })
      .catch(function() {
        res.status(404).send({status: 'error', message: 'There is no matching census in the registry.'});
      });

  }

};


var requireAuth = function (req, res, next) {

  if (!req.user) {

    var redirectTo = req.app.get('urlTmpl')
        .replace('SCHEME', req.app.get('config').get('connection_scheme'))
        .replace('SUB', req.app.get('config').get('auth_subdomain'))
        .replace('DOMAIN', req.app.get('config').get('base_domain'))
          .replace('PATH', 'login?next=N'.replace('N', encodeURIComponent(req.originalUrl.slice(1))));

    res.redirect(redirectTo);
    return;
  }

  next();
  return;

};


var requireReviewer = function (req, res, next) {

  if (_.intersection(req.params.site.settings.reviewers, req.user.emails) !== -1) {

    return true;

  }

  return false;

};

var requireAdmin = function (req, res, next) {

  if (req.user && (_.intersection(req.app.get('sysAdmin'), req.user.emails) ||
                   _.intersection(req.params.siteAdmin, req.user.emails))) {

    next();
    return;

  } else {

    res.status(403).send({status: 'error', message: 'not allowed'});
    return;

  }

};

var requireAvailableYear = function (req, res, next) {

  if (typeof(req.params.year) === 'undefined') {
    req.params.year = req.app.get('year');
  } else {

    req.params.year = parseInt(req.params.year, 10);

    if (_.indexOf(req.app.get('years'), req.params.year) === -1) {
      res.status(404).send({status: 'not found', message: 'not found here'});
      return;
    }

  }

  next();
  return;

};


var requireAuthDomain = function(req, res, next) {

  if (req.params.domain !== req.app.get('authDomain')) {
    res.status(404).render('404.html', {
      title: 'Not found',
      message: 'AUTH ROUTE ONLY'
    });
    return;
  }

  next();
  return;
};


var requireSystemDomain = function(req, res, next) {

  if (req.params.domain !== req.app.get('systemDomain')) {
    res.status(404).render('404.html', {
      title: 'Not found',
      message: 'SYSTEM ROUTE ONLY'
    });
    return;
  }

  next();
  return;
};


var requireSystemDomain = function(req, res, next) {

  if (req.params.domain !== req.app.get('systemDomain')) {
    res.status(404).render('404.html', {
      title: 'Not found',
      message: 'SYSTEM ROUTE ONLY'
    });
    return;
  }

  next();
  return;
};


var requireSiteDomain = function(req, res, next) {

  if (req.params.domain === req.app.get('authDomain') ||
      req.params.domain === req.app.get('systemDomain')) {

    res.send('This route does not exist on this domain.');
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
  requireAvailableYear: requireAvailableYear,
  requireAuthDomain: requireAuthDomain,
  requireSystemDomain: requireSystemDomain,
  requireSiteDomain: requireSiteDomain
};

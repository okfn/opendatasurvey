'use strict';

var _ = require('lodash');
var utils = require('./utils');

var setupLocalization = function(req, res, site) {
  var config = req.app.get('config');

  // Try to use site-specific settings + fallback to defaults
  var requestedLocales = config.get('locales');
  if (_.isArray(site.settings.locales)) {
    requestedLocales = site.settings.locales;
  } else
  if (_.isString(site.settings.locales)) {
    requestedLocales = site.settings.locales.split(utils.FIELD_SPLITTER);
  }

  // Sanitize locales list: remove invalid and unavailable locales
  var availableLocales = config.get('availableLocales');
  var locales = _.chain(requestedLocales)
    .map(_.trim).filter(function(item) {
      if (item.length == 0) {
        return false;
      }
      return availableLocales.indexOf(item) >= 0;
    }).value();
  if (locales.length == 0) {
    locales = config.get('locales');
  }

  // Check user settings and update environment for current request
  if (req.session.lang && (locales.indexOf(req.session.lang) >= 0)) {
    req.setLocale(req.session.lang);
  } else {
    req.setLocale(_.first(locales));
  }
  res.locals.locales = locales;
  res.locals.currentLocale = req.locale;
};

var requireDomain = function(req, res, next) {
  res.locals.domain = req.params.domain;

  if (!req.params.domain) {
    res.status(404).render('404.html', {
      title: 'Not found',
      message: 'Not found'
    });
  } else
  if (req.params.domain === req.app.get('authDomain') ||
    req.params.domain === req.app.get('systemDomain')) {

    req.params.siteAdmin = [];
    next();
  } else {
    var query = req.app.get('models').Registry.findById(req.params.domain);

    query
      .then(function(result) {

        if (!result) {
          res.status(404).send({
            status: 'error',
            message: 'There is no matching census in the registry.'
          });
        } else {
          req.session.activeSite = req.params.domain;
          req.params.siteAdmin = result.settings.adminemail;
          req.params.flags = {'characteristics': false, 'comments': false};
          if (result.settings.flags) {
            _.each(result.settings.flags.split(','), function(e, i, l) {
              var feature = e.trim();
              if (_.indexOf(_.keys(req.params.flags), feature) >= 0) {
                req.params.flags[feature] = true;
              }
            });
          }

          res.locals.flags = req.params.flags;
          req.params.configUrl = result.settings.configurl;
          res.locals.configUrl = req.params.configUrl;
          res.locals.siteAdmin = req.params.siteAdmin;

          req.app.get('models').Site.findById(req.params.domain)
            .then(function(result) {
              if (result) {
                if (result.settings.reviewers) {
                  result.settings.reviewers = _.each(result.settings.reviewers,
                    function(e, i, l) {
                      l[i] = e.trim();
                    });
                }
              }
              req.params.site = result;
              res.locals.site = result;
              setupLocalization(req, res, result);
              next();
            });
        }
      })
      .catch(function() {
        res.status(404).send({
          status: 'error',
          message: 'There is no matching census in the registry.'
        });
      });
  }
};

var requireAuth = function(req, res, next) {
  if (!req.user) {
    var redirectTo = req.app.get('urlTmpl')
      .replace('SCHEME', req.app.get('config').get('connection_scheme'))
      .replace('SUB', req.app.get('config').get('auth_subdomain'))
      .replace('DOMAIN', req.app.get('config').get('base_domain'))
      .replace('PATH', 'login?next=N'
        .replace('N', encodeURIComponent(req.originalUrl.slice(1)))
      );

    res.redirect(redirectTo);
    return;
  }
  next();
};

var requireAdmin = function(req, res, next) {
  if (req.user && (
    (_.intersection(req.params.siteAdmin, req.user.emails)).length >= 1) ||
    (_.intersection(req.app.get('sysAdmin'), req.user.emails).length >= 1)
  ) {
    next();
  } else {
    res.status(403).send({
      status: 'error',
      message: 'not allowed'
    });
  }
};

var requireAvailableYear = function(req, res, next) {
  /**
   * Set year as a request param. If one is passed explicitly, try to use it.
   * If one is not passed, set to current year, and set cascade to true.
   */
  if (typeof req.params.year === 'undefined') {
    req.params.year = req.app.get('year');
    req.params.isYearImplicitlySet = true;
    res.locals.year = req.params.year;
    req.params.cascade = true;
    res.locals.cascade = req.params.cascade;
  } else {
    req.params.year = parseInt(req.params.year, 10);
    res.locals.year = req.params.year;
    req.params.cascade = false;
    res.locals.cascade = req.params.cascade;
    if (_.indexOf(req.app.get('years'), req.params.year) === -1) {
      res.status(404).send({
        status: 'not found',
        message: 'not found here'
      });
      return;
    }
  }
  next();
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
};

var requireSiteDomain = function(req, res, next) {
  if (req.params.domain === req.app.get('authDomain') ||
    req.params.domain === req.app.get('systemDomain')
  ) {
    req.app.get('models').Registry.findAll().then(function(result) {
      return res.render('wayfinder.html', {registry: result});
    });
  }
  next();
};

module.exports = {
  requireDomain: requireDomain,
  requireAuth: requireAuth,
  requireAdmin: requireAdmin,
  requireAvailableYear: requireAvailableYear,
  requireAuthDomain: requireAuthDomain,
  requireSystemDomain: requireSystemDomain,
  requireSiteDomain: requireSiteDomain
};

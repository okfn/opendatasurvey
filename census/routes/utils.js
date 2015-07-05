'use strict';

var _ = require('underscore');
var bcrypt = require('bcrypt');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var models = require('../models');
var config = require('../config');


var makeRedirect = function (dest) {
  return function (req, res) {
    res.redirect(dest);
  };
};


var scopedPath = function(relativePath) {
  return '/subdomain/:domain{PATH}'.replace('{PATH}', relativePath);
};


var validateSubmitForm = function (req) {
  /**
   * Ensures validation data is submitted by checking the POST data on
   * req.body according to the declared validation logic.
   * Used for new data submissions, and revision proposals.
   */

  var errors,
    exists;

  // first check exists for a yes answer.
  if (req.body.hasOwnProperty('exists') && req.body.exists === 'Yes') {
    exists = true;
  }

  req.checkBody('place', 'You must select a Place').notEmpty();
  req.checkBody('dataset', 'You must select a Dataset').notEmpty();
  req.checkBody('exists', 'You must make a valid choice').isChoice();

  if (exists) {

    req.checkBody('digital', 'You must make a valid choice').isChoice();
    req.checkBody('public', 'You must make a valid choice').isChoice();
    req.checkBody('free', 'You must make a valid choice').isChoice();
    req.checkBody('online', 'You must make a valid choice').isChoice();
    req.checkBody('machinereadable', 'You must make a valid choice').isChoice();
    req.checkBody('bulk', 'You must make a valid choice').isChoice();
    req.checkBody('openlicense', 'You must make a valid choice').isChoice();
    req.checkBody('uptodate', 'You must make a valid choice').isChoice();

  }

  errors = req.validationErrors();

  return errors;
};

var _getLocalReviewers = function (place) {
  // Get the local reviewers of a specific place.
  // Not all places have a reviewers column
  return (place.hasOwnProperty('reviewers')) ? place.reviewers.trim().split(/[\s,]+/) : [];
};


var setupAuth = function () {
  passport.use(new GoogleStrategy({
    clientID: config.get('google:app_id'),
    clientSecret: config.get('google:app_secret'),
    callbackURL: config.get('site_url').replace(/\/$/, '') + '/auth/google/callback',
    profileFields: ['id', 'displayName', 'name', 'username', 'emails', 'photos']
  }, function (accessToken, refreshToken, profile, done) {
    models.User.upsert({
      anonymous: false,
      email    : profile.emails[0].value,
      firstName: profile.name.givenName,
      id       : profile._json.url,
      lastName : profile.name.familyName
    }).then(function() { done(null, models.User.findById(profile._json.url)); });
  }));

  /*
   * Facebook strategy
   */
  passport.use(new FacebookStrategy({
    clientID: config.get('facebook:app_id'),
    clientSecret: config.get('facebook:app_secret'),
    callbackURL: config.get('site_url').replace(/\/$/, '') + '/auth/facebook/callback',
  }, function (accessToken, refreshToken, profile, done) {
    models.User.upsert({
      anonymous: false,
      email    : profile.emails[0].value,
      firstName: profile.name.givenName,
      id       : profile.profileUrl,
      lastName : profile.name.familyName
    }).then(function() { done(null, models.User.findById(profile.profileUrl)); });
  }));

  /*
   * local strategy
   */
  passport.use('local', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  }, function (request, email, password, done) {
    models.User.findOne({where: {email: email}})
      .then(function(U) {
        if(
          // Such email doesn't exist
          !U ||

          // Wrong password
          U.authentication_hash !== bcrypt.hashSync(password, U.authentication_salt)
        ) {
          request.flash('error', 'Wrong username or passsowrd');
          done(null, false);
          return;
        }

        done(null, U);
      });
  }));

  // At the moment we get all user info on auth and store to cookie so these are both no-ops ...
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (profile, done) {
    var err = null;
    done(err, profile);
  });

};

var setLocals = function(req, res, next) {

  var config = req.app.get('config');

  if (config.get('test:testing') === true && !req.user && config.get('test:user')) {
    req.user = config.get('test:user');
  }
  if (req.cookies.lang) {
    req.locale = req.cookies.lang;
  }
  res.locals.currentUser = req.user ? req.user : null;

  res.locals.locales = config.get('locales');
  res.locals.currentLocale = req.locale;
  res.locals.sitename = config.get('title', req.locale);
  res.locals.sitename_short = config.get('title_short', req.locale);
  res.locals.custom_css = config.get('custom_css');
  res.locals.google_analytics_key = config.get('google_analytics_key');
  res.locals.custom_footer = config.get('custom_footer', req.locale);
  res.locals.navbar_logo = config.get('navbar_logo', req.locale);
  res.locals.banner_text = config.get('banner_text', req.locale);
  res.locals.current_url = 'SCHEME://DOMAIN_PATH'.replace('SCHEME', req.protocol).replace('DOMAIN_', req.get('host')).replace('PATH', req.path);
  res.locals.current_domain = 'SCHEME://DOMAIN_'.replace('SCHEME', req.protocol).replace('DOMAIN_', req.get('host'));
  res.locals.post_submission_info = config.get('post_submission_info');
  res.locals.share_submission_template = config.get('share_submission_template', req.locale);
  res.locals.share_page_template = config.get('share_page_template', req.locale);
  res.locals.url_query = req.query;
  res.locals.error_messages = req.flash('error');
  res.locals.info_messages = req.flash('info');

  res.locals.urlFor = function(name) {
    if (name === 'overview')
      return '/';
  };

  next();

};


module.exports = {
  makeRedirect: makeRedirect,
  validateSubmitForm: validateSubmitForm,
  setupAuth: setupAuth,
  scoped: scopedPath,
  setLocals: setLocals
};

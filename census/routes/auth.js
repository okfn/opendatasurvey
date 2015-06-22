'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../controllers/auth');
var mixins = require('../controllers/mixins');
var utils = require('./utils');
var authConfig = {
  facebook: {
    successRedirect: '/auth/loggedin',
    failureRedirect: '/login',
    scope: 'public_profile,email'
  },

  google: {
    successRedirect: '/auth/loggedin',
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: true,
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }
};

var authRoutes = function(coreMiddlewares) {

  var router = express.Router();
  var coreMixins = [mixins.requireDomain];

  router.use(coreMiddlewares);
  router.use(passport.initialize());
  router.use(passport.session());

  router.get(utils.scoped('/login'), coreMixins, auth.login);
  router.get(utils.scoped('/loggedin'), coreMixins, auth.loggedin);
  router.get(utils.scoped('/logout'), coreMixins, auth.logout);
  router.get(utils.scoped('/facebook'), coreMixins, passport.authenticate('facebook', authConfig.facebook));
  router.get(utils.scoped('/facebook/callback'), coreMixins, passport.authenticate('facebook', authConfig.facebook));
  router.get(utils.scoped('/google'), coreMixins, passport.authenticate('google', authConfig.google));
  router.get(utils.scoped('/google/callback'), coreMixins, passport.authenticate('google', authConfig.google));

  router.post(
    utils.scoped('/local'),
    coreMixins,
    passport.authenticate('local', {successRedirect: '/auth/loggedin', failureRedirect: '/auth/login'})
  );

  return router;

};


module.exports = authRoutes;

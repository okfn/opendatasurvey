'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../controllers/auth');
var utils = require('./utils');
var authConfig = {
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

var authRoutes = function(middlewares) {

  var router = express.Router();

  router.use(middlewares);
  router.use(passport.initialize());
  router.use(passport.session());

  router.get(utils.scoped('/login'), auth.login);
  router.get(utils.scoped('/loggedin'), auth.loggedin);
  router.get(utils.scoped('/logout'), auth.logout);
  router.get(utils.scoped('/google'), passport.authenticate('google', authConfig.google.scope));
  router.get(utils.scoped('/google/callback'), passport.authenticate('google', authConfig.google));

  return router;

};


module.exports = authRoutes;

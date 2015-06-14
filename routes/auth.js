'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../controllers/auth');
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

var authRoutes = function() {

  var router = express.Router();

  router.use(passport.initialize());
  router.use(passport.session());

  router.get('/login', auth.login);
  router.get('/loggedin', auth.loggedin);
  router.get('/logout', auth.logout);
  router.get('/google', passport.authenticate('google', authConfig.google.scope));
  router.get('/google/callback', passport.authenticate('google', authConfig.google));

  return router;
};


module.exports = authRoutes;

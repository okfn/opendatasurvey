'use strict';

var express = require('express');
var utils = require('./utils');

var redirectRoutes = function() {

  var router = express.Router();

  router.get('/country', utils.makeRedirect('/'));
  router.get('/country/results.json', utils.makeRedirect('/overview.json'));
  router.get('/country/overview/:place', function (req, res) {
    res.redirect('/place/' + req.params.place);
  });
  router.get('/country/dataset/:dataset', function (req, res) {
    res.redirect('/dataset/' + req.params.dataset);
  });
  router.get('/country/review/:submissionid', function (req, res) {
    res.redirect('/submission/' + req.params.submissionid);
  });
  router.get('/country/login', function (req, res) {
    res.redirect('/login?next=' + req.query.next);
  });
  router.get('/country/submit', utils.makeRedirect('/submit'));
  router.get('/country/submission/:id', function (req, res) {
    res.redirect('/submission/' + req.params.id);
  });
  router.get('/country/:place/:dataset', function (req, res) {
    res.redirect('/entry/' + req.params.place + '/' + req.params.dataset);
  });

  return router;
};


module.exports = redirectRoutes;

'use strict';

var express = require('express');
var mixins = require('../controllers/mixins');
var utils = require('./utils');


var redirectRoutes = function(router) {

  var coreMixins = [mixins.requireDomain];

  router.get(utils.scoped('/country'), coreMixins, utils.makeRedirect('/'));
  router.get(utils.scoped('/country/results.json'), coreMixins, utils.makeRedirect('/api/entries.json'));
  router.get(utils.scoped('/country/overview/:place'), coreMixins, function (req, res) {
    res.redirect('/place/' + req.params.place);
  });
  router.get(utils.scoped('/country/dataset/:dataset'), coreMixins, function (req, res) {
    res.redirect('/dataset/' + req.params.dataset);
  });
  router.get(utils.scoped('/country/review/:submissionid'), coreMixins, function (req, res) {
    res.redirect('/submission/' + req.params.submissionid);
  });
  router.get(utils.scoped('/country/login'), coreMixins, function (req, res) {
    res.redirect('/login?next=' + req.query.next);
  });
  router.get(utils.scoped('/country/submit'), coreMixins, utils.makeRedirect('/submit'));
  router.get(utils.scoped('/census/submit'), coreMixins, utils.makeRedirect('/submit'));
  router.get(utils.scoped('/country/submission/:id'), coreMixins, function (req, res) {
    res.redirect('/submission/' + req.params.id);
  });
  router.get(utils.scoped('/census/submission/:id'), coreMixins, function (req, res) {
    res.redirect('/submission/' + req.params.id);
  });
  router.get(utils.scoped('/country/:place/:dataset'), coreMixins, function (req, res) {
    res.redirect('/entry/' + req.params.place + '/' + req.params.dataset);
  });

  return router;

};


module.exports = redirectRoutes;

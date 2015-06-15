'use strict';

var express = require('express');
var utils = require('./utils');

var redirectRoutes = function(middlewares) {

  var router = express.Router();

  router.use(middlewares);

  router.get(utils.scoped('/country'), utils.makeRedirect(utils.scoped('/')));
  router.get(utils.scoped('/country/results.json'), utils.makeRedirect(utils.scoped('/overview.json')));
  router.get(utils.scoped('/country/overview/:place'), function (req, res) {
    res.redirect(utils.scoped('/place/' + req.params.place));
  });
  router.get(utils.scoped('/country/dataset/:dataset'), function (req, res) {
    res.redirect(utils.scoped('/dataset/' + req.params.dataset));
  });
  router.get(utils.scoped('/country/review/:submissionid'), function (req, res) {
    res.redirect(utils.scoped('/submission/' + req.params.submissionid));
  });
  router.get(utils.scoped('/country/login'), function (req, res) {
    res.redirect(utils.scoped('/login?next=' + req.query.next));
  });
  router.get(utils.scoped('/country/submit'), utils.makeRedirect(utils.scoped('/submit')));
  router.get(utils.scoped('/country/submission/:id'), function (req, res) {
    res.redirect(utils.scoped('/submission/' + req.params.id));
  });
  router.get(utils.scoped('/country/:place/:dataset'), function (req, res) {
    res.redirect(utils.scoped('/entry/' + req.params.place + '/' + req.params.dataset));
  });

  return router;

};


module.exports = redirectRoutes;

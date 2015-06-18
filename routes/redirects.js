'use strict';

var express = require('express');
var mixins = require('../controllers/mixins');
var utils = require('./utils');


var redirectRoutes = function(coreMiddlewares) {

  var router = express.Router();
  var coreMixins = [mixins.requireDomain];

  router.use(coreMiddlewares);

  router.get(utils.scoped('/country'), coreMixins, utils.makeRedirect(utils.scoped('/')));
  router.get(utils.scoped('/country/results.json'), coreMixins, utils.makeRedirect(utils.scoped('/overview.json')));
  router.get(utils.scoped('/country/overview/:place'), coreMixins, function (req, res) {
    res.redirect(utils.scoped('/place/' + req.params.place));
  });
  router.get(utils.scoped('/country/dataset/:dataset'), coreMixins, function (req, res) {
    res.redirect(utils.scoped('/dataset/' + req.params.dataset));
  });
  router.get(utils.scoped('/country/review/:submissionid'), coreMixins, function (req, res) {
    res.redirect(utils.scoped('/submission/' + req.params.submissionid));
  });
  router.get(utils.scoped('/country/login'), coreMixins, function (req, res) {
    res.redirect(utils.scoped('/login?next=' + req.query.next));
  });
  router.get(utils.scoped('/country/submit'), coreMixins, utils.makeRedirect(utils.scoped('/submit')));
  router.get(utils.scoped('/country/submission/:id'), coreMixins, function (req, res) {
    res.redirect(utils.scoped('/submission/' + req.params.id));
  });
  router.get(utils.scoped('/country/:place/:dataset'), coreMixins, function (req, res) {
    res.redirect(utils.scoped('/entry/' + req.params.place + '/' + req.params.dataset));
  });

  return router;

};


module.exports = redirectRoutes;

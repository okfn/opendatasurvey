'use strict';

var census = require('../controllers/census');
var mixins = require('../controllers/mixins');
var utils = require('./utils');

var censusRoutes = function(router) {
  var coreMixins = [mixins.requireDomain, mixins.requireAvailableYear,
    mixins.requireAuth];

  router.get(utils.scoped('/submit'), coreMixins, census.submit);
  router.post(utils.scoped('/submit'), coreMixins, census.submit);
  router.get(utils.scoped('/submit-react'), coreMixins, census.submitReact);
  router.get(utils.scoped('/submission/:id'),
    [mixins.requireDomain, mixins.requireAvailableYear],
    census.pendingEntry);
  router.post(utils.scoped('/submission/:id'), coreMixins, census.reviewPost);

  return router;
};

module.exports = censusRoutes;

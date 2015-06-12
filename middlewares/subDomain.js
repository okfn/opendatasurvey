var Promise = require('bluebird');
var model = require('../lib/model').OpenDataCensus;
var models = require('../models');

var subDomain = {
  /*
   * check if sub-domain exists in database
   */
  checkIfSubDomainExists: function (req, res, next) {
    var subDomain = getSubDomain(req);
    var errorResponse = {status: 'error', message: 'You requested an unknown census'};
    if (subDomain) {
      return checkIfSubDomainIsInDb(subDomain).spread(function (err, searchResult) {
        if (err) {
          req.isSubDomainExists = false;
        } else {
          if (searchResult) {
            req.subDomain = subDomain;
            req.isSubDomainExists = true;
          } else {
            req.isSubDomainExists = false;
            res.status(404).send(errorResponse);
            return;
          }
        }
        next();
      });
    } else {
      res.status(404).send(errorResponse);
      req.isSubDomainExists = false;
      return;
      next();
    }
  }
};


function getSubDomain(req) {
  var output = false;
  var host = req['headers']['host'] || false;
  if (host) {
    var hostParts = host.split('.');
    output = hostParts[0];
  }
  return output;
}


function checkIfSubDomainIsInDb(subDomain) {
  var searchQuery = {where: {id: subDomain}};
  return models.Registry.find(searchQuery).then(function (searchResult) {
    var data = false;
    if (searchResult && searchResult['dataValues']) {
      data = true;
    }
    return [false, data];
  });
}

module.exports = subDomain;

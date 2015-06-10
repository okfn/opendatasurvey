var Promise = require('bluebird');
var model = require('../lib/model').OpenDataCensus;
var models = require('../models');

var subDomain = {
  checkIfSubDomainExists: function (req, res, next) {
    var subDomain = getSubDomain(req);
    if (subDomain) {
      return checkIfSubDomainIsInDb(subDomain).spread(function (err, searchResult) {
        if (err) {
          req.isSubDomainExists = false;
        } else {
          if (searchResult) {
            req.isSubDomainExists = true;
          } else {
            req.isSubDomainExists = false;
          }
        }
        next();
      });
    } else {
      req.isSubDomainExists = false;
      next();
    }
  }
};


function getSubDomain(req) {
  var host = req['headers']['host'];
  var hostParts = host.split('.');
  return hostParts[0];
}


function checkIfSubDomainIsInDb(subDomain) {
  var searchQuery = {where: {id: subDomain}};
  return models.Registry.find(searchQuery).then(function (searchResult) {
    var data = searchResult['dataValues'] || false;
    return [false, data];
  });
}

module.exports = subDomain;

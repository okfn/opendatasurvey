var Promise = require('bluebird');
var model = require('../lib/model').OpenDataCensus;
var models = require('../models');

var reloadEntities = {
  /*
   * check subDomain exists in Database and sets 'registryConfig' url
   */
  setConfigUrl: function (req, res, next) {
    var originalUrl = getOriginalUrl(req);
    if (originalUrl && checkIfReloadActions(originalUrl)) {
      var subDomain = req.subDomain;
      return findSubDomaisInRegistry(subDomain).spread(function (err, searchResult) {
        if (err) {

        } else {
          req.registryConfig = getConfigFromRegistry(searchResult);
          next();
        }
      });

    } else {
      next();
    }
  }
};

function getOriginalUrl(req) {
  var originalUrl = false;
  if (req['headers'] && req['headers']['referer']) {
    originalUrl = req['headers']['referer'];
  }
  return originalUrl;
}

function checkIfReloadActions(url) {
  if (url.indexOf('/reload') > -1) {
    return true;
  } else {
    return false;
  }
}

function findSubDomaisInRegistry(subDomain) {
  var searchQuery = {where: {id: subDomain}};
  return models.Registry.find(searchQuery).then(function (searchResult) {
    var data = false;
    if (searchResult && searchResult['dataValues']) {
      data = searchResult['dataValues'];
    }
    return [false, data];
  });
}

function getConfigFromRegistry(registry) {
  var configUrl = false;
  if (registry && registry['settings']) {
    configUrl = registry['settings']['configurl'] || false;
  }
  return configUrl;
}


module.exports = reloadEntities;

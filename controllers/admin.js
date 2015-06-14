var loaders = require('../loaders');

/*
 * reload entities functionality
 */

//show reload dashboard
var dashboard = function (req, res) {
  res.sendfile('./public/reloadDashboard.html');
};


var createReloadResultRepsonse = function (err, reloadResult) {
  var response = false;
  if (err) {
    response = {status: 'error', message: err};
  } else {
    response = {status: 'ok', data: 'ok'};
  }
  return response;
};
/*
 * reload places
 */
var loadPlaces = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return loaders.loadPlaces(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload datasets
 */
var loadDatasets = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return loaders.loadDatasets(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload Questions
 */
var loadQuestions = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return loaders.loadQuestions(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload Registry
 */
var loadRegistry = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return loaders.loadRegistry(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload Config
 */
var loadConfig = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return loaders.loadConfig(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

module.exports = {
  dashboard: dashboard,
  loadRegistry: loadRegistry,
  loadConfig: loadConfig,
  loadPlaces: loadPlaces,
  loadDatasets: loadDatasets,
  loadQuestions: loadQuestions
}

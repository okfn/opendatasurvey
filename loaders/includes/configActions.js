var config = require('../../lib/config');

var configActions = {
  getRegistryUrl: function () {
    var registryUrl = false;
    registryUrl = config.get('registryUrl') || false;
    return registryUrl;
  }

};




module.exports = configActions;


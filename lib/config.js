var path = require('path')
  , nconf = require('nconf')
  ;

nconf.file({
  file: path.join(path.dirname(__dirname), '/settings.json')
});
 
 // this is the object that you want to override in your own local config
nconf.defaults({
  "configUrl": process.env.CONFIG_URL || 'http://config.url',

  "appconfig": {
    "port": process.env.PORT || 5000,
    "auth_on": process.env.AUTH_ON !== undefined || false,
    "auth_user": process.env.AUTH_USER,
    "auth_passhash": process.env.AUTH_PASSHASH,
    "review_passhash": process.env.REVIEW_PASSHASH || "c2NyeXB0AAwAAAAIAAAAAcuoRdsxvRZfPTTCD6H8wkZFi1LTuf11n47ODWm44e85eoYUyMlDOgmEbZTyxs99k3vYi0KSb542L5kn0YavUPiOltwF++lWVB1jjzDvFwlo",
    "readonly": process.env.READONLY !== undefined || false
  },

  "google": {
    "user": process.env.GOOGLE_USER || "unknown",
    "password": process.env.GOOGLE_PASSWORD || "no-password"
  },

  "database": {
    "country": {
      // What is the year for which we are collecting data?
      "currentYear": process.env.CENSUS_YEAR || 2013,
    }
  },

  // config for testing mode
  "test": {
    "testing": process.env.TEST !== undefined || false
  }
});

module.exports = nconf;

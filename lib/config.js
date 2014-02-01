var path = require('path')
  , nconf = require('nconf')
  ;

nconf.file({
  file: path.join(path.dirname(__dirname), '/settings.json')
});
 
 // this is the object that you want to override in your own local config
nconf.defaults({
  "configUrl": process.env.CONFIG_URL || 'http://config.url',
  "questions_url": '',
  "datasets_url": '',

  "appconfig": {
    "port": process.env.PORT || 5000,
    "auth_on": process.env.AUTH_ON !== undefined || false,
    "auth_user": process.env.AUTH_USER,
    "auth_passhash": process.env.AUTH_PASSHASH,
    "review_passhash": process.env.REVIEW_PASSHASH || "c2NyeXB0AAsAAAAIAAAAAZlY40bzkP1UPHtaO6fSJ68XhLM7sFJUunZzouQZOj3SRthS8hzI3VKR4cJd+mHF3BOVeWzTsuJhCp1ZtntH6u7KzG39AUN8R2AyI60duqLP",
    "readonly": process.env.READONLY !== undefined || false,
    "sitename": process.env.SITENAME || "Open Data Census",
    "sitename_short": process.env.SITENAME_SHORT || "Census",
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

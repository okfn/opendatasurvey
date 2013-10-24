var path = require('path');
var nconf = require('nconf');

nconf.file({
  file: path.join(path.dirname(__dirname), '/settings.json')
});

// this is the object that you want to override in your own local config
nconf.defaults({
  "appconfig": {
    "port": process.env.PORT || 5000,
    "auth_on": process.env.AUTH_ON !== undefined || false,
    "auth_user": process.env.AUTH_USER,
    "auth_passhash": process.env.AUTH_PASSHASH,
    "review_passhash": process.env.REVIEW_PASSHASH || "c2NyeXB0AAsAAAAIAAAAAZlY40bzkP1UPHtaO6fSJ68XhLM7sFJUunZzouQZOj3SRthS8hzI3VKR4cJd+mHF3BOVeWzTsuJhCp1ZtntH6u7KzG39AUN8R2AyI60duqLP",
    "readonly": process.env.READONLY !== undefined || false,
    "sitename": process.env.SITENAME || "Open Data Census",
    "sitename_short": process.env.SITENAME_SHORT || "Census"
  },

  "google": {
    "user": process.env.GOOGLE_USER || "unknown",
    "password": process.env.GOOGLE_PASSWORD || "no-password"
  },

  "database": {
    "questionsUrl": "https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=1&output=csv",
    "country": {
      // What is the year for which we are collecting data?
      "currentYear": process.env.CENSUS_YEAR || 2013,
      // This is the list of datasets... i.e. a foreign field in the results table
      "datasetsUrl": "http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=0&output=csv",
      // Google docs spreadsheet database
      "spreadsheetKey": process.env.SPREADSHEET_KEY || "0AqR8dXc6Ji4JdGdUbXdPNjNZRmg0d09tZTZWd1pQUHc"
    }
  },

  // config for testing mode
  "test": {
    "testing": process.env.TEST !== undefined || false
  }
});

module.exports = nconf;

var path = require('path')
  , nconf = require('nconf')
  ;

nconf
     .file({file: path.join(
       path.dirname(__dirname), '/settings.json')
     })

nconf.defaults(
// this is the object that you want to override in your own local config
{ "appconfig" :
          {
      "port": process.env.PORT || 5000
          },
  "google": {
      "user": process.env.GOOGLE_USER || "unknown"
    , "password": process.env.GOOGLE_PASSWORD || "no-password"

  }
  , "database": {
    "questionsUrl": "https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=1&output=csv"
    , "country": {
        //What is the year for which we are collecting data?
        "currentYear": process.env.CENSUS_YEAR || 2013
        //This is the list of datasets... i.e. a foreign field in the results table
      ,  "datasetsUrl": 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=0&output=csv'
        // Google docs spreadsheet database
      , "spreadsheetKey" : process.env.SPREADSHEET_KEY || '0AqR8dXc6Ji4JdGdUbXdPNjNZRmg0d09tZTZWd1pQUHc'
    }
    , "city": {
      "datasetsUrl": "http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=3&output=csv"

      , "resultsUrl": "https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdEEycENNYXQtU1RIbzRSYVRxLXFOdHc&single=true&gid=1&output=csv"
    }
  }
  // config for testing mode
  , "test": {
    "testing": process.env.TEST || false
  }
}
);

module.exports = nconf;


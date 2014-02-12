var path = require('path')
  , nconf = require('nconf')
  ;

nconf.file({
  file: path.join(path.dirname(__dirname), '/settings.json')
});
 
 // this is the object that you want to override in your own local config
nconf.defaults({
  "configUrl": process.env.CONFIG_URL || 'http://config.url',
  title_short: 'Census',
  display_year: 2014,
  submit_year: 2014,
  site_url: process.env.SITE_URL || 'http://localhost:5000',
  reviewers: '',
  about_page: '<h1>To set content for this page update your configuration file</h1>',
  contribute_page: '<h1>To set content for this page update your configuration file</h1>',
  faq_page: '<h1>To set content for this page update your configuration file</h1>',
  // default user db
  user_database_key: '0AqR8dXc6Ji4JdGJXallkcjNOaFlmN1N5MXZkM1ZSbUE',
  questions: 'https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=3&output=csv',
  debug: process.env.DEBUG || false,

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
    "password": process.env.GOOGLE_PASSWORD || "no-password",
    app_id: process.env.GOOGLE_APP_ID || 'unknown',
    app_secret: process.env.GOOGLE_APP_SECRET || 'unknown'
  },

  facebook: {
    app_id: process.env.FACEBOOK_APP_ID || 'unknown',
    app_secret: process.env.FACEBOOK_APP_SECRET || 'unknown'
  },

  // config for testing mode
  "test": {
    "testing": process.env.TEST !== undefined || false,
    "user": {
      userid: 'tester',
      provider_id: 'xxx',
      provider: 'facebook',
      username: 'tester',
      name: 'Tester',
      email: 'test@okfn.org',
      gravatar: 'https://www.gravatar.com/avatar/'
    }
  }
});

module.exports = nconf;

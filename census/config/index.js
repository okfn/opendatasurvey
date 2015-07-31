'use strict';

var path = require('path');
var _ = require('lodash');
var nconf = require('nconf');
var fs = require('fs');
var marked = require('marked');


function getContent(filepath) {
  return marked(fs.readFileSync(filepath, 'utf8'));
}

nconf.file({
  file: path.join(path.dirname(path.dirname(__dirname)), '/settings.json')
});

 // this is the object that you want to override in your own local config
nconf.defaults({
  env: process.env.NODE_ENV || 'development',
  registryUrl: process.env.REGISTRY_URL || '',
  title_short: 'Census',
  base_domain: process.env.BASE_DOMAIN || 'dev.census.org:5000',
  urlTmpl: 'SCHEME://SUB.DOMAIN/PATH',
  auth_subdomain: process.env.AUTH_SUBDOMAIN || 'id',
  system_subdomain: process.env.SYSTEM_SUBDOMAIN || 'system',
  connection_scheme:  process.env.CONNECTION_SCHEME || 'http',
  sentry_dsn: process.env.SENTRY_DSN || '',
  approve_first_submission: 'FALSE',
  reviewers: '',
  locales: ['en'],
  email_from: process.env.EMAIL_FROM || '',

  mandrill: {
    smtp_host: process.env.SMTP_HOST || 'smtp.mandrillapp.com',
    smtp_port: process.env.SMTP_PORT || 587,
    smtp_username: process.env.SMTP_USERNAME || 'noreply@census.okfn.org',
    smtp_password: process.env.SMTP_PASSWORD || ''
  },

  disqus_shortname: 'opendatacensus',
  about_page: '<h1>To set content for this page update your configuration file</h1>',
  contribute_page: '<h1>To set content for this page update your configuration file</h1>',
  faq_page: '<h1>To set content for this page update your configuration file</h1>',
  missing_place_html: '',
  submit_page: getContent('census/content/submit.md'),
  review_page: getContent('census/content/review.md'),
  banner_text: undefined, // set in config sheet to activate
  share_submission_template: undefined, // set in config sheet to activate
  share_page_template: undefined, // set in config sheet to activate
  post_submission_info: undefined, // set in config sheet to activate
  debug: process.env.DEBUG || false,
  database: {
    username: process.env.DB_USER || 'opendatacensus',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'opendatacensus',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    define: {
      charset: "utf-8",
      collate: "utf8_general_ci",
      timestamps: true
    }
  },
  
  disqus: {
    api_key: process.env.DISQUS_API_KEY || '',
    api_secret: process.env.DISQUS_API_SECRET || ''
  },

  appconfig: {
    port: process.env.PORT || 5000,
    auth_on: process.env.AUTH_ON !== undefined || false,
    auth_user: process.env.AUTH_USER,
    auth_passhash: process.env.AUTH_PASSHASH,
    review_passhash: process.env.REVIEW_PASSHASH || "c2NyeXB0AAwAAAAIAAAAAcuoRdsxvRZfPTTCD6H8wkZFi1LTuf11n47ODWm44e85eoYUyMlDOgmEbZTyxs99k3vYi0KSb542L5kn0YavUPiOltwF++lWVB1jjzDvFwlo"
  },
  google: {
    app_id: process.env.GOOGLE_APP_ID || 'unknown',
    app_secret: process.env.GOOGLE_APP_SECRET || 'unknown'
  },
  facebook: {
    app_id: process.env.FACEBOOK_APP_ID || 'unknown',
    app_secret: process.env.FACEBOOK_APP_SECRET || 'unknown'
  }
});

module.exports = {
  get: function(key, lang) {
    if (lang) {
      var defaultLocale = _.first(module.exports.get('locales'));

      return nconf.get.call(nconf, key + '@' + lang) ||
        nconf.get.call(nconf, key + '@' + defaultLocale) ||
        nconf.get.call(nconf, key);
    } else {
      return nconf.get.call(nconf, key);
    }
  },
  set: nconf.set.bind(nconf),
  reset: nconf.reset.bind(nconf)
};

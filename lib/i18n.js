var i18n = require('i18n-abide')
  , fs = require('fs')
  , config = require('./config')
  , locales
  , _ = require('underscore')
  ;

module.exports = {
  locales: function() {
    locales = locales ||
      config.get('locales');

    return locales;
  },
  init: function(app) {
    var locales = module.exports.locales();

    app.use(i18n.abide({
      supported_languages: locales,
      default_lang: _.first(locales),
      translation_directory: 'locale'
    }));
  }
};

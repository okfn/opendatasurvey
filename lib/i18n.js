var i18n = require('i18n-abide')
  , fs = require('fs')
  , locales
  , _ = require('underscore')
  ;

module.exports = {
  locales: function() {
    locales = locales ||
      _.without(fs.readdirSync(__dirname + '/../locale'), 'messages.pot');

    return locales;
  },
  init: function(app) {
    var locales = module.exports.locales();

    app.use(i18n.abide({
      supported_languages: locales,
      default_lang: 'en',
      translation_directory: 'locale'
    }));
  }
};

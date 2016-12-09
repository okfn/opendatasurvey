'use strict';

var _ = require('lodash');

var translated = function(locale) {
  var localized;
  if (this.translations && this.translations[locale]) {
    localized = this.translations[locale];
    _.forEach(localized, (value, key, list) => {
      if (this.get(key) !== undefined) {
        this[key] = value;
      }
    });
  }
  return this;
};

module.exports = {
  translated: translated
};

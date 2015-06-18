'use strict';

var _ = require('underscore');


var translated = function(locale) {

  if (this.translations && this.translations[locale]) {
    var localized = this.translations[locale];
    _.each(localized, function(value, key, list) {
      if (this.hasOwnProperty(key)) {
        this[key] = value;
      }
    });
  }

  return this;

};


module.exports = {
  translated: translated
}

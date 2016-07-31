'use strict';

var Promise = require('bluebird');
var request = require('request');
var xss = require('xss');
var csv = require('csv');

var spreadsheetParse = function(fileUrl) {
  return new Promise(function(resolve, reject) {
    var csvUrl = getCsvForGoogleSheet(fileUrl);
    getDataAsCsv(csvUrl, function(err, result) {
      if (err) {
        resolve([err, false]);
      } else {
        resolve([false, result]);
      }
    });
  });
};

var getDataAsCsv = function(url, cb) {
  request.get(url, function(err, res, body) {
    var output = [];
    var parser = csv.parse({
      relax: true,
      'skip_empty_lines': true
    });

    parser
      .on('readable', function(data) {
        while (data = parser.read()) {
          output.push(data);
        }
      })
      .on('error', function(err) {
        cb(err, false);
      })
      .on('end', function() {
        var result = _mapParsedCsvData(output);
        cb(false, result);
      });

    parser.write(body);
    parser.end();
  });
};

var _mapParsedCsvData = function(parsedData) {
  var result = [];
  var keys = [];
  for (var i = 0; i < parsedData.length; i++) {
    if (i === 0) {
      for (var j = 0; j < parsedData[i].length; j++) {
        var key = xss(parsedData[i][j].toLowerCase());
        keys.push(key);
      }
    } else {
      var object = {};
      for (var n = 0; n < keys.length; n++) {
        object[keys[n]] = xss(parsedData[i][n]);
      }
      result.push(object);
    }
  }
  return result;
};

var getSheetParams = function(url) {
  var newPattern = /.*spreadsheets\/d\/([^#?&+]+)\/edit[^#]*(#gid=([\d]+).*)?/;
  var oldPattern = /.*spreadsheet\/ccc?.*key=([^#?&+]+)[^#]*(#gid=([\d]+).*)?/;
  var out = {key: '', sheet: 0};
  var matches;

  if (!url) {
    return out;
  }

  matches = url.match(newPattern) || url.match(oldPattern);

  if (!!matches) {
    out.key = matches[1];
    out.sheet = parseInt(matches[3]);
    if (isNaN(out.sheet)) {
      out.sheet = 0;
    }
  }
  return out;
};

var getCsvForGoogleSheet = function(url) {
  var info = getSheetParams(url);
  if (info.key.length === 0) {
    // sheet may have already been a CSV...
    return url;
  } else {
    return getCsvFromSheetParams(info);
  }
};

var getCsvFromSheetParams = function(info) {
  var tmpl = 'https://docs.google.com/spreadsheet/pub?key=KEY&' +
    'single=true&gid=INDEX&output=csv';
  return tmpl.replace('KEY', info.key).replace('INDEX', info.sheet);
};

module.exports = {
  spreadsheetParse: spreadsheetParse,
  getCsvFromSheetParams: getCsvFromSheetParams,
  getSheetParams: getSheetParams,
  getCsvForGoogleSheet: getCsvForGoogleSheet,
  getDataAsCsv: getDataAsCsv
};

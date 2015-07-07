'use strict';

var Promise = require('bluebird');
var request = require('request');
var csv = require('csv');


var spreadsheetParse = function (fileUrl) {

  return new Promise(function (resolve, reject) {

    var csvUrl = getCsvForGoogleSheet(fileUrl);

    getDataAsCsv(csvUrl, function (err, result) {
      if (err) {
        resolve([err, false]);
      } else {
        resolve([false, result]);
      }
    });

  });

};

var getDataAsCsv = function (url, cb) {

  request.get(url, function (err, res, body) {
    var output = [];
    var parser = csv.parse({
      relax: true
    });

    parser
      .on('readable', function (data) {
        while (data = parser.read()) {
          output.push(data);
        }
      })
      .on('error', function (err) {
        cb(err, false);
      })
      .on('end', function () {
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
        var key = parsedData[i][j].toLowerCase();
        keys.push(key);
      }
    } else {
      var object = {};
      for (var n = 0; n < keys.length; n++) {
        object[keys[n]] = parsedData[i][n];

      }
      result.push(object);
    }
  }

  return result;

};


var getSheetParams = function (url) {

  var newPattern = /.*spreadsheets\/d\/([^#?&+]+)\/edit[^#]*(#gid=([\d]+).*)?/,
      oldPattern = /.*spreadsheet\/ccc?.*key=([^#?&+]+)[^#]*(#gid=([\d]+).*)?/,
      out = {key: '', sheet: 0},
      matches;

  if (!url) {
    return out;
  }

  matches = url.match(newPattern) || url.match(oldPattern);
  console.log('SHIT DAWG');
  console.log(matches);
  if (!!matches) {
    out.key = matches[1];
    out.sheet = parseInt(matches[3]);

    if (isNaN(out.sheet)) {
      out.sheet = 0;
    }

  }

  return out;

};


var getCsvForGoogleSheet = function (url) {

  var info = getSheetParams(url);

  if (info.key.length === 0) {
    // sheet may have already been a CSV...
    return url;

  } else {

    return getCsvFromSheetParams(info);

  }

};


var getCsvFromSheetParams = function(info) {

  var tmpl = 'https://docs.google.com/spreadsheet/pub?key=KEY&single=true&gid=INDEX&output=csv';
  return tmpl.replace('KEY', info.key).replace('INDEX', info.sheet);

};


var cleanUpCommon = function (db, records) {
  var correcter = {
    'yes': 'Y',
    'yes ': 'Y',
    'no': 'N',
    'no ': 'N',
    'unsure': '?'
  };
  var out = records.map(function (record) {
    // fix up y/n
    db.scoredQuestions.forEach(function (qu) {
      if (qu.id in record && record[qu.id].toLowerCase() in correcter) {
        record[qu.id] = correcter[record[qu.id].toLowerCase()];
      }
    });

    if (record.place != record.place.toLowerCase()) {
      console.warn('place attribute on record is not lower case');
      console.log(record);
    }
    record.ycount = exports.scoreOpenness(db, record);
    // Data is exists, is open, and publicly available, machine readable etc
    record.isopen =
      (record['exists'] == 'Y') &&
      (record['openlicense'] == 'Y') &&
      (record.public == 'Y') &&
      (record['machinereadable'] == 'Y')
      ;
    return record;
  });
  return out;
};


module.exports = {
  spreadsheetParse: spreadsheetParse,
  getCsvFromSheetParams: getCsvFromSheetParams,
  getSheetParams: getSheetParams,
  getCsvForGoogleSheet: getCsvForGoogleSheet,
  getDataAsCsv: getDataAsCsv,
  cleanUpCommon: cleanUpCommon
};

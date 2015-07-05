'use strict';

var Promise = require('bluebird');
var request = require('request');
var csv = require('csv');
var _ = require('underscore');


var spreadsheetParse = function (fileUrl) {
  return new Promise(function (resolve, reject) {
    var formattedUrl = parseSpreadsheetUrl(fileUrl);
    formattedUrl = getCsvUrlForGoogleSheet(fileUrl);
    getCsvData(formattedUrl, function (err, result) {
      if (err) {
        resolve([err, false]);
      } else {
        resolve([false, result]);
      }
    });
  });
};

var getCsvData = function (url, cb) {
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
        var result = mapParsedCsvData(output);
        cb(false, result);
      });

    parser.write(body);
    parser.end();
  });
};




var mapParsedCsvData = function(parsedData) {
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


// parse a google spreadsheet url returning key and sheet (index)
var parseSpreadsheetUrl = function (url) {
  var regex = /.*spreadsheet\/ccc?.*key=([^#?&+]+)[^#]*(#gid=([\d]+).*)?/,
    out = {key: '', sheet: 0}
  ;
  if (!url) {
    return out;
  }

  var matches = url.match(regex);
  if (!!matches) {
    out.key = matches[1];
    out.sheet = parseInt(matches[3]);
    if (isNaN(out.sheet)) {
      out.sheet = 0;
    }
  }
  return out;
};


var getCsvUrlForGoogleSheet = function (url) {
  var info = parseSpreadsheetUrl(url);
  // not a google spreadsheet url
  // (may already be in csv format ... or o/w a url elsewhere)
  if (info.key.length === 0) {
    return url;
  } else {
    return _getCsvForGoogleSheet(info);
  }
};


var getSpreadSheetPage = function (params) {
  var result = false;
  var key = params['key'];
  var sheet = params['index'];
  result = _getCsvForGoogleSheet({
    key: key,
    sheet: sheet
  });

  return result;
};


var _getCsvForGoogleSheet = function(info) {
  var tmpl = 'https://docs.google.com/spreadsheet/pub?key=KEY&single=true&gid=INDEX&output=csv';
  return tmpl
    .replace('KEY', info.key)
    .replace('INDEX', info.sheet)
    ;
};


// updates the value in config to be an array as a side effect
var convertToArray = function(config, key) {
  var val = config.get(key);
  if (_.isString(val)) {
    var array = val.trim().split(/[\s,]+/);
    config.set(key, array);
  }
}

var loadConfig = function (cb) {

  var configSheetInfo = exports.parseSpreadsheetUrl(config.get('configUrl'));
  var configCsvUrl = exports.getCsvUrlForGoogleSheet(config.get('configUrl'));

  getCsvData(configCsvUrl, function (err, data) {
    if (err) {
      cb(err);
      return
    }
    data.forEach(function (record) {
      config.set(record.key, record.value);
    });

    ['about_page', 'overview_page', 'faq_page', 'submit_page', 'review_page',
      'contribute_page', ].forEach(function (item) {
      if (config.get(item)) {
        var out = marked(config.get(item));
        config.set(item, out);
      }
    });
    cb(null);
  });
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
  cleanUpCommon: cleanUpCommon,
  loadConfig: loadConfig,
  getCsvUrlForGoogleSheet: getCsvUrlForGoogleSheet,
  parseSpreadsheetUrl: parseSpreadsheetUrl,
  getCsvData: getCsvData
};

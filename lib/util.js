var request = require('request')
  , csv = require('csv')
  , _ = require('underscore')
  , config = require('./config.js')
  , crypto = require('crypto')
  , Q = require('q')
  , marked = require('marked')
  , assert = require('assert')
  ;

// ========================================================
// Load functions
// ========================================================

// Load everything
exports.loadAll = function(db, cb) {
  return Q.nfcall(exports.loadConfig)
    .then(function() {
      return Q.nfcall(exports.loadFixedData, db)
     })
    .nodeify(cb)
    ;
};

// parse a google spreadsheet url returning key and sheet (index)
exports.parseSpreadsheetUrl = function(url) {
  var regex = /.*spreadsheet\/ccc?.*key=([^#?&+]+)[^#]*(#gid=([\d]+).*)?/,
    out = { key: '', sheet: 0 }
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
}

exports.getCsvUrlForGoogleSheet = function(url) {
  var info = exports.parseSpreadsheetUrl(url);
  // not a google spreadsheet url
  // (may already be in csv format ... or o/w a url elsewhere)
  if (info.key.length === 0) {
    return url;
  } else {
    return _getCsvForGoogleSheet(info);
  }
}

function _getCsvForGoogleSheet(info) {
  var tmpl = 'https://docs.google.com/spreadsheet/pub?key=KEY&single=true&gid=INDEX&output=csv';
  return tmpl
    .replace('KEY', info.key)
    .replace('INDEX', info.sheet)
    ;
}

// updates the value in config to be an array as a side effect
function convertToArray(config, key) {
    var val = config.get(key);
    if (_.isString(val)) {
      var array = val.trim().split(/[\s,]+/);
      config.set(key, array);
    }
}

exports.loadConfig = function(cb) {
  var configSheetInfo = exports.parseSpreadsheetUrl(config.get('configUrl'));
  var configCsvUrl = exports.getCsvUrlForGoogleSheet(config.get('configUrl'));
  exports.getCsvData(configCsvUrl, function(err, data) {
    if (err) {
      cb(err);
      return
    }
    data.forEach(function(record) {
      config.set(record.key, record.value);
    });
    var dbsheet = config.get('database');
    var out = exports.parseSpreadsheetUrl(dbsheet);
    assert(out.key.length > 0, 'The current database configuration value <<XX>> is not a valid spreadsheet url'.replace('XX', dbsheet));
    config.set('database_spreadsheet_key', out.key);
    convertToArray(config, 'reviewers');
    convertToArray(config, 'locales');
    config.set('submissions',
      _getCsvForGoogleSheet({
        key: config.get('database_spreadsheet_key'),
        sheet: 0
      })
    );
    config.set('entries',
      _getCsvForGoogleSheet({
        key: config.get('database_spreadsheet_key'),
        sheet: 1
      })
    );
    // if places not explicitly set let's set to sheet next to config spreadsheet
    if (!config.get('places')) {
      var places = _getCsvForGoogleSheet({
        key: configSheetInfo.key,
        sheet: configSheetInfo.sheet + 1
      });
      config.set('places', places);
    }
    config.set('places', exports.getCsvUrlForGoogleSheet(config.get('places')));
    config.set('datasets', exports.getCsvUrlForGoogleSheet(config.get('datasets')));
    config.set('questions', exports.getCsvUrlForGoogleSheet(config.get('questions')));

    [ 'about_page', 'overview_page', 'faq_page', 'submit_page', 'review_page' ].forEach(function(item) {
      if (config.get(item)) {
        var out = marked(config.get(item));
        config.set(item, out);
      }
    });
    cb(null);
  });
};

// Load common, fixed data (datasets, questions)
exports.loadFixedData = function(db, cb) {
  return Q.nfcall(_loadQuestions, db)
    .then(function() {
      return Q.nfcall(_loadDatasets, db)
    })
    .then(function() {
      return Q.nfcall(_loadPlaces, db)
    })
    .nodeify(cb)
    ;
};

var _loadQuestions = function (db, callback) {
  exports.getCsvData(config.get('questions'), function(err, data) {
    db.questions = data;
    // scored questions are those with a score > 0
    db.scoredQuestions = _.filter(db.questions, function(qu) {
      return (parseInt(qu.score) > 0)
    });
    db.questionsById = _.object(_.pluck(db.questions, 'id'), db.questions);

    callback();
  });
};

_loadDatasets = function (db, callback) {
  exports.getCsvData(config.get('datasets'), function(err, data) {
    db.datasets = data;
    db.datasetsById = _.object(_.pluck(db.datasets, 'id'), db.datasets);
    callback();
  });
};

_loadPlaces = function (db, callback) {
  exports.getCsvData(config.get('places'), function(err, data) {
    db.places = data.map(function(row) {
      row.id = row.id.toLowerCase();
      return row;
    });
    db.placesById = _.object(_.pluck(db.places, 'id'), db.places);
    callback();
  });
};

// ========================================================
// General Utilities
// ========================================================

exports.getCsvData = function(url, cb) {
  var data = [];
  // a simpler and better approach is to do
  // csv().from.stream(request.get(url))
  // however we need to stub for tests and csv files are small so not a biggie
  request.get(url, function(err, res, body) {
    csv()
      .from.string(body,
          {columns: true})
      .on('record', function(record, idx) {
        // csv parser bug (IMO) - if just one row in CSV we don't get passed a
        // hash but just an array
        if (record instanceof Array) return;

        // lower case all keys
        for (key in record) {
          record[key.toLowerCase()] = record[key];
          if (key.toLowerCase() != key) {
            delete record[key];
          }
        }
        // weird issues with google docs and newlines resulted in some records getting "wrapped"
        if (record.dataset && record.dataset.indexOf('http') != -1) {
          console.error('bad');
          console.error(record);
        }
        data.push(record);
      })
      .on('end', function() {
        cb(null, data);
      })
      ;
  });
}


// make a nicer user object from profile object returned by passportjs
exports.makeUserObject = function(profile) {
  var email = (_.first(profile.emails) || {}).value; // allow for falsey "emails"
  var userobj = {
    userid: profile.provider + ':' + profile.id,
    providerid: profile.id,
    provider: profile.provider,
    username: profile.username,
    name: profile.displayName,
    email: email
  };
  if (profile.name) {
    userobj.givenname = profile.name.givenName;
    userobj.familyname = profile.name.familyName;
  }
  if (profile._json) {
    userobj.photo = profile._json.picture;
    userobj.homepage = profile._json.link;
  }
  var md5sum = crypto.createHash('md5');
  if (email) {
    md5sum.update(email.toLowerCase());
  } else {
    md5sum.update('anon@okfn.org');
  }

  userobj.gravatar = 'https://www.gravatar.com/avatar/' + md5sum.digest('hex') + '.jpg?d=identicon';
  return userobj;
}

// ========================================================
// Misc Load Helpers
// ========================================================


// TODO: filter out records where dataset not in our dataset list
// TODo: ensure we only have one record (latest one) for each place+dataset
exports.cleanUpCommon = function(db, records) {
  var correcter = {
    'yes': 'Y',
    'yes ': 'Y',
    'no': 'N',
    'no ': 'N',
    'unsure': '?'
  };
  var out = records.map(function(record) {
    // fix up y/n
    db.scoredQuestions.forEach(function(qu) {
      if (qu.id in record && record[qu.id].toLowerCase() in correcter) {
        record[qu.id] = correcter[record[qu.id].toLowerCase()]
      }
    });
    if (record.place != record.place.toLowerCase()) {
      console.warn('place attribute on record is not lower case')
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
}

// data keyed by place then dataset
// {
//   'United Kingdom': {
//      datasets: ...
//      score:
//      iso: ...
//     }
exports.byPlace = function(places, results, datasets) {
  var out = {};
  _.each(places, function(place) {
    out[place.id] = {
      datasets: {},
      score: 0
    }
  });
  _.each(results, function(row) {
    if (!(row.place in out)) {
      console.error('ERROR: found row with place not in our places list. Place is ' + row.place + ' full row info is:');
      console.log(row);
      return;
    }
    out[row.place].datasets[row.dataset] = row;
    // due to dupes cannot do this
    // out[row.place].score = out[row.place].score + row.ycount;
  });
  // avoid dupes
  _.each(places, function(place) {
    var score = 0;
    var totalopen = 0;
    _.each(out[place.id].datasets, function(record) {
      score += record.ycount;
      if (record.isopen) {
        totalopen += 1;
      }
    });
    out[place.id].score = score;
    out[place.id].totalopen = totalopen;
  });
  return out;
}

exports.getSummaryData = function(results) {
  var open = 0;
  var nokpercent = 0;
  _.each(results, function (r) {
    if (r.isopen) {
      open++;
    }
  });
  nokpercent = Math.round(100 * open / results.length);
  return {
    entries: results.length,
    open: open,
    open_percent: nokpercent
  };
};

exports.scoreOpenness = function(db, response) {
  var score = 0;
  db.questions.forEach(function(qu) {
    // TODO: normalize on Y or Yes
    if (response[qu.id]=='Y' || response[qu.id]=='Yes' && qu.score) {
      score += parseInt(qu.score);
    }
  });
  return score;
}

exports.markupRows = function(datasets) {
  return _.map(datasets, function(dataset) {
    return exports.markup(dataset);
  });
};

exports.markup = function(dataset) {
  dataset.description = marked(dataset.description || '');
  dataset.long_description = marked(dataset.long_description || '');
  return dataset;
};

exports.translateRows = function(rows, lang) {
  return _.map(rows, function(row) {
    return exports.translate(row, lang);
  });
};

exports.translateObject = function(obj, lang) {
  return _.reduce(obj, function(memo, val, key) {
    memo[key] = exports.translate(val, lang);

    return memo;
  }, {});
};

exports.translate = function(obj, lang) {
  return _.reduce(obj, function(memo, val, key) {
    if (key.indexOf('@') < 0) { // no @ symbol
      if (_.isString(val)) {
        memo[key] = translateKey(obj, key, lang);
      } else {
        memo[key] = val;
      }
    }
    return memo;
  }, {});
}

function translateKey(obj, key, lang) {
  // because english columns don't have @{LANG} suffix
  if (lang == 'en') {
    return obj[key];
  }

  var defaultLocale = _.first(config.get('locales'));

  return obj[key + '@' + lang] || obj[key + '@' + defaultLocale] || obj[key]; // foo@lang > foo@default-lang > foo
}

var request = require('request')
  , csv = require('csv')
  , _ = require('underscore')
  , config = require('./config.js')
  , crypto = require('crypto')
  , Q = require('q')
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
    .then(function() {
      return Q.nfcall(exports.loadSubmittedDataInBulk, db)
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
    var reviewers = config.get('reviewers');
    if (typeof(reviewers) === 'string') {
      var reviewers = config.get('reviewers').split(/[\s,]+/);
    }
    config.set('reviewers', reviewers);
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

exports.loadSubmittedDataInBulk = function(db, cb) {
  return Q.all([
      Q.nfcall(_loadResults, db),
      Q.nfcall(_loadCountrySubmissions, db)
    ])
    .nodeify(cb)
    ;
}

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
    var dss = data;
    dss = dss.map(function(ds) {
      ds.titleRotated = _uglySpaceHack(ds.title);
      return ds;
    });
    db.datasets = dss;
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

var _loadResults = function (db, callback) {
  exports.getCsvData(config.get('entries'), function(err, data) {
    var results = cleanUpCommon(db, data);
    var entries = {};
    entries.results = results;
    addUrlsToEntries(entries.results);
    entries.byplace = byPlace(db.places, results);
    entries.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));
    // Presort places by score, descending
    entries.places.sort(function (a, b) {
      return entries.byplace[b].score - entries.byplace[a].score;
    });
    var summary = getSummaryData(results);
    summary.places = entries.places.length;
    summary.maxScorePerRecord = 10;
    // 10 = no of datasets (would use datasets.length but due to async may not have that data yet)
    summary.maxScorePerPlace = summary.maxScorePerRecord * 10;
    entries.summary = summary;

    db.entries = entries;

    callback(err);
  });
};

_loadCountrySubmissions = function (db, callback) {
  //Get the submissions, simpler as we only need the data
  exports.getCsvData(config.get('submissions'), function(err, data) {
    var results = cleanUpCommon(db, data);
    db.submissions = {};
    db.submissions.results = results;
    db.submissions.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));

    db.submissions.reviewersByPlace = [];

//    var reviewers = _.sortBy(
//      _.reject(_.uniq(_.map(results, function(r) {
//          if (db.submissions.reviewersByPlace[r['place']]) {
//              if (!_.contains(db.submissions.reviewersByPlace[r['place']], r['reviewer'].trim()) && r['reviewer'].trim() !== "") db.submissions.reviewersByPlace[r['place']].push(r['reviewer'].trim());
//          }
//          else if (r['reviewer'].trim() !== "") {
//              db.submissions.reviewersByPlace[r['place']] = [];
//              db.submissions.reviewersByPlace[r['place']].push(r['reviewer'].trim());
//          }
//          return r['reviewer'].trim();
//        })), function(val) {
//        return (val==="");
//      }),
//      function (val) {return val;}
//    );
//
//    db.submissions.reviewers = reviewers;
    db.submissions.reviewers = [];

//    db.submissions.submittersByPlace = [];
//    var submitters = _.sortBy(_.reject(_.uniq(_.map(results, function(r) {
//        if (db.submissions.submittersByPlace[r['place']]) {
//            if (!_.contains(db.submissions.submittersByPlace[r['place']], r['submitter'].trim()) && r['submitter'].trim() !== "") db.submissions.submittersByPlace[r['place']].push(r['submitter'].trim());
//        }
//        else if (r['submitter'].trim() !== "") {
//            db.submissions.submittersByPlace[r['place']] = [];
//            db.submissions.submittersByPlace[r['place']].push(r['submitter'].trim());
//        }
//        return r['submitter'].trim();
//      })), function(val) {
//      return (val==="");
//    }), function (val) {return val;});

    db.submissions.submitters = [];

    db.submissions.byplace = byPlace(db.places, results);
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
  var userobj = {
    userid: profile.provider + ':' + profile.id,
    providerid: profile.id,
    provider: profile.provider,
    username: profile.username,
    name: profile.displayName,
    email: profile.emails[0].value
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
  md5sum.update(userobj.email.toLowerCase());
  userobj.gravatar = 'https://www.gravatar.com/avatar/' + md5sum.digest('hex') + '.jpg';
  return userobj;
}

// ========================================================
// Misc Load Helpers
// ========================================================


// TODO: filter out records where dataset not in our dataset list
// TODo: ensure we only have one record (latest one) for each place+dataset
function cleanUpCommon(db, records) {
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
function byPlace(places, results, datasets) {
  var out = {};
  _.each(places, function(place) {
    out[place.id] = {
      datasets: {},
      score: 0
    }
  });
  _.each(results, function(row) {
    if (!(row.place in out)) {
      console.error(row);
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

getSummaryData = function(results) {
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

// addUrlsToEntries - add helper URLs to an array of entry objects
function addUrlsToEntries (entries) {
  entries.forEach(function (entry) {
    var place = encodeURIComponent(entry.place);
    var dataset = encodeURIComponent(entry.dataset);
    entry.details_url = '/entry/' + place + '/' + dataset;
  });
}

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

var _uglySpaceHack = function(name){
  /* Why? Rotated Heading Cells are hard. */
  var parts = name.split(' ');
  if (parts.length === 3) {
    return parts[0] + ' ' + parts.slice(1).join('&nbsp;');
  } else if (parts.length === 4) {
    return parts.slice(0, 2).join('&nbsp;'); + ' ' + parts.slice(2).join('&nbsp;');
  }
  return name;
}


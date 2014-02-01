var request = require('request')
  , csv = require('csv')
  , _ = require('underscore')
  , config = require('./config.js')
  , Q = require('q')
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

exports.loadConfig = function(cb) {
  exports.getCsvData(config.get('configUrl'), function(err, data) {
    if (err) {
      cb(err);
      return
    }
    data.forEach(function(record) {
      config.set(record.key, record.value);
    });
    config.set('resultsUrl',
      'https://docs.google.com/spreadsheet/pub?key=KEY&single=true&gid=1&output=csv'.replace(
        'KEY', config.get('database_spreadsheet_key')
      )
    )
    config.set('submissionsUrl',
      'https://docs.google.com/spreadsheet/pub?key=KEY&single=true&gid=0&output=csv'.replace(
        'KEY', config.get('database_spreadsheet_key')
      )
    )
    cb(null);
  });
};

// Load common, fixed data (datasets, questions)
exports.loadFixedData = function(db, cb) {
  return Q.nfcall(_loadQuestions, db)
    .then(function() {
      return Q.nfcall(_loadDatasets, db)
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
  exports.getCsvData(config.get('questionsUrl'), function(err, data) {
    db.questions = data;
    callback();
  });
};

_loadDatasets = function (db, callback) {
  exports.getCsvData(config.get('datasetsUrl'), function(err, data) {
    var dss = data.slice(0,10);
    dss = dss.map(function(ds) {
      ds.titleRotated = _uglySpaceHack(ds.title);
      return ds;
    });
    db.datasets = dss;
    callback();
  });
};

var _loadResults = function (db, callback) {
  exports.getCsvData(config.get('resultsUrl'), function(err, data) {
    var results = cleanUpCommon(db, data);
    var entries = {};
    entries.results = results;
    addUrlsToEntries(entries.results);
    entries.byplace = byPlace(results);
    entries.bydataset = byDataset(db, results);
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
  exports.getCsvData(config.get('submissionsUrl'), function(err, data) {
    var results = cleanUpCommon(db, data);
    db.submissions = {};
    db.submissions.results = results;
    db.submissions.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));

    db.submissions.reviewersByPlace = [];

    var reviewers = _.sortBy(
      _.reject(_.uniq(_.map(results, function(r) {
          if (db.submissions.reviewersByPlace[r['place']]) {
              if (!_.contains(db.submissions.reviewersByPlace[r['place']], r['reviewer'].trim()) && r['reviewer'].trim() !== "") db.submissions.reviewersByPlace[r['place']].push(r['reviewer'].trim());
          }
          else if (r['reviewer'].trim() !== "") {
              db.submissions.reviewersByPlace[r['place']] = [];
              db.submissions.reviewersByPlace[r['place']].push(r['reviewer'].trim());
          }
          return r['reviewer'].trim();
        })), function(val) {
        return (val==="");
      }),
      function (val) {return val;}
    );

    db.submissions.reviewers = reviewers;

    db.submissions.submittersByPlace = [];
    var submitters = _.sortBy(_.reject(_.uniq(_.map(results, function(r) {
        if (db.submissions.submittersByPlace[r['place']]) {
            if (!_.contains(db.submissions.submittersByPlace[r['place']], r['submitter'].trim()) && r['submitter'].trim() !== "") db.submissions.submittersByPlace[r['place']].push(r['submitter'].trim());
        }
        else if (r['submitter'].trim() !== "") {
            db.submissions.submittersByPlace[r['place']] = [];
            db.submissions.submittersByPlace[r['place']].push(r['submitter'].trim());
        }
        return r['submitter'].trim();
      })), function(val) {
      return (val==="");
    }), function (val) {return val;});

    db.submissions.submitters = submitters;

    db.submissions.byplace = byPlace(results);
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
    Object.keys(record).forEach(function(question) {
      if (record[question].toLowerCase() in correcter) {
        record[question] = correcter[record[question].toLowerCase()]
      }
    });
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

// data keyed by dataset then country
function byDataset(db, data) {
  var datasets = {};
  var countryNames = _.uniq(_.map(data, function(r) {
    return r['place'];
  }));
  function makeCountryDict () {
    var _out = {};
    _.each(countryNames, function(ds) {
      _out[ds] = null;
    });
    return _out;
  }
  _.each(data, function(row) {
      datasets[row['dataset']] = makeCountryDict();
  });
  //Arrange by dataset
  _.each(data, function(row) {
    var c = row['place'];
    var d = row['dataset'];
    datasets[d][c] = row;
  });

  //Sort each dataset
  var sorteddatasets = {};

  var datasetIds = _.pluck(db.datasets, 'id');
  _.each(datasetIds, function(datasetname) {
    sorteddatasets[datasetname] = _.sortBy(datasets[datasetname], function(val) {
      if (val) {
        return 100 - val['ycount'];
      }
      else return 100;
    });
  });

  return sorteddatasets;
}

// data keyed by place then dataset
// {
//   'United Kingdom': {
//      datasets: ...
//      score:
//      iso: ...
//     }
function byPlace(results, datasets) {
  var out = {};
  var places = _.uniq(_.map(results, function(r) {
    return r['place'];
  }));
  _.each(places, function(place) {
    out[place] = {
      datasets: {},
      score: 0
    }
  });
  _.each(results, function(row) {
    out[row.place].datasets[row.dataset] = row;
    // due to dupes cannot do this
    // out[row.place].score = out[row.place].score + row.ycount;
  });
  // avoid dupes
  _.each(places, function(place) {
    var score = 0;
    var totalopen = 0;
    _.each(out[place].datasets, function(record) {
      score += record.ycount;
      if (record.isopen) {
        totalopen += 1;
      }
    });
    out[place].score = score;
    out[place].totalopen = totalopen;
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
    entry.details_url = '/country/' + place + '/' + dataset + '/';
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


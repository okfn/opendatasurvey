var _ = require('underscore')
  , config = require('./config.js')
  , request = require('request')
  , csv = require('csv')
  , GoogleSpreadsheet = require('google-spreadsheet')
  , Q = require('q')

  , util = require('./util.js')
  ;

var OpenDataCensus = {};

// ========================================================
// Backend and Domain Model / Data Access Objects + Logic
// ========================================================

// Backend
// ========================================================

var Backend = function(options) {
  this.options = _.extend({}, {
      user: config.get('google:user'),
      password: config.get('google:password'),
      key: config.get('database_spreadsheet_key'),
      censusid: null
    },
    options
    );
  this.options.submissionIndex = 1;
  this.options.entryIndex = 2;
  // different spreadsheet
  this.options.userIndex = 1;
  this.sheet = new GoogleSpreadsheet(this.options.key);
}

Backend.prototype.login = function(cb) {
  this.sheet.setAuth(this.options.user, this.options.password, cb);
};

Backend.prototype.get = function(tableidx, data, cb) {
  this.select(tableidx, data, function(err, rows) {
    if (err) {
      cb(err);
      return;
    }
    if (rows.length === 0) {
      cb(null, null);
    } else if (rows.length === 1) {
      cb(null, rows[0])
    } else { // should not happen
      cb({message: 'Found more than one entry for query: ' + JSON.stringify(data)}, rows[0]);
    }
  });
}

Backend.prototype.select = function(tableidx, query, cb) {
  var gquery = {}
  if (this.options.censusid) {
    query.censusid = this.options.censusid;
  }

  var tmp = _.map(query, function(val, key) {
    var selector;

    // Mongo "ish" querying
    if (_.isObject(val)) {
      selector = _.first(_.keys(val)); // always first key
      val = val[selector];
    }

    selector = selector || '=';

    return key + selector + '"' + val + '"';
  });

  gquery.sq = tmp.join(' and ');
  this.sheet.getRows(tableidx, {}, gquery, cb);
};

Backend.prototype.insert = function(tableidx, data, cb) {
  if (this.options.censusid) {
    data.censusid = this.options.censusid;
  }
  this.sheet.addRow(tableidx, data, cb);
};

Backend.prototype.update = function(tableidx, idInfo, newData, cb) {
  this.get(tableidx, idInfo, function(err, obj) {
    if (err) {
      cb(err);
      return;
    }
    var obj = _.extend(obj, newData);
    obj.save(function(err) {
      cb(err);
    });
  });
};

Backend.prototype.deleteAll = function(tableIdx, query, cb) {
  var count = 1;
  function complete() {
    count--;
    if (count === 0) cb();
  }
  if (this.options.censusid) {
    query.censusid = this.options.censusid;
  }
  this.select(tableIdx, query, function(err, rows) {
    count += rows.length;
    complete();
    rows.forEach(function(entry) {
      entry.del(function(err) {
        if(err) {
          console.log(err);
        }
        complete();
      });
    });
  });
};

// User stuff
// ========================================================

Backend.prototype.getUser = function(data, cb) {
  var queryInfo = {
    userid: data.userid
  };
  this.get(this.options.userIndex, queryInfo, cb);
};

Backend.prototype.createUserIfNotExists = function(userobj, cb) {
  var self = this;
  var tableidx = this.options.userIndex;
  this.get(tableidx, {userid: userobj.userid}, function(err, obj) {
    if (err) {
      cb(err);
    } else if (obj === null) {
      self.insert(tableidx, userobj, cb);
    }
    else { // already exists so nothing to do
      cb(null);
    }
  });
};

// Entry stuff
// ========================================================

Backend.prototype.getEntry = function(data, cb) {
  var queryInfo = {
    place: data.place,
    year: data.year || config.get('display_year'),
    dataset: data.dataset
  };
  this.get(this.options.entryIndex, queryInfo, cb);
};

Backend.prototype.getEntrys = function(query, cb) {
  this.select(this.options.entryIndex, query, cb);
};

Backend.prototype.insertEntry = function(data, cb) {
  var self = this;
  data.timestamp = timestamp();
  this.insert(this.options.entryIndex, data, function(err) {
    if (err) {
      cb(err);
      return;
    }
    // now update cached data for front page ...
    self.getAllEntrysWithInfo(OpenDataCensus.data, function(err) {
      cb(err);
    });
  });
};

Backend.prototype.updateEntry = function(idInfo, data, cb) {
  var self = this;
  data.timestamp = timestamp();
  this.update(this.options.entryIndex, idInfo, data, function(err) {
    if (err) {
      cb(err);
      return;
    }
    // now update cached data for front page ...
    self.getAllEntrysWithInfo(OpenDataCensus.data, function(err) {
      cb(err);
    });
  });
};

// Submissions stuff
// ========================================================

Backend.prototype.getSubmission = function(data, cb) {
  if (! 'submissionid' in data) {
    cb({messsage: 'Need a submissionid to look up a submission'});
  } else {
    this.get(this.options.submissionIndex, {submissionid: data.submissionid}, cb);
  }
};

Backend.prototype.getSubmissions = function(query, cb) {
  this.select(this.options.submissionIndex, query, cb);
};

Backend.prototype.insertSubmission = function(data, user, cb) {
  var self = this;

  if (!data.submissionid) {
    data.submissionid = uuid();
  }
  if (user) {
    data.submitter = user.name;
    data.submitterid = user.userid;
  }
  data.timestamp = timestamp();
  self.getEntry(data, function(err, entry) {
    self.insert(self.options.submissionIndex, data, function(err) {
      if (err) return cb(err);

      if (entry || config.get('approve_first_submission') === 'TRUE') {
        cb(null, data);
      } else {
        accept(data, cb);
      }
    });
  });

  function accept(data, cb) {
    self.getSubmission(data, function(err, submission) {
      if (err) return cb(err);

      self.acceptSubmission(submission, {}, function(err) {
        data.reviewed = true; // set flag so message can be updated
        cb(err, data);
      });
    });
  }
};

Backend.prototype.updateSubmission = function(idInfo, data, cb) {
  this.update(this.options.submissionIndex, idInfo, data, cb);
};

// from https://gist.github.com/LeverOne/1308368
function uuid(a,b // placeholders
  ) {
  for(               // loop :)
      b=a='';        // b - result , a - numeric variable
      a++<36;        //
      b+=a*51&52  // if "a" is not 9 or 14 or 19 or 24
                  ?  //  return a random number or 4
         (
           a^15      // if "a" is not 15
              ?      // genetate a random number from 0 to 15
           8^Math.random()*
           (a^20?16:4)  // unless "a" is 20, in which case a random number from 8 to 11
              :
           4            //  otherwise 4
           ).toString(16)
                  :
         '-'            //  in other cases (if "a" is 9,14,19,24) insert "-"
      );
  return b
}

// get (unreviewed) submissions and entries for a given place
//
// @return: (callback)
Backend.prototype.getPlace = function(place, year, cb) {
  var self = this;
  if (arguments.length = 2) {
    cb = year;
    year = config.get('display_year');
  }
  Q.all([
    Q.ninvoke(self, 'getSubmissions', {
      place: place,
      year: year,
      reviewed: ''
    }),
    Q.ninvoke(self, 'getEntrys', {
      place: place,
      year: {
        '<=': year
      }
    })
  ])
  .catch(function (err) { cb(err); })
  .done(function (results) {
    cb(null, {submissions: results[0], entrys: results[1]});
  });
};

// Reviewing process
// ========================================================

// process a review of a submission
//
// user is a user object with at least userid, name
// acceptSubmission: boolean indicating whether to accept or reject
// submissionid - submission to accept
// reviewData - object representing reviewed data to go on entry
Backend.prototype.processSubmission = function(user, acceptSubmission, submissionid, reviewData, callback) {
  var self = this;
  this.getSubmission({
    submissionid: submissionid
    }, function(err, submission) {
      if (err) {
        callback({code: 500, rawerror: err, message: 'Error ' + err});
        return;
      } else if (!submission) {
        callback({code: 404, message: 'No submission found for that info'});
        return;
      } else {
        processSubmission(submission);
      }
    }
  );

  function processSubmission(submission) {
    submission.reviewer = user.name;
    submission.reviewerid = user.userid;
    if (acceptSubmission) {
      submission.reviewresult = 'accepted';
      self.acceptSubmission(submission, reviewData, callback);
    } else {
      submission.reviewresult = 'rejected';
      self.markSubmissionAsReviewed(submission, callback);
    }
  }
}

// Accept a submission
//
// make it into the current Entry
// mark as accepted
Backend.prototype.acceptSubmission = function(submission, newdata, cb) {
  var self = this;
  // check if an existing entry
  this.getEntry(submission, function(err, entry) {
    // TODO: handle errors ...

    var keysToCopyOver = ['year', 'place', 'dataset'].concat(
      _.pluck(OpenDataCensus.data.questions, 'id')
    );
    // no existing entry
    if (!entry) {
      // copy over data to new entry
      var entry = {};
      _.each(keysToCopyOver, function(key) {
        entry[key] = submission[key];
      });
      // copy over new data
      _.each(keysToCopyOver, function(key) {
        if (key in newdata) {
          entry[key] = newdata[key];
        }
      });
      self.insertEntry(entry, onEntryUpdate);
    } else { // existing entry
      // copy over new data
      _.each(keysToCopyOver, function(key) {
        if (key in newdata) {
          entry[key] = newdata[key];
        }
      });
      entry.save(onEntryUpdate);
    }
  })

  function onEntryUpdate(err) {
    // TODO: need to think more carefully here about what has happened
    if (err) {
      console.error(err);
      cb(err);
    } else {
      // set on incoming
      // submission.reviewresult = 'accepted';
      // submission.reviewer = ...
      self.markSubmissionAsReviewed(submission, cb);
    }
  }
}

Backend.prototype.markSubmissionAsReviewed = function(submission, cb) {
  submission.reviewed = 1;
  submission.reviewtimestamp = timestamp();
  submission.save(cb);
}

// get all the entries will additional info
Backend.prototype.getAllEntrysWithInfo = function(db, callback) {
  this.getEntrys({}, function(err, data) {
    var results = util.cleanUpCommon(db, data);
    var entries = {};
    entries.results = results;
    entries.results.forEach(function (entry) {
      var place = encodeURIComponent(entry.place);
      var dataset = encodeURIComponent(entry.dataset);
      entry.details_url = '/entry/' + place + '/' + dataset;
    });
    entries.byplace = util.byPlace(db.places, results);
    entries.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));
    // Presort places by score, descending
    entries.places.sort(function (a, b) {
      return entries.byplace[b].score - entries.byplace[a].score;
    });
    var summary = util.getSummaryData(results);
    summary.places = entries.places.length;
    entries.summary = summary;

    db.entries = entries;

    callback(err);
  });
};

function timestamp() {
  var d = new Date();
  return d.toISOString();
}

// OpenDataCensus.data is an object for caching data
// both "fixed" data (questions, datasets, places)
// and submitted data (from CSV files in G
// spreadsheets)
// We are gradually refactoring to cache less of submitted data and load more directly
var OpenDataCensus = {
  data: {
    datasets: [],
    questions: [],
    entries: {}
  }
}

OpenDataCensus.load = function(cb) {
  util.loadAll(OpenDataCensus.data, function(err) {
    if (err) {
      console.log('Failed to load basic info');
      console.error(err);
      cb(err);
      return;
    }
    // backend needs the config to be loaded
    OpenDataCensus.backend = new Backend({
      censusid: config.get('censusid')
    });
    OpenDataCensus.backend.login(function(err) {
      if (err) {
        console.error('Failed to login to primary database');
        cb(err);
        return;
      }
      console.log('Logged in to primary database OK');
      OpenDataCensus.backend.getAllEntrysWithInfo(OpenDataCensus.data, function(err) {
        if (config.get('user_database_key')) {
          console.log('Enabling user database');
          OpenDataCensus.backendUser = new Backend({
            key: config.get('user_database_key')
          });
          OpenDataCensus.backendUser.login(cb);
        } else {
          cb();
        }
      });
    });
  });
}

exports.OpenDataCensus = OpenDataCensus;
exports.Backend = Backend;


var _ = require('underscore')
  , config = require('./config.js')
  , request = require('request')
  , csv = require('csv')
  , GoogleSpreadsheet = require('google-spreadsheet')
  , Q = require('q')

  , util = require('./util.js')
  ;

var OpenDataCensus = {};

OpenDataCensus.DEFAULT_YEAR = 2013;

// ========================================================
// Enumerations and Settings
// ========================================================

OpenDataCensus.questions =  [
  'timestamp',
  'year',
  'place',
  'dataset',
  'exists',
  'digital',
  'public',
  'free',
  'online',
  'machinereadable',
  'bulk',
  'openlicense',
  'uptodate',
  'url',
  'dateavailable',
  'format',
  'details',
  'submitter',
  'submitterurl',
  'submitteremail'
];

var openQuestions = OpenDataCensus.questions.slice(4,13);
OpenDataCensus.openQuestions = openQuestions;

OpenDataCensus.data = {
  questions: [],
  country: {
    //What is the year for which we are collecting data?
    currentYear: config.get('database:country:currentYear'),
    // dataset info looks like
    //
    //  { id: 'energy',
    //    title: 'Energy Consumption ',
    //    category: 'Energy',
    //    description: 'Real time usage of energy in city and trends over time.',
    //    ...
    //  }
    // basically dataset info from https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc#gid=0
    // cleaned up
    datasets: [],
    // array of hashes each hash having question keys
    // this is basically the raw results with some cleanup
    results: [],
    // see the docs on byPlace function below
    byplace: {},
    bydataset: {}
  },
  countrysubmissions: {
    // array of hashes each hash having question keys
    // this is basically the raw results with some cleanup
    results: [],
    // see the docs on byPlace function below
    byplace: {}
  }
}

// ========================================================
// Backend and Domain Model / Data Access Objects + Logic
// ========================================================

// Backend
// ========================================================

var Backend = function(options) {
  this.options = _.extend({}, {
      user: config.get('google:user'),
      password: config.get('google:password'),
      key: config.get('database_spreadsheet_key')
    },
    options
    );
  this.options.submissionIndex = 1;
  this.options.entryIndex = 2;
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
  var tmp = [];
  Object.keys(query).forEach(function(key) {
    tmp.push(key + '="' + query[key] + '"');
  });
  gquery.sq = tmp.join(' and ');
  this.sheet.getRows(tableidx, {}, gquery, cb);
};

Backend.prototype.insert = function(tableidx, data, cb) {
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

// Entry stuff
// ========================================================

Backend.prototype.getEntry = function(data, cb) {
  var queryInfo = {
    place: data.place,
    year: data.year || OpenDataCensus.DEFAULT_YEAR,
    dataset: data.dataset
  };
  this.get(this.options.entryIndex, queryInfo, cb);
};

Backend.prototype.getEntrys = function(query, cb) {
  this.select(this.options.entryIndex, query, cb);
};

Backend.prototype.insertEntry = function(data, cb) {
  // todo: set timestamp
  this.insert(this.options.entryIndex, data, cb);
};

Backend.prototype.updateEntry = function(idInfo, data, cb) {
  this.update(this.options.entryIndex, idInfo, data, cb);
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

Backend.prototype.insertSubmission = function(data, cb) {
  if (!data.submissionid) {
    data.submissionid = uuid();
  }
  var d = new Date();
  data.timestamp = d.toISOString();
  this.insert(this.options.submissionIndex, data, function(err) {
    cb(err, data);
  });
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
    year = OpenDataCensus.DEFAULT_YEAR;
  }
  Q.all([
    Q.ninvoke(self, 'getSubmissions', {place: place, year: year, reviewed: ''}),
    Q.ninvoke(self, 'getEntrys', {place: place, year: year})
  ])
  .catch(function (err) { cb(err); })
  .done(function (results) {
    cb(null, {submissions: results[0], entrys: results[1]});
  });
};

// Reviewing process
// ========================================================

// Accept a submission
//
// make it into the current Entry
// mark as accepted
Backend.prototype.acceptSubmission = function(submission, newdata, cb) {
  var self = this;
  // check if an existing entry
  this.getEntry(submission, function(err, entry) {
    // TODO: handle errors ...

    // no existing entry
    if (!entry) {
      // copy over data to new entry
      var entry = {};
      _.each(OpenDataCensus.questions.slice(0, 17), function(key) {
        entry[key] = submission[key];
      });
      // copy over new data
      _.each(OpenDataCensus.questions.slice(0, 17), function(key) {
        if (key in newdata) {
          entry[key] = newdata[key];
        }
      });
      self.insertEntry(entry, onEntryUpdate);
    } else { // existing entry
      // copy over new data
      _.each(OpenDataCensus.questions.slice(0, 17), function(key) {
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
      submission.reviewresult = 'accepted';
      //Reviewer name is not stored in entry, so need to do this explicitly as keys won't match above
      submission.reviewer = newdata.reviewername;
      self.markSubmissionAsReviewed(submission, cb);
    }
  }
}

Backend.prototype.markSubmissionAsReviewed = function(submission, cb) {
  submission.reviewed = 1;
  submission.reviewtimestamp = timestamp();
  submission.save(cb);
}

function timestamp() {
  var d = new Date();
  return d.toISOString();
}

// ========================================================
// Old Loading Code
// ========================================================

OpenDataCensus.load = function(cb) {
  util.loadAll(OpenDataCensus.data, function(err) {
    if (err) {
      console.error(err);
      cb(err);
      return;
    }
    // TODO: refactor code elsewhere do we don't need this
    // backwards compatability 
    OpenDataCensus.data.country = OpenDataCensus.data.entries;
    OpenDataCensus.data.countrysubmissions = OpenDataCensus.data.submissions;
    // backend needs the config to be loaded
    OpenDataCensus.backend = new Backend();
    cb(err);
  });
}

exports.OpenDataCensus = OpenDataCensus;
exports.Backend = Backend;


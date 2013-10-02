var _ = require('underscore')
  , config = require('./config.js')
  , request = require('request')
  , csv = require('csv')
  , GoogleSpreadsheet = require('google-spreadsheet')
  , async = require('async')
  ;

var OpenDataCensus = {};

OpenDataCensus.DEFAULT_YEAR = 2013;

// backwards compatibility
// at some point we'll load these differently
config.set('database:country:resultsUrl', 
  'https://docs.google.com/spreadsheet/pub?key=KEY&single=true&gid=1&output=csv'.replace(
    'KEY', config.get('database:country:spreadsheetKey')
  )
)
config.set('database:country:submissionsUrl',
  'https://docs.google.com/spreadsheet/pub?key=KEY&single=true&gid=0&output=csv'.replace(
    'KEY', config.get('database:country:spreadsheetKey')
  )
)

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

  OpenDataCensus.datasetNamesMap = {
    'elections' : 'Election Results (national)',
    'companies': 'Company Register',
    'map' : 'National Map (Low resolution: 1:250,000 or better)',
    'budget' : 'Government Budget (National, high level, not detailed)',
    'spending' : 'Government Spending (National, transactional level data)',
    'legislation' : 'Legislation (laws and statutes) - National',
    'statistics' : 'National Statistical Data (economic and demographic information)',
    'postcodes' : 'National Postcode/ZIP database',
    'timetables' : 'Public Transport Timetables',
    'emissions': 'Environmental Data on major sources of pollutants (e.g. location, emissions)'
  };
  
var openQuestions = OpenDataCensus.questions.slice(4,13);
OpenDataCensus.openQuestions = openQuestions;

OpenDataCensus.data = {
  questionsUrl: config.get('database:questionsUrl'),
  questions: [],
  country: {
    //What is the year for which we are collecting data?
    currentYear: config.get('database:country:currentYear'),
    // This is the list of datasets... i.e. a foreign field in the results table
    datasetsUrl: config.get('database:country:datasetsUrl'),
    // Submissions set
    resultsUrl: config.get('database:country:resultsUrl'),
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
    byplace: {}
  },
  countrysubmissions: {
    //This is the list of datasets... i.e. a foreign field in the results table
    datasetsUrl: config.get('database:country:datasetsUrl'),
    // Submissions set
    // must be the CSV file
    //The column titles are tied to the form. We have short form titles in the 2nd line to match the final results set TODO: Is that necessary?
    //TODO: Careful that column mismatches don't cause problems. Additions are usually made by specifying columns, so it shouldn't matter
    // resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc&single=true&gid=0&range=A2%3AP200000&output=csv', 
    // Do not use gid=0 for the moment as seems to have an issue
    resultsUrl: config.get('database:country:submissionsUrl'),
    
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
    byplace: {}
  },
  g8: {
    datasets: [],
    results: [],
    byplace: {}
  },
  city: {
    datasetsUrl: config.get('database:city:datasetsUrl'),
    resultsUrl: config.get('database:city:resultsUrl'),
    datasets: [],
    results: [],
    byplace: {}
  },
  catalogs: {
    // https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdE9POFhudGd6NFk0THpxR0NicFViRUE#gid=1
    url: "https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdE9POFhudGd6NFk0THpxR0NicFViRUE&single=true&gid=1&output=csv",
    records: [],
    fields: []
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
      key: config.get('database:country:spreadsheetKey')
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
  async.parallel({
      submissions: function(callback) {
        self.getSubmissions({place: place, year: year, reviewed: ''}, callback);
      },
      entrys: function(callback) {
        self.getEntrys({place: place, year: year}, callback);
      },
    },
    cb
  );
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
      self.markSubmissionAsReviewed(submission, cb);
    }
  }
}

Backend.prototype.markSubmissionAsReviewed = function(submission, cb) {
  submission.reviewed = 1;
  submission.reviewer = '';
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

function getCsvData(url, cb) {
  var data = [];
  csv()
    .from.stream(request(url),
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
      cb(data);
    })
    ;
}

OpenDataCensus.backend = new Backend();

OpenDataCensus.load = function(cb) {
  var count = 8;
  function done() {
    count -= 1;
    if (count == 0) {
      cb();
    }
  } 

  OpenDataCensus.backend.login(function(err) {
    if (err) {
      throw new Error('Failed to login to Database (Google Spreadsheet)');
    }
    done();
  });

  getCsvData(OpenDataCensus.data.questionsUrl, function(data) {
    OpenDataCensus.data.questions = data;
    done();
  });
    
  getCsvData(OpenDataCensus.data.country.datasetsUrl, function(data) {
    var dss = data.slice(0,10);
    dss = dss.map(function(ds) {
      ds.titleRotated = OpenDataCensus.uglySpaceHack(ds.title);
      return ds;
    });
    OpenDataCensus.data.country.datasets = dss;
    OpenDataCensus.data.g8.datasets = dss;
    done();
  });
  
  getCsvData(OpenDataCensus.data.country.resultsUrl, function(data) {
    var results = cleanUpCountry(data);
    OpenDataCensus.data.country.results = results;
    OpenDataCensus.data.country.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));
    OpenDataCensus.data.country.byplace = byPlace(results);
    var summary = getSummaryData(results);
    summary.places = OpenDataCensus.data.country.places.length;
    summary.maxScorePerRecord = openQuestions.length;
    // 10 = no of datasets (would use datasets.length but due to async may not have that data yet)
    summary.maxScorePerPlace = openQuestions.length * 10;
    OpenDataCensus.data.country.summary = summary;
  
    // now do g8
    var g8 = OpenDataCensus.data.g8;
    g8.results = _.filter(results, function(item) {
      return _.contains(g8Countries, item.place);
    });
    
    g8.places = g8Countries;
    g8.byplace = byPlace(g8.results);
    //console.log(g8.byplace);
    g8.summary = getSummaryData(g8.results);
    g8.summary.places = 8;
    g8.summary.maxScorePerRecord = openQuestions.length;
    g8.summary.maxScorePerPlace = openQuestions.length * 10;
    // hack - we don't dedupe in results yet
    g8.summary.entries = 80;

    done();
  });
  
  //Get the submissions, simpler as we only need the data
  getCsvData(OpenDataCensus.data.countrysubmissions.resultsUrl, function(data) {
    var results = cleanUpCountry(data);
    OpenDataCensus.data.countrysubmissions.results = results;
    OpenDataCensus.data.countrysubmissions.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));
    OpenDataCensus.data.countrysubmissions.byplace = byPlace(results);
    done();
  });
  
  getCsvData(OpenDataCensus.data.city.datasetsUrl, function(data) {
    var dss = data.slice(0,15);
    dss = dss.map(function(ds) {
      // TODO: remove this once fixed in the spreadsheet
      ds.title = ds.dataset;
      delete ds.dataset;
      ds.titleRotated = OpenDataCensus.uglySpaceHack(ds.title);
      return ds;
    });
    OpenDataCensus.data.city.datasets = dss;
    done();
  });
  getCsvData(OpenDataCensus.data.city.resultsUrl, function(data) {
    var results = cleanUpCity(data);
    var c = OpenDataCensus.data.city;
    c.results = results;
    c.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));
    c.byplace = byPlace(results);
    c.summary = getSummaryData(results);
    c.summary.places = c.places.length;
    c.summary.maxScorePerRecord = openQuestions.length;
    // 15 = no of datasets (would use datasets.length but due to async may not have that data yet)
    c.summary.maxScorePerPlace = openQuestions.length * 15;
    done();
  });
  getCsvData(OpenDataCensus.data.catalogs.url, function(data) {
    OpenDataCensus.data.catalogs.records = data;
    done();
  });
};

// TODO: dedupe etc
function cleanUpCountry(rawdata) {
  var out = rawdata.map(function(record) {
    return record;
  });
  out = cleanUpCommon(out);
  return out;
}

// TODO: filter out records where dataset not in our dataset list
// TODo: ensure we only have one record (latest one) for each place+dataset 
function cleanUpCommon(records) {
  var correcter = {
    'yes': 'Y',
    'yes ': 'Y',
    'no': 'N',
    'no ': 'N',
    'unsure': '?'
  };
  var ynquestions = OpenDataCensus.questions.slice(4, 13);
  var out = records.map(function(record) {
    // fix up y/n
    ynquestions.forEach(function(question) {
      
      if (record[question] == undefined) {
        // console.error('Bad y/n data');
        // console.error(record);
      }
      else record[question] = correcter[record[question].toLowerCase()]
      
    });
    record.ycount = scoreOpenness(record);
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

function cleanUpCity(records) {
  var out = records.map(function(record) {
    record.placeLong = record.place;
    // TODO: we will run into issues where we do have same first name
    // e.g. Cambridge (Mass) and Cambridge (UK)
    record.place = record.place.split(',')[0]
    return record;
  });
  var out = cleanUpCommon(out);
  return out;
}

// data keyed by dataset then country
function byDataset(data) {
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
  _.each(data, function(row) {
    var c = row['place'];
    var d = row['dataset'];
    datasets[d][c] = row;
  });

  return datasets;
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

function scoreOpenness(response) {
  var score=0;
  _.each(openQuestions, function(key) {
    if (response[key]=='Y') {
      score++;
    }
  });
  return score;
}

OpenDataCensus.uglySpaceHack = function(name){
  /* Why? Rotated Heading Cells are hard. */
  var parts = name.split(' ');
  if (parts.length === 3) {
    return parts[0] + ' ' + parts.slice(1).join('&nbsp;');
  } else if (parts.length === 4) {
    return parts.slice(0, 2).join('&nbsp;'); + ' ' + parts.slice(2).join('&nbsp;');
  }
  return name;
}

//OpenDataCensus.load(function() {});

exports.OpenDataCensus = OpenDataCensus;
exports.Backend = Backend;

OpenDataCensus.countryList = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "&Aring;land Islands",
  "American Samoa",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antarctica",
  "Antigua And Barbuda",
  "Argentina",
  "Armenia",
  "Aruba",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bermuda",
  "Bhutan",
  "Bolivia, Plurinational State Of",
  "Bonaire, Sint Eustatius And Saba",
  "Bosnia And Herzegovina",
  "Botswana",
  "Bouvet Island",
  "Brazil",
  "British Indian Ocean Territory",
  "Brunei Darussalam",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Cayman Islands",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Christmas Island",
  "Cocos (Keeling) Islands",
  "Colombia",
  "Comoros",
  "Congo",
  "Congo, The Democratic Republic Of The",
  "Cook Islands",
  "Costa Rica",
  "Country Name",
  "Croatia",
  "Cuba",
  "Cur&ccedil;ao",
  "Cyprus",
  "Czech Republic",
  "C&ocirc;te d'Ivoire",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Falkland Islands (Malvinas)",
  "Faroe Islands",
  "Fiji",
  "Finland",
  "France",
  "French Guiana",
  "French Polynesia",
  "French Southern Territories",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Greece",
  "Greenland",
  "Grenada",
  "Guadeloupe",
  "Guam",
  "Guatemala",
  "Guernsey",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Heard Island And Mcdonald Islands",
  "Holy See (Vatican City State)",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran, Islamic Republic Of",
  "Iraq",
  "Ireland",
  "Isle Of Man",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jersey",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea, Democratic People's Republic Of",
  "Korea, Republic Of",
  "Kuwait",
  "Kyrgyzstan",
  "Lao People's Democratic Republic",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macao",
  "Macedonia, The Former Yugoslav Republic Of",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Martinique",
  "Mauritania",
  "Mauritius",
  "Mayotte",
  "Mexico",
  "Micronesia, Federated States Of",
  "Moldova, Republic Of",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Montserrat",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Niue",
  "Norfolk Island",
  "Northern Mariana Islands",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestinian Territory, Occupied",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Pitcairn",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Romania",
  "Russian Federation",
  "Rwanda",
  "R&eacute;union",
  "Saint Barth&eacute;lemy",
  "Saint Helena, Ascension And Tristan Da Cunha",
  "Saint Kitts And Nevis",
  "Saint Lucia",
  "Saint Martin (French Part)",
  "Saint Pierre And Miquelon",
  "Saint Vincent And The Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome And Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Sint Maarten (Dutch Part)",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Georgia And The South Sandwich Islands",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Svalbard And Jan Mayen",
  "Swaziland",
  "Sweden",
  "Switzerland",
  "Syrian Arab Republic",
  "Taiwan R.O.C.",
  "Tajikistan",
  "Tanzania, United Republic Of",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tokelau",
  "Tonga",
  "Trinidad And Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Turks And Caicos Islands",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "United States Minor Outlying Islands",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela, Bolivarian Republic Of",
  "Viet Nam",
  "Virgin Islands, British",
  "Virgin Islands, U.S.",
  "Wallis And Futuna",
  "Western Sahara",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

g8Countries = [
    'Canada',
    'France',
    'Germany',
    'Italy',
    'Japan',
    'Russian Federation',
    'United Kingdom',
    'United States'
  ];


var _ = require('underscore');

var OpenDataCensus = {};

OpenDataCensus.questions =  [
  'timestamp',
  'place',
  'dataset',
  'exists',
  'digital',
  'machinereadable',
  'bulk',
  'public',
  'openlicense',
  'uptodate',
  'url',
  'dateavailable',
  'details',
  'submitter',
  'submitter-url',
  'reviewed'
];

OpenDataCensus.countryDatasetsMap = {
    'Election Results (national)': 'elections',
    'Company Register': 'companies',
    'National Map (Low resolution: 1:250,000 or better)': 'map',
    'Government Budget (National, high level, not detailed)': 'budget',
    'Government Spending (National, transactional level data)': 'spending',
    'Legislation (laws and statutes) - National': 'legislation',
    'National Statistical Data (economic and demographic information)': 'statistics',
    'National Postcode/ZIP database': 'postcodes',
    'Public Transport Timetables': 'timetables',
    'Environmental Data on major sources of pollutants (e.g. location, emissions)': 'emissions'
  };
  
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
  
  //The IDs are different from those used for publishing, they are ordered by current sheet position, and start at 1
  OpenDataCensus.sheetsQueryUrlMap = {
      'submitted' : 'https://spreadsheets.google.com/feeds/list/0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc/1/public/basic?sq=',
      'archiveKey' : '0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc',
      'archive' : 'https://spreadsheets.google.com/feeds/list/0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc/5/public/basic?sq=',
      'archivePost' : 'https://spreadsheets.google.com/feeds/list/0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc/5/public/basic',
      'live' : 'https://spreadsheets.google.com/feeds/list/0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc/3/public/basic?sq=',
      'livePost' : 'https://spreadsheets.google.com/feeds/list/0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc/3/public/basic'
  }


var openQuestions = OpenDataCensus.questions.slice(3,9);

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

OpenDataCensus.data = {
  country: {
    //This is the list of datasets... i.e. a foreign field in the results table
    datasetsUrl: 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=0&output=csv',
    // Submissions set
    // must be the CSV file
    // Reviewed set
    // must be the CSV file
    // TODO: Clarify if we want normalized or reviewed. Normalized causes a crash currently.
    resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc&single=true&gid=7&output=csv',
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
    datasetsUrl: 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=0&output=csv',
    // Submissions set
    // must be the CSV file
    //The column titles are tied to the form. We have short form titles in the 2nd line to match the final results set TODO: Is that necessary?
    //TODO: Careful that column mismatches don't cause problems. Additions are usually made by specifying columns, so it shouldn't matter
    resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0Ak6K0pSAyW1gdFpGRWhWd1lSeXNFX0dMRGw2VEFvSXc&single=true&gid=0&range=A2%3AP200000&output=csv', 
    
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
    datasetsUrl: 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=3&output=csv',
    resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdEEycENNYXQtU1RIbzRSYVRxLXFOdHc&single=true&gid=1&output=csv',
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

var request = require('request');
var csv = require('csv');

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

OpenDataCensus.load = function(cb) {
  var count = 5;
  function done() {
    count -= 1;
    if (count == 0) {
      cb();
    }
  }
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
    // 2013-06-09 normalize the datasets from a title to the id
    // (at some point this should be obsolete as we fix at source)
    record.dataset = OpenDataCensus.countryDatasetsMap[record.dataset];
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
  //TODO: Why was this 10 and not 9?
  var ynquestions = OpenDataCensus.questions.slice(3, 9);
  var out = records.map(function(record) {
    // fix up y/n
    ynquestions.forEach(function(question) {
      
      if (record[question] == undefined) {
        console.error('Bad y/n data');
        console.error(record);
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

// OpenDataCensus.load(function() {});

exports.OpenDataCensus = OpenDataCensus;


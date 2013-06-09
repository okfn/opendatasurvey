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

var openQuestions = OpenDataCensus.questions.slice(3,9);

OpenDataCensus.dataCatalogsUrl = "https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdE9POFhudGd6NFk0THpxR0NicFViRUE#gid=1";

exports.OpenDataCensus = OpenDataCensus;

OpenDataCensus.data = {
  country: {
    datasetsUrl: 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=0&output=csv',
    // authoratative set
    resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE&single=true&gid=6&output=csv',
// dataset info looks like
// 
//  { ID: 'energy',
//    Dataset: 'Energy Consumption ',
//    Category: 'Energy',
//    Description: 'Real time usage of energy in city and trends over time.',
//  }
    datasets: [],
    // array of hashes each hash having question keys
    results: []
  },
  city: {
    datasetsUrl: 'http://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=3&output=csv',
    resultsUrl: 'https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdEEycENNYXQtU1RIbzRSYVRxLXFOdHc&single=true&gid=0&output=csv',
    datasets: [],
    results: []
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
  var count = 4;
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
    done();
  });
  getCsvData(OpenDataCensus.data.country.resultsUrl, function(data) {
    var results = cleanUpCountry(data);
    OpenDataCensus.data.country.results = results;
    OpenDataCensus.data.country.places = _.uniq(_.map(results, function(r) {
      return r['place'];
    }));
    var bydataset = byDataset(results);
    OpenDataCensus.data.country.bydataset = bydataset;
    OpenDataCensus.data.country.byplace = byPlace(results);
    var summary = getSummaryData(results);
    summary.countries = OpenDataCensus.data.country.places.length;
    OpenDataCensus.data.country.summary = summary;
    done();
  });
  getCsvData(OpenDataCensus.data.city.datasetsUrl, function(data) {
    OpenDataCensus.data.city.datasets = data.slice(0,15) 
    done();
  });
  getCsvData(OpenDataCensus.data.city.datasetsUrl, function(data) {
    OpenDataCensus.data.city.results = [];
    done();
  });
};

// TODO: dedupe etc
function cleanUpCountry(rawdata) {
  countryDatasetsMap = {
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
  var correcter = {
    'Yes': 'Y',
    'No': 'N',
    'No ': 'N',
    'Unsure': '?'
  };
  var ynquestions = OpenDataCensus.questions.slice(3, 10);
  var out = rawdata.map(function(record) {
    // 2013-06-09 normalize the datasets from a title to the id
    // (at some point this should be obsolete as we fix at source)
    record.dataset = countryDatasetsMap[record.dataset];
    // fix up y/n
    ynquestions.forEach(function(question) {
      record[question] = correcter[record[question]]
      if (record[question] == undefined) {
        console.error(record);
      }
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
    out[row.place].score = out[row.place].score + row.ycount;
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


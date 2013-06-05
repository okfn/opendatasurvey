var OpenDataCensus = OpenDataCensus || {};

OpenDataCensus.countryCensusURL = 'https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE#gid=0';
OpenDataCensus.cityCensusURL = 'https://docs.google.com/spreadsheet/ccc?key=0AqR8dXc6Ji4JdEEycENNYXQtU1RIbzRSYVRxLXFOdHc#gid=0';

OpenDataCensus.dataCatalogsUrl = "https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdE9POFhudGd6NFk0THpxR0NicFViRUE#gid=1";


OpenDataCensus.censusDatasets = [
  'Election Results (national)',
  'Company Register',
  'National Map (Low resolution: 1:250,000 or better)',
  'Government Budget (National, high level, not detailed)',
  'Government Spending (National, transactional level data)',
  'Legislation (laws and statutes) - National',
  'National Statistical Data (economic and demographic information)',
  'National Postcode/ZIP database',
  'Public Transport Timetables',
  'Environmental Data on major sources of pollutants (e.g. location, emissions)'
];

OpenDataCensus.censusDatasetTitles = {
  'Election Results (national)': 'Election Results',
  'Company Register': 'Company Register',
  'National Map (Low resolution: 1:250,000 or better)': 'National Map',
  'Government Budget (National, high level, not detailed)': 'Government Budget',
  'Government Spending (National, transactional level data)': 'Government Spending',
  'Legislation (laws and statutes) - National': 'Legislation',
  'National Statistical Data (economic and demographic information)': 'National Statistics',
  'National Postcode/ZIP database': 'Postcode/ZIP database',
  'Public Transport Timetables': 'Public Transport',
  'Environmental Data on major sources of pollutants (e.g. location, emissions)': 'Environmental pollutants'
};

OpenDataCensus.censusKeys = [
  'Timestamp',
  'Census Country',
  'Dataset',
  'Data Availability [Does the data exist?]',
  'Data Availability [Is it in digital form?]',
  'Data Availability [Is it machine readable? (E.g. spreadsheet not PDF)]',
  'Data Availability [Available in bulk?  (Can you get the whole dataset easily)]',
  'Data Availability [Is it publicly available, free of charge?]',
  'Data Availability [Is it openly licensed? (as per the http://OpenDefinition.org/)]',
  'Data Availability [Is it up to date?]',
  'Location of Data Online',
  'Date it became available',
  'Details and comments',
  'Your name (optional)',
  'Link for you (optional)'
];

OpenDataCensus.censusProperties = {
  'Data Availability [Does the data exist?]': "exists",
  'Data Availability [Is it publicly available, free of charge?]': "public",
  'Data Availability [Is it in digital form?]': "digital",
  'Data Availability [Is it machine readable? (E.g. spreadsheet not PDF)]': "machine-readable",
  'Data Availability [Available in bulk?  (Can you get the whole dataset easily)]': "bulk",
  'Data Availability [Is it openly licensed? (as per the http://OpenDefinition.org/)]': "open-license",
  'Data Availability [Is it up to date?]': "up-to-date"
};

exports.OpenDataCensus = OpenDataCensus;

OpenDataCensus.sources = {
};
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
//{ timestamp: '16/04/2012 20:11:23',
//  country: 'United Kingdom',
//  dataset: 'National Map (Low resolution: 1:250,000 or better)',
//  exists: 'Yes',
//  digital: 'Yes',
//  'machine-readable': 'Yes',
//  bulk: 'Yes',
//  public: 'Yes',
//  'open-license': 'Yes',
//  'up-to-date': 'Yes',
//  url: 'http://www.ordnancesurvey.co.uk/opendata/',
//  'date-available': '01/04/2010',
//  details: 'The Ordnance Survey\'s OpenData product suite includes mapping with better than 1:250,000 resolution (OS Street View) and is released under the OS OpenData Licence, which complies with the Open Definition. The mapping is updated regularly (most recently in May 2012).\n\n',
//  submitter: 'Rufus Pollock',
//  'submitter-url': 'http://rufuspollock.org/',
//  reviewed: '' }
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
    OpenDataCensus.data.country.datasets = data.slice(0,10);
    done();
  });
  getCsvData(OpenDataCensus.data.country.resultsUrl, function(data) {
    var results = data.slice(0,10);
    results = results.map(cleanUpCountryResult);
    OpenDataCensus.data.country.results = results;
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

cleanUpCountryResult = function(record) {
  return record;
};


OpenDataCensus.load(function() {
  console.log(OpenDataCensus.data.country.datasets.length);
  console.log(OpenDataCensus.data.country.results.length);
  console.log(OpenDataCensus.data.country.results[0]);
  console.log(OpenDataCensus.data.city.datasets.length);
  console.log(OpenDataCensus.data.city.results.length);
});

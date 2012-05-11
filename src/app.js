var countryCodes = {
  'United Kingdom': 'GB',
  "Brazil": "BR", 
  "Australia": "AU", 
  "Netherlands": "NL", 
  "Iceland": "IS", 
  "Denmark": "DK", 
  "Czech Republic": "CZ", 
  "Norway": "NO", 
  "Croatia": "CR", 
  "Greece": "GR", 
  "United States": "US", 
  "India": "IN", 
  "Switzerland": "CH", 
  "Northern Ireland": "IE", 
  "Austria": "AT", 
  "Belgium": "BE", 
  "Spain": "ES", 
  "South Africa": "ZA", 
  "Canada": "CA", 
  "France": "FR", 
  "Uruguay": "UY", 
  "Finland": "FI", 
  "Belarus": "BY", 
  "Egypt": "EG", 
  "Bulgaria": "BG", 
  "Germany": "DE", 
  "Italy": "IT"
  };

var censusDatasets = [
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

var censusKeys = [
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

function gdocsMunge(str) {
  return str.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();
}

jQuery(document).ready(function($) {
  var url = 'https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE#gid=0'
  var dataset = new recline.Model.Dataset({
      id: 'opendatacensus',
      url: url
    },
    backend='gdoc'
  );
  if (window.location.search.indexOf('embed=1')!=-1) {
    $('.navbar').hide();
    $('body').attr('style', 'padding-top: 0');
  }
  dataset.fetch().done(function() {
    dataset.query().done(function() {
      $('.loading').hide();
      var data = dataset.currentDocuments.toJSON();
      console.log(data);
      var summary = getSummaryData(data);
      summaryMapSelect(summary);
    });
  });
});

function getSummaryData(data) {
  var datasets = {};
  var countryNames = _.uniq(_.map(data, function(r) {
    return r['censuscountry'];
  }));
  console.log(countryNames);
  function makeCountryDict () {
    var _out = {};
    _.each(countryNames, function(ds) {
      _out[ds] = {
        count: 0,
        responses: [],
        isopen: false
      };
    });
    return _out;
  }
  _.each(data, function(row) {
      datasets[row['dataset']] = makeCountryDict();
  });
  _.each(data, function(row) {
    var c = row['censuscountry'];
    var d = row['dataset'];
    count = datasets[d][c].count || 0;
    datasets[d][c]['count'] = count + 1;
    datasets[d][c].responses.push(row);
  });
  
  var out = {
      'datasets': datasets,
      'countries': countryNames,
      'total': data.length
      };
  console.log(out);
  return out;
}

function summaryMap(dataset) {
  var byIso = {};
  _.each(_.keys(dataset), function(c) {
    return byIso[countryCodes[c]] = dataset[c];
  });
  var scores = {};
  _.each(_.keys(byIso), function(country) {
    var count = byIso[country] ? byIso[country].count : 0;
    if (count) {
      // just get first response
      var summary = 0;
      var map = {
        'Yes': 1,
        'No': 0,
        'No ': 0,
        'Unsure': 0
      };
      var isopen = true;
      _.each(censusKeys.slice(3,9), function(key, idx) {
        var response = byIso[country].responses[0];
        var answer = response[gdocsMunge(key)];
        if (answer != 'Yes') {
          isopen = false;
        }
        summary += map[answer];
      });
      scores[country] = summary;
      // TODO: handle isOpen
    }
  });
  var colscale = new chroma.ColorScale({
    colors: chroma.brewer.Blues,
    limits: [-2,-1,0,1,2,3,4,5,6,7]
    });
  $('#map').empty();
  var map = $K.map('#map', 700);
  map.loadMap('data/world.svg', function(map) {
        map.addLayer({
          id: 'regions',
          className: 'bg',
          key: 'iso2',
          filter: function(d) {
            return !byIso.hasOwnProperty(d.iso2);
          }
        });
        
        map.addLayer({
          id: 'regions',
          key: 'iso2',
          filter: function(d) {
            return byIso.hasOwnProperty(d.iso2);
          }
        });

        map.choropleth({
          data: scores,
          colors: function(d) {           
            if (d === null) return '#e3e0e0';
            return colscale.getColor(d);
          }
        });

        map.onLayerEvent('click', function(d) {
          cellSummary(byIso[d.iso2]);
        });
  });
}

function summaryMapSelect(data) {
  $('#map').show();
  $('.total-responses').text(data.total);
  var dsList = $('#datasets-select');
  _.each(_.keys(data.datasets), function(dataset) {
    dsList.append('<li><a href="#"" data-dataset="'+dataset+'">'+dataset+'</a></li>');
  });
  dsList.on('click', 'a', function(e) {
    dsList.find('li').removeClass('active');
    $(e.currentTarget).parents('li').addClass('active');
    var dataset = $(e.currentTarget).data('dataset');
    summaryMap(data.datasets[dataset]);
  });
}

function cellSummary(data) {
  var summaryEl = $('#cellSummary');
  var resp = summaryEl.find('table');
  resp.empty();
  var firstResp = data.responses[0];
  summaryEl.find('.dataset-name').html(firstResp[gdocsMunge('Dataset')]);
  summaryEl.find('.country').html(firstResp[gdocsMunge('Census Country')]);
  resp.addClass('cell-summary').addClass('table').addClass('table-bordered').addClass('table-condensed');
  _.each(censusKeys.slice(1), function(key) {
    if (key != 'Dataset' && key != 'Census Country') {
      var response = data.responses[0];
      var answer = response[gdocsMunge(key)];
      var $tr = $('<tr />');
      $tr.append($('<th />').text(key));
      $tr.append($('<td />').text(answer));
      resp.append($tr);
    }
  });
  summaryEl.modal({backdrop: false});
  summaryEl.modal('show');
}

function graphSummary() {
    var query = {
        'size': 0,
        'query': {
            'match_all': {}
        },
        'facets': {
            'country': {
                'terms': {
                    'field': 'Census Country',
                    'size': 500
                }
            },
            'dataset': {
                'terms': {
                    'field': 'Dataset',
                    'size': 15
                }
            }
        }
    }

    var url = 'http://localhost:9200/ds/opendatacensus';
    var url = 'http://datahub.io/api/data/1f7dbeab-b523-4fa4-b9ab-7cfc3bd5e9f7';
    var dataset = new recline.Model.Dataset({
        id: 'default',
        url: url
      },
      'elasticsearch'
    );
    dataset.query(query).done(function() {
      dataset.facets.each(function(facet) {
        var newDataset = recline.Backend.createDataset(facet.attributes.terms);
        var config = {
          graphType: 'bars',
          group: 'term',
          series: ['count']
        };
        var graph = new recline.View.Graph({
          model: newDataset,
          state: config
        });
        $('.row.2nd').append(graph.el);
        newDataset.query();
      });
    });
}

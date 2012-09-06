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
  "Italy": "IT",
  "Taiwan R.O.C.": "TW",
  "Slovenia": "SI"
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
      url: url,
      backend: 'GDocs'
    }
  );
  if (window.location.search.indexOf('embed=1')!=-1) {
    $('.navbar').hide();
    $('body').attr('style', 'padding-top: 0');
  }
  dataset.fetch().done(function() {
    dataset.query({size: dataset.recordCount}).done(function() {
      $('.loading').hide();
      var data = dataset.records.toJSON();
      var summary = getSummaryData(data);
      summaryMap(summary);
      var summary = getByDataset(data);
      summaryTable(summary);
    });
  });
});

function getSummaryData(data) {
  var datasets = {};
  var countryNames = _.uniq(_.map(data, function(r) {
    return r['censuscountry'];
  }));
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
  return out;
}

function getByDataset(data) {
  var countries = {};
  function makeDatasetDict () {
    var _out = {};
    _.each(censusDatasets, function(ds) {
      _out[ds] = {
        count: 0,
        responses: [],
        isopen: false
      };
    });
    return _out;
  }
  _.each(data, function(row) {
      countries[row['censuscountry']] = makeDatasetDict();
  });
  _.each(data, function(row) {
    var c = row['censuscountry'];
    var d = row['dataset'];
    count = countries[c][d].count || 0;
    countries[c][d]['count'] = count + 1;
    countries[c][d].responses.push(row);
  });
  
  var out = {
      'datasets': censusDatasets,
      'countries': countries,
      'total': data.length
      }
  return out;
}

function get_all_datasets_by_country(dataset, country) {
  var ret=[]
  _.each(_.keys(dataset.datasets), function (d) {
    ret.push(dataset.datasets[d][country]);
    })
  return ret;  
  }

function get_latest_response(responses) {
  ret=responses[0]
  _.each(responses,function(response) {
      if (ret.timestamp < response.timestamp) {
        ret=response;
        }
      }
      )
  return ret;
  }
  
function summaryMap(dataset) {
  console.log(dataset)
  var byIso = {};
  _.each(dataset.countries, function (c) {
    return byIso[countryCodes[c]] = {name: c}})
  var scores = {};
  _.each(_.keys(byIso), function(country) {
    var count = byIso[country] ? byIso[country].count : 0;
    byIso[country].datasets=get_all_datasets_by_country(dataset,byIso[country].name);
    byIso[country].score=0;
    _.each(byIso[country].datasets,function(dataset) {
      if (dataset.count) {
        response=get_latest_response(dataset.responses)
        _.each(censusKeys.slice(3,9), function(key) {
            var answer=response[gdocsMunge(key)];
            if (answer='Yes') {
              byIso[country].score++;
              }
          })
        }
      });
      scores[country]=byIso[country].score;
  });
  var max=0;
  _.each(_.keys(scores),function(key) {
    if (scores[key] > max) {
      max=scores[key];
      };
    })
  var colscale = new chroma.ColorScale({
    colors: chroma.brewer.Blues,
    limits: [-2,max]
    });
  $('#map').empty();
  var map = $K.map('#map', 700);
  map.loadMap('../data/world.svg', function(map) {
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
  $("#map").css("margin-left",($(window).width()-700)/2+"px");
  $("#map").show();
}

function summaryMapSelect(data) {
  $('#map').show();
  $('.total-responses').text(data.total);
  var dsList = $('#datasets-select');
  _.each(_.keys(data.datasets), function(dataset) {
    dsList.append('<li><a href="#"" data-dataset="'+dataset+'">'+dataset+'</a></li>');
  });
  dsList.on('click', 'a', function(e) {
    e.preventDefault();
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

function summaryTable(data) {
  $('.total-responses').text(data.total);
  var table = $('.response-summary');
  var datasets = data.datasets;
  _.each(datasets, function(name) {
    table.find('thead tr').append($('<th />').text(name));
  });
  var countries = data.countries;
  var countryNames = _.keys(countries).sort();
  _.each(countryNames, function(name) {
    var country = countries[name];
    var row = $('<tr />');
    row.append($('<th />').text(name).addClass('country-name'));
    _.each(datasets, function(dataset) {
      var count = country[dataset] ? country[dataset].count : 0;
      if (count) {
        // just get first response
        var summary = '';
        var map = {
          'Yes': 'Y',
          'No': 'N',
          'No ': 'N',
          'Unsure': '?'
        }
        var isopen = true;
        _.each(censusKeys.slice(3,9), function(key, idx) {
          var response = country[dataset].responses[0];
          var answer = response[gdocsMunge(key)];
          if (answer != 'Yes') {
            isopen = false;
          }
          summary += map[answer];
        });
        var $td = $('<td />').addClass('count-' + count);
        $td.append('<a class="btn short-summary">' + summary + '</a>');
        if (isopen) {
          $td.append('<div><a href="http://opendefinition.org/okd/"><img src="http://assets.okfn.org/images/ok_buttons/od_80x15_blue.png" /></a></div>');
        }
        $td.find('.short-summary').click(function(e) {
          if ($td.find('.cell-summary').length > 0) {
            $td.find('.cell-summary').toggle();
          } else {
            $td.append(cellSummaryForTable(country, dataset));
          }
        });
        row.append($td);
      } else {
        row.append($('<td />').text('No info').addClass('count-' + count));
      }
    });
    table.find('tbody').append(row);
  });
}

function cellSummaryForTable(country, dataset) {
  var resp = $('<table />').addClass('cell-summary').addClass('table').addClass('table-bordered');
  _.each(censusKeys.slice(1), function(key) {
    var response = country[dataset].responses[0];
    var answer = response[gdocsMunge(key)];
    var $tr = $('<tr />');
    $tr.append($('<th />').text(key));
    $tr.append($('<td />').text(answer));
    resp.append($tr);
  });
  return $('<div />').append(resp).html();
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

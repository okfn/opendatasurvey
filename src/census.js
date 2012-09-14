/* var countryCodes = {
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
  "Slovenia": "SI",
  "Portugal":"PT",
  "Nigeria":"NG"
  }; */ //see new complete list below
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

var summary;

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
  createMapSelector();
  dataset.fetch().done(function() {
    dataset.query({size: dataset.recordCount}).done(function() {
      $('.loading').hide();
      var data = dataset.records.toJSON();
      summary = getSummaryData(data);
      summaryTable(summary);
      summaryMap(summary);
      summaryTop(summary);
    });
  });
});

function createMapSelector() {
  var el=$("ul.tab-control");
  _.each(censusDatasets,function(ds) {
    index=ds.indexOf("(");
    title=index>0?ds.substring(0,ds.indexOf("(")):ds;
    el.append("<li><a class='btn' id='"+ds+
    "' href='#' class='control' onclick='showSelectedMap(this)'>"+title+"</a></li>");
    });
  };
function summaryTop(summary) {
  $("#nc").html(summary.countries.length);
  $("#nr").html(summary.total)
  var nd=0;
  _.each(_.keys(summary.datasets), function (key) {
    var ds=summary.datasets[key]
    _.each(_.keys(ds), function(country) {
      if (ds[country].count>0) {
        nd++;
        }
        });
    });
  var free=0;
  _.each(_.keys(summary.datasets), function (key) {
    var ds=summary.datasets[key]
    _.each(_.keys(ds), function(country) {
      if (ds[country].count>0) {
        var r=get_latest_response(ds[country].responses)
        if (scoreOpenness(r)==6) {
          free++;
          }
          }

        });
    });
  $("#nds").html(nd);
  $("#nok").html(free);
  }

function scoreOpenness(response) {
  var score=0;
  _.each(censusKeys.slice(3,9), function(key) {
    if (response[gdocsMunge(key)]=='Yes') {
      score++;
      }})
  return score;    
  }
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
  $("ul.tab-control > li > a").removeClass("active");
  $("#overallscore").addClass("active");
  var byIso = createByIso(dataset);
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
  
  showMap(byIso,"score",colscale,countrySummary);
}; 

function createByIso(dataset) {
  var ret={};
  _.each(dataset.countries, function (c) {
    ret[countryCodes[c]]= {name: c};
    });
  return ret;  
  }
function showSelectedMap(obj) {
  var dataset=obj.id;
  $("ul.tab-control > li > a").removeClass("active");
  obj.className="btn active";
  byIso=createByIso(summary);
  _.each(_.keys(byIso), function (c) {
    byIso[c].count=0;
    });
  var ds=summary.datasets[dataset];  
  _.each(_.keys(byIso), function(c) {
    var cds=ds[byIso[c].name];
    var r=get_latest_response(cds.responses);
    if (r) {
      byIso[c].count=scoreOpenness(r);
      byIso[c].response=r;
      }
    });
  
  var colscale= new chroma.ColorScale({
    colors: chroma.brewer.Blues,
    limits: [-2,6]
    });
  showMap(byIso,"count",colscale,function(d) {
    $("#CountryDatasetInfo div.modal-header h3").html(d.name);
    console.log(d);
    $("#CountryDatasetInfo div.modal-body table").empty();
    if (d.response) {
      _.each(censusKeys, function(key) {
        tr=["<tr><td>"]
        tr.push(key);
        tr.push("</td><td>");
        tr.push(d.response[gdocsMunge(key)]);
        tr.push("</td></tr>");
        $("#CountryDatasetInfo div.modal-body table").append(tr.join(""))
        });
      }
    $("#CountryDatasetInfo").modal({backgrop: false});    
    $("#CountryDatasetInfo").modal('show');
    }
    );
  }
function showOpenMap() {
  $("ul.tab-control > li > a").removeClass("active");
  $("#opendatasets").addClass("active");
  byIso=createByIso(summary);
  _.each(_.keys(byIso),function(c) {
    byIso[c].count=0;
    byIso[c].datasets=[];
    });
  _.each(_.keys(summary.datasets), function (ds) {
    _.each(_.keys(summary.datasets[ds]), function (country) {
        var cc=countryCodes[country];
        var response=get_latest_response(summary.datasets[ds][country].responses);
        if (response) {
        if (scoreOpenness(response) ==6) {
          byIso[cc].count++;
          byIso[cc].datasets.push(summary.datasets[ds][country]);
          }}
      });

  });
  var colscale= new chroma.ColorScale({
    colors: chroma.brewer.Blues,
    limits: [-1,10]
    });

  showMap(byIso,"count",colscale,function(d) {
    $("#CountryOpenInfo div.modal-header h3").html(d.name);
    $("#CountryOpenInfo div.modal-body table").empty();
    _.each(d.datasets,function(ds) {
      var r=get_latest_response(ds.responses);
      var tr=["<tr><td>"];
      if (r.locationofdataonline) {
        tr.push("<a href='",r.locationofdataonline,"'>")
        }
      tr.push(r.dataset);
      if (r.locationofdataonline) {
        tr.push("</a>");
        }
      tr.push("</td></tr>");
      $("#CountryOpenInfo div.modal-body table").append(tr.join(""))
      })
    $("#CountryOpenInfo").modal({backgrop: false});    
    $("#CountryOpenInfo").modal('show');
    })  
  
  };
function showMap(data,key,colscale,callback) {
  var values={}
  _.each(_.keys(data), function(d) {
    values[d]=data[d][key]
    })
  $('#map').empty();
  var map = $K.map('#map', 700);
  map.loadMap('../data/world.svg', function(map) {
        map.addLayer({
          id: 'regions',
          className: 'bg',
          key: 'iso2',
          filter: function(d) {
            return !data.hasOwnProperty(d.iso2);
          }
        });
        
        map.addLayer({
          id: 'regions',
          key: 'iso2',
          filter: function(d) {
            return data.hasOwnProperty(d.iso2);
          }
        });

        map.choropleth({
          data: values,
          colors: function(d) {           
            if (d === null) return '#e3e0e0';
            return colscale.getColor(d);
          }
        });

        map.onLayerEvent('click', function(d) {
          callback(data[d.iso2]);
        });
  });
  $("#map").css("margin-left","300px");
  $("#map").show();
}

function countrySummary(data) {
  $("#CountryInfo table").empty();
  var ds=0;
  _.each(data.datasets,function(d) {
    if (d.count>0) {
      ds++;
      }
    });
  var free=0;
  _.each(data.datasets,function(d) {
    if (d.count>0) {
      var tr=["<tr><td>"];
      var resp=get_latest_response(d.responses);
      if (scoreOpenness(resp)==6) {
        free++;
        d.isopen=true;
        }
      if (resp.locationofdataonline) {
        tr.push("<a href='"+resp.locationofdataonline+"'>")
        }
      tr.push(resp.dataset)
      if (resp.locationofdataonline) {
        tr.push("</a>");
        }
      tr.push("</td><td>");
      if (d.isopen) {
        tr.push("<img src='http://assets.okfn.org/images/ok_buttons/od_80x15_blue.png' />")
        }
      tr.push("</td></tr>");
      $("#CountryInfo table").append(tr.join(""));
      };
      });
  $("#CountryInfo h3").html(data.name);    
  $("#CountryInfo").modal({backgrop: false});    
  $("#CountryInfo").modal('show');
  $("#cnds").html(ds);
  $("#cokds").html(free);
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

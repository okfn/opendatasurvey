$(document).ready(function($) {

  var summary;

  var openColorScale = new chroma.ColorScale({
    colors: ['#0a0', '#0f0'],
    limits: [3, 7]
  });

  var freeColorScale = new chroma.ColorScale({
    colors: ['#fa0', '#ff0'],
    limits: [2, 7]
  });

  var closedColorScale = new chroma.ColorScale({
    colors: ['#f00', '#fa0'],
    limits: [1, 7]
  });

  var dataset = new recline.Model.Dataset({
      id: 'opendatacensus',
      url: OpenDataCensus.censusUrl,
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
      summary = getSummaryData(data);
      summaryTable(summary);
      summaryMap(summary);
      $('#overallscore').click(function(e){
        e.preventDefault();
        summaryMap(summary);
      });
      $('#opendatasets').click(function(e){
        e.preventDefault();
        showOpenMap();
      });
      createMapSelector();
      var top = summaryTop(summary);
      $("#nds").html(top.nd);
      $("#nok").html(top.free);
      $("#nc").html(top.nc);
      $("#nr").html(top.nr);
    });
  });

  function createMapSelector() {
    var el = $("ul.tab-control");
    var temp = function(name) {
      return function(e){
        e.preventDefault();
        $("ul.tab-control > li > a").removeClass("active");
        $(this).addClass("active");
        showSelectedMap(name);
      };
    };
    _.each(OpenDataCensus.censusDatasets, function(ds, i) {
      var title = OpenDataCensus.makeDatasetTitle(ds);
      el.append('<li><a class="btn" id="ds-' + i +
        '" href="#" class="control">' + title + '</a></li>');
      $('#ds-' + i).click(temp(ds));
    });
  }

  function getByDataset(data) {
    var countries = {};
    function makeDatasetDict () {
      var _out = {};
      _.each(OpenDataCensus.censusDatasets, function(ds) {
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

    return {
        'datasets': OpenDataCensus.censusDatasets,
        'countries': countries,
        'total': data.length
    };
  }

  function getAllDatasetByCountry(dataset, country) {
    var ret = [];
    _.each(_.keys(dataset.datasets), function (d) {
      ret.push(dataset.datasets[d][country]);
    });
    return ret;
  }


  function summaryMap(dataset) {
    $("ul.tab-control > li > a").removeClass("active");
    $("#overallscore").addClass("active");
    var byIso = createByIso(dataset);
    var scores = {};
    _.each(_.keys(byIso), function(country) {
      var count = byIso[country] ? byIso[country].count : 0;
      byIso[country].datasets = getAllDatasetByCountry(dataset, byIso[country].name);
      byIso[country].score=0;
      _.each(byIso[country].datasets,function(dataset) {
        if (dataset.count) {
          response = getLatestReponse(dataset.responses);
          _.each(OpenDataCensus.censusKeys.slice(3,9), function(key) {
              var answer = response[gdocsMunge(key)];
              if (answer === 'Yes') {
                byIso[country].score++;
              }
          });
        }
      });
      scores[country]=byIso[country].score;
    });
    var max=0;
    _.each(_.keys(scores),function(key) {
      if (scores[key] > max) {
        max=scores[key];
      }
    });
    var colscale = new chroma.ColorScale({
      colors: chroma.brewer.Blues,
      limits: [-2,max]
    });
    showMap(byIso,"score",colscale,countrySummary);
  }

  function createByIso(dataset) {
    var ret = {};
    _.each(dataset.countries, function (c) {
      ret[OpenDataCensus.countryCodes[c]]= {name: c};
    });
    return ret;
  }

  function showSelectedMap(dataset) {
    var byIso = createByIso(summary);
    _.each(_.keys(byIso), function (c) {
      byIso[c].count=0;
      });
    var ds=summary.datasets[dataset];
    _.each(_.keys(byIso), function(c) {
      var cds=ds[byIso[c].name];
      var r = getLatestReponse(cds.responses);
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
        _.each(OpenDataCensus.censusKeys, function(key) {
          var tr = ["<tr><td>"];
          tr.push(key);
          tr.push("</td><td>");
          tr.push(d.response[gdocsMunge(key)]);
          tr.push("</td></tr>");
          $("#CountryDatasetInfo div.modal-body table").append(tr.join(""));
        });
      }
      $("#CountryDatasetInfo").modal({backgrop: false});
      $("#CountryDatasetInfo").modal('show');
    });
  }

  function showOpenMap() {
    $("ul.tab-control > li > a").removeClass("active");
    $("#opendatasets").addClass("active");
    byIso=createByIso(summary);
    _.each(_.keys(byIso),function(c) {
      byIso[c].count = 0;
      byIso[c].datasets = [];
    });
    _.each(_.keys(summary.datasets), function (ds) {
      _.each(_.keys(summary.datasets[ds]), function (country) {
          var cc=OpenDataCensus.countryCodes[country];
          var response = getLatestReponse(summary.datasets[ds][country].responses);
          if (response) {
            if (scoreOpenness(response) == 6) {
              byIso[cc].count++;
              byIso[cc].datasets.push(summary.datasets[ds][country]);
            }
          }
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
        var r = getLatestReponse(ds.responses);
        var tr = ["<tr><td>"];
        if (r.locationofdataonline) {
          tr.push("<a href='", r.locationofdataonline, "'>");
        }
        tr.push(r.dataset);
        if (r.locationofdataonline) {
          tr.push("</a>");
        }
        tr.push("</td></tr>");
        $("#CountryOpenInfo div.modal-body table").append(tr.join(""));
      });
      $("#CountryOpenInfo").modal({backgrop: false});
      $("#CountryOpenInfo").modal('show');
    });

  }

  function showMap(data,key,colscale,callback) {
    var values = {};
    _.each(_.keys(data), function(d) {
      values[d] = data[d][key];
    });
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
        var resp = getLatestReponse(d.responses);
        if (scoreOpenness(resp)==6) {
          free++;
          d.isopen=true;
          }
        if (resp.locationofdataonline) {
          tr.push("<a href='" + resp.locationofdataonline + "'>");
          }
        tr.push(resp.dataset);
        if (resp.locationofdataonline) {
          tr.push("</a>");
        }
        tr.push("</td><td>");
        if (d.isopen) {
          tr.push("<img src='http://assets.okfn.org/images/ok_buttons/od_80x15_blue.png' />");
        }
        tr.push("</td></tr>");
        $("#CountryInfo table").append(tr.join(""));
      }
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
    _.each(OpenDataCensus.censusKeys.slice(1), function(key) {
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
    _.each(datasets, function(obj, key) {
      table.find('thead tr').append($('<th>').append('<div>' + OpenDataCensus.makeDatasetTitle(key) + '</div>'));
    });
    table.find('thead tr').append($('<th>').append('<div><strong>Total Score</strong></div>'));
    var countries = data.countries.sort();
    var cellCount = 0;
    _.each(countries, function(name) {
      var totalScore = 0, openFactor = 1;
      var row = $('<tr />');
      row.data('area', name);
      row.append($('<th />').text(name).addClass('area-name'));
      _.each(datasets, function(dataset, datasetName) {
        var count = dataset[name] ? dataset[name].count : 0;
        if (count) {
          // just get first response
          var summary = [];
          var map = {
            'Yes': 'Y',
            'No': 'N',
            'No ': 'N',
            'Unsure': '?'
          };

          var isopen = true, ycount = 0, total = 0;
          _.each(OpenDataCensus.censusKeys, function(key, idx) {
            if (key.indexOf('Data Availability') === -1) { return; }
            total += 1;
            var response = dataset[name].responses[0];
            var answer = response[gdocsMunge(key)];
            if (answer !== 'Yes') {
              isopen = false;
            }
            if (answer === 'Yes') {
              ycount += 1;
            }
            summary.push(map[answer]);
          });
          var $td = $('<td />').addClass('count-' + count);

          // 0  'Data Availability [Does the data exist?]',
          // 1  'Data Availability [Is it in digital form?]',
          // 2  'Data Availability [Is it machine readable? (E.g. spreadsheet not PDF)]',
          // 3  'Data Availability [Available in bulk?  (Can you get the whole dataset easily)]',
          // 4  'Data Availability [Is it publicly available, free of charge?]',
          // 5  'Data Availability [Is it openly licensed? (as per the http://OpenDefinition.org/)]',
          // 6  'Data Availability [Is it up to date?]',

          if (summary[0] === 'Y' && summary[5] === 'Y' && summary[4] === 'Y') {
            // Data is exists, is open, and publicly available
            // make it green, anything else is cherry on top
            $td.addClass('open-' + ycount);
            openFactor = 3;
            $td.css('background-color', openColorScale.getColor(ycount).hex());
          } else if (summary[0] === 'Y' && (summary[4] === 'Y' || summary[5] === 'Y')) {
            // exists, and is either open or freely available
            // make it orange
            openFactor = 2;
            $td.css('background-color', freeColorScale.getColor(ycount).hex());
            $td.addClass('free-' + ycount);
          } else if (summary[0] === 'Y') {
            // data is neither open nor free
            openFactor = 1;
            $td.addClass('closed-' + ycount);
            $td.css('background-color', closedColorScale.getColor(ycount).hex());
          } else if (summary[0] === 'N') {
            $td.addClass('unavailable');
          } else if (summary[0] === '?') {
            $td.addClass('unknown');
          }
          totalScore += ycount * openFactor;
          $td.append('<a>' + ycount + '/' + total + '</a>');
          (function(cellid) {
            $td.click(function(e) {
              var mod = $('#cellid-' + cellid);
              if (mod.length === 0) {
                $('body').append(cellSummaryForTable(name, dataset, cellid));
                mod = $('#cellid-' + cellid);
              }
              mod.modal('toggle');
            });
          }(cellCount));
          row.append($td);
        } else {
          row.append($('<td class="no-data">').html('<a href="submit/?dataset=' + encodeURIComponent(datasetName) + '&area=' + encodeURIComponent(name) + '" data-toggle="tooltip" class="count-' + count + '" title="Click here to add to the census!">?</a>'));
        }
        cellCount += 1;
      });
      row.append($('<td>').append($('<a>').text('' + totalScore + '/210')));
      row.data('score', totalScore);
      table.find('tbody').append(row);
    });
    $(table.find('thead tr th').get(0)).addClass('sorting')
      .html('' +
        '<label class="radio">' +
          '<input type="radio" name="sorttable" class="sort-table" value="alpha" checked>' +
          'Sort alphabetically' +
        '</label>' +
        '<label class="radio">' +
          '<input type="radio" name="sorttable" class="sort-table" value="score">' +
          'Sort by score' +
      '</label>' +
      '');
    $('.sort-table').change(function(){
      var sortFunc;
      if ($('.sort-table:checked').val() === 'score') {
        sortFunc = function(a, b) {
          return parseInt($(b).data('score'), 10) - parseInt($(a).data('score'), 10);
        };
      } else {
        sortFunc = function(a, b) {
          return $(a).data('area').toUpperCase().localeCompare($(b).data('area').toUpperCase());
        };
      }
      table.find('tbody tr').sort(sortFunc).appendTo(table);

    });
    $('a[data-toggle="tooltip"]').tooltip();
  }

  function cellSummaryForTable(country, dataset, cellid) {
    var resp = $('<table>').addClass('cell-summary').addClass('table').addClass('table-bordered');
    var response = dataset[country].responses[0];
    var title = OpenDataCensus.makeDatasetTitle(response.dataset);
    _.each(OpenDataCensus.censusKeys.slice(1), function(key) {
      var answer = response[gdocsMunge(key)];
      var $tr = $('<tr />');
      $tr.append($('<th />').text(key));
      if(answer.indexOf('http://') === 0 || answer.indexOf('https://') === 0) {
        $tr.append($('<td />').append(
          $('<a>',{'href': answer}).text(answer)
        ));
      } else {
        $tr.append($('<td />').text(answer));
      }
      resp.append($tr);
    });
    var modalBody = $('<div>', {'class': "modal-body"})
      .append(resp);

    var modalHeader = $('<div class="modal-header">')
      .append('<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>')
      .append('<h3>' + title + ' in ' + country + '</h3>');
    return $('<div>', {'id': 'cellid-' + cellid, 'class': 'modal hide'}).append(modalHeader).append(modalBody);
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
    };
    // var url = 'http://localhost:9200/ds/opendatacensus';
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
});
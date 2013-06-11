$(document).ready(function($) {

  var summary;

  // 2013-06-09 (rgrp) - is anyone using this (do not think so)
  if (window.location.search.indexOf('embed=1')!=-1) {
    $('.navbar').hide();
    $('body').attr('style', 'padding-top: 0');
  }

  $.getJSON('/country/results.json', function(data) {
    OpenDataCensus.summaryTable($('.response-summary'), data);
    // summaryMap(data);
    $('#overallscore').click(function(e){
      e.preventDefault();
      summaryMap(data);
    });
    $('#opendatasets').click(function(e){
      e.preventDefault();
      showOpenMap();
    });
    // createMapSelector();
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

  function getAllDatasetByCountry(dataset, country) {
    var ret = [];
    _.each(_.keys(dataset.bydataset), function (d) {
      ret.push(dataset.bydataset[d][country]);
    });
    return ret;
  }

  function summaryMap(countryInfo) {
    $("ul.tab-control > li > a").removeClass("active");
    $("#overallscore").addClass("active");
    var byIso = createByIso(countryInfo.places);
    var scores = {};
    _.each(_.keys(byIso), function(country) {
      var count = byIso[country] ? byIso[country].count : 0;
      byIso[country].datasets = getAllDatasetByCountry(countryInfo, byIso[country].name);
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

  function createByIso(countries) {
    var ret = {};
    _.each(countries, function (c) {
      ret[OpenDataCensus.countryCodes[c]]= {name: c};
    });
    return ret;
  }

  function showSelectedMap(dataset) {
    var byIso = createByIso(dataset.places);
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
});

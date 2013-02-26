$(document).ready(function($) {

  var summary;
  var dataset = new recline.Model.Dataset({
      id: 'opendatacensus',
      url: OpenDataCensus.cityCensusURL,
      backend: 'GDocs'
    }
  );

  var popoverContent = function(response) {
    // bulk: "Yes"
    // city: "London, Greater London, England, United Kingdom, European Union"
    // dataset: "budget"
    // date-available: "2010"
    // details: "Whatever"
    // digital: "Yes"
    // exists: "Yes"
    // machine-readable: "Yes"
    // open-license: "Yes"
    // public: "Yes"
    // submitter: "Rufus"
    // submitter-url: "http://rgrp.okfnlabs.org/"
    // up-to-date: "Unsure"
    // url: ""
    var makeNot = function(reply){
      var not;
      if (reply === 'Yes'){
        not = '';
      } else if (reply === 'No'){
        not = 'not ';
      } else {
        not = 'unclear if it\'s ';
      }
      return '<b>' + not + '</b>';
    };

    var out, not;

    out = $('<div>').append($('<a>', {href: response['submitter-url']}).text(response.submitter || 'Unknown')).html();
    out += ' submitted:';
    out += '<ul>';
    not = '';
    if (response.exists === 'Yes'){
      out += '<li>Data exists</li>';
      not = makeNot(response['open-license']);
      out += '<li>It\'s ' + not + 'openly licensed</li>';
      not = makeNot(response['public']);
      out += '<li>It\'s ' + not + 'publicy available</li>';
      not = makeNot(response['machine-readable']);
      out += '<li>It\'s ' + not + 'machine-readable</li>';
      not = makeNot(response['digital']);
      out += '<li>It\'s ' + not + 'digital</li>';
      not = makeNot(response['up-to-date']);
      out += '<li>It\'s ' + not + 'up-to-date</li>';
      not = makeNot(response['bulk']);
      out += '<li>It\'s ' + not + ' available in bulk</li>';
    } else {
      out += '<li>Data does not exist</li>';
    }
    out += '</ul>';
    if (response.url) {
      out += '<a href="' + response.url + '" target="_blank">Location Online</a>';
    }
    return [
      summary.datasetDict[response.dataset].dataset +
      ' - ' + OpenDataCensus.getCityName(response.city),
      out
    ];
  };

  dataset.fetch().done(function() {
    var dataSchema = new recline.Model.Dataset({
      id: 'opendatacityschema',
      url: 'https://docs.google.com/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc#gid=1',
      backend: 'GDocs'
    });
    dataSchema.fetch().done(function() {
      dataSchema.query({size: dataSchema.recordCount}).done(function(){
        dataset.query({size: dataset.recordCount}).done(function() {
          $('.loading').hide();
          var schema = dataSchema.records.toJSON();
          var data = dataset.records.toJSON();
          summary = getSummaryDataFromCity(data, schema);

          OpenDataCensus.summaryTable($('#city-table'), summary, popoverContent);

          var top = OpenDataCensus.summaryTop(summary);
          $("#nds").html(top.nd);
          $("#nok").html(top.free);
          $("#nc").html(top.nc);
          $("#nokpercent").html(top.nokpercent + '%');
        });
      });
    });
  });

  var getSummaryDataFromCity = function(data, schema) {

    schema = _.filter(schema, function(s){
      if (!s.id) { return false; }
      return true;
    });

    var schemaDict = {};
    _.each(schema, function(s){
      schemaDict[s.id] = s;
    });

    var datasets = {};
    var entries = [];
    _.each(data, function(entry){
      var dict = {};
      var entryData = JSON.parse(entry.data);
      _.each(entryData, function(nameValue){
          dict[nameValue.name] = nameValue.value;
      });
      if (!dict.city) { return; }
      entries.push(dict);
    });

    var cityNames = _.uniq(_.map(entries, function(r) {
      return OpenDataCensus.getCityName(r.city);
    }));

    function makeCityDict (dataset) {
      var _out = {};
      _.each(cityNames, function(ds) {
        _out[ds] = {
          name: dataset.name,
          count: 0,
          responses: [],
          isopen: false
        };
      });
      return _out;
    }
    _.each(schema, function(row) {
        datasets[row.id] = makeCityDict(row);
    });

    _.each(entries, function(row) {
      var c = OpenDataCensus.getCityName(row.city);
      var d = row.dataset;
      var count = datasets[d][c].count || 0;
      datasets[d][c].count = count + 1;
      datasets[d][c].responses.push(row);
    });

    return {
      datasets: datasets,
      datasetDict: schemaDict,
      countries: cityNames,
      total: data.length
    };
  };
});

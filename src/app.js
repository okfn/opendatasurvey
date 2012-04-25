jQuery(document).ready(function($) {
  $.getJSON('data/summary.json', summaryTable);
});


function summaryTable(data) {
  var table = $('.response-summary');
  var datasets = data.datasets;
  _.each(datasets, function(name) {
    table.find('thead tr').append($('<th />').text(name));
  });
  var countries = data.countries;
  countries['All other countries'] = {};
  _.each(countries, function(country, name) {
    var row = $('<tr />');
    row.append($('<th />').text(name));
    _.each(datasets, function(dataset) {
      var count = country[dataset] ? country[dataset].count : 0;
      row.append($('<td />').text(count).addClass('count-' + count));
    });
    table.find('tbody').append(row);
  });
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

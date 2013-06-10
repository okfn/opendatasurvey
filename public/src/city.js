$(document).ready(function($) {

  var summary;

  $.getJSON('/city/results.json', function(data) {
    OpenDataCensus.summaryTable($('#city-table'), data);
  });
});

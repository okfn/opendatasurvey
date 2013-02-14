
$(function(){

  function makeNumber(element, number) {
    element.empty();
    _.each(number.toString(), function(n){
      element.append("<span>"+n+"</span>");
    });
  }

  var catalogs = new recline.Model.Dataset({
    backend: 'gdocs',
    url: OpenDataCensus.dataCatalogsUrl
  });

  catalogs.fetch().done(function() {
    makeNumber($("#tds"), catalogs.recordCount);
  });

  var dataset = new recline.Model.Dataset({
      id: 'opendatacensus',
      url: OpenDataCensus.censusUrl,
      backend: 'GDocs'
   });
  dataset.fetch().done(function() {
    dataset.query({size: dataset.recordCount}).done(function() {
      var data=dataset.records.toJSON();
      var summary = getSummaryData(data);
      var top = summaryTop(summary);
      makeNumber($("#nds"), top.nd);
      makeNumber($("#nok"), top.free);
    });
  });

});
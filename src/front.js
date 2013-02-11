
$(function(){

  function makeNumber(element, number) {
    element.empty();
    _.each(number.toString(), function(n){
      element.append("<span>"+n+"</span>");
    });
  }

  function getDcSummary(data) {
    var summary={};
    summary.total=data.recordCount;
    summary.active=0;
    summary.local=0;
    summary.regional=0;
    summary.national=0;
    _.each(data.records.toJSON(), function(r) {
      if ($.inArray("level.local",r.tags)>=0) {
        summary.local++;
        }
      if ($.inArray("level.regional",r.tags)>=0) {
        summary.regional++;
        }
      if ($.inArray("level.national",r.tags)>=0) {
        summary.national++;
        }
      if (r.state=="active") {
        summary.active++;
      }
    });
    return summary;
  }

  function showDcSummary(summary) {
    makeNumber($("#tds"),summary.total);
  }

  $.getJSON(OpenDataCensus.dataCatalogsUrl, function(data) {
    var dataset=new recline.Model.Dataset({records: data});
    dataset.query({size: dataset.recordCount}).done(function () {
      $("div.loading").hide();
      var summary=getDcSummary(dataset);
      showDcSummary(summary);
      });
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
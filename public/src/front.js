
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
});

var dcjson="../data/datacatalogs.geocoded.json";

var dataset;
function init() {
  $.getJSON(dcjson,function(data) {
    dataset=new recline.Model.Dataset({records: data});
    dataset.query({size: dataset.recordCount}).done(function () {
      var map=new recline.View.Map({model: dataset})
      $("#map").append(map.el);
      map.render();
      });
    });
  
  }

$(document).ready(init);  

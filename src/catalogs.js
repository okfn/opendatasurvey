var dcjson="https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=datacatalogsorg&query=select%20*%20from%20%60swdata%60%20";


var dataset;
function init() {
  $.getJSON(dcjson,function(data) {
    for (i in data) {
      data[i].location={lon:data[i].lon, lat:data[i].lat};
      if (data[i].groups!=undefined) {
        data[i].groups=data[i].groups.split(" ");
        console.log(data[i].groups);

      }
      if (data[i].tags!=undefined) {
        data[i].tags=data[i].tags.split(" ")
        };
      }
    dataset=new recline.Model.Dataset({records: data});
    dataset.query({size: dataset.recordCount}).done(function () {
      $("div.loading").hide();
      var map=new recline.View.Map({model: dataset})
       map.infobox=function(d) {
        var html=["<div class='infobox'><h3>"];
        html.push(d.attributes.title);
        html.push("</h3>");
        html.push("<a href='",d.attributes.url,"'>");
        html.push(d.attributes.url,"</a>");
        html.push("<div class='description'>");
        html.push(d.attributes.notes);
        if (d.attributes.tags) {
          html.push("<div class='tags'>tags: ")
          _.each(d.attributes.tags,function(tag) {
            html.push("<a href='#' onclick=filterBy('",tag,"')>"
              ,tag,"</a> ");
            });
          html.push("</div>");  
          }
        if (d.attributes.groups) {
          html.push("<div class='groups'>groups: ")
          _.each(d.attributes.groups,function(tag) {
            html.push("<a href='#' onclick=filterBy('",tag,"')>"
              ,tag,"</a> ");
            });
          html.push("</div>");  
          }
        html.push("</div>");
        html.push("</div>");
        return html.join("");
        } 
      $("#map").append(map.el);
      map.render();
      var summary=getSummary(dataset);
      showSummary(summary);
      });
    });
  
  }

function getSummary(data) {
  var summary={};
  summary.total=dataset.recordCount;
  return summary;
};

function showSummary(summary) {
  $("#tds").html(summary.total);
  }
function filterBy(term) {
$("#searchbox").val(term);
filterResults($("#searchbox")[0]);
}

function filterResults(obj) {
  var el=$("#"+obj.id);
  var term=el.val();
  dataset.query({q:term});
  $("#tds").html(dataset.recordCount);
  };
$(document).ready(init);  

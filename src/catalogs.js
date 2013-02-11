$(function(){

  function getSummary(data) {
    var summary = {};
    summary.total = dataset.recordCount;
    return summary;
  }

  function showSummary(summary) {
    $("#tds").html(summary.total);
  }

  function filterBy(term) {
    return function(e){
      if(e) {
        e.preventDefault();
      }
      $("#searchbox").val(term);
      filterResults(term);
    };
  }

  function filterResults(term) {
    dataset.query({q: term});
    $("#tds").html(dataset.recordCount);
  }

  var dataset = new recline.Model.Dataset({
    backend: 'gdocs',
    url: OpenDataCensus.dataCatalogsUrl
  });

  $('#searchbox').keyup(function(){
    var term = $(this).val();
    filterResults(term);
  });

  $(document).on('click', '.tags a.tag-filter', function(e){
    e.preventDefault();
    filterBy($(this).attr('href').substr(1))();
  });

  dataset.fetch().done(function() {
    dataset.query({size: dataset.recordCount}).done(function () {
      $("div.loading").hide();
      var map = new recline.View.Map({model: dataset});
      map.infobox = function(d) {
        var html = $('<div>', {'class': 'infobox'})
          .append('<h3>' + d.attributes.title + '</h3>')
          .append('<a href="' + d.attributes.url + '">' + d.attributes.url + '</a>');

        var desc = $('<div>', {'class': 'description'})
          .append(d.attributes.notes);

        if (d.attributes.tags) {
          var tags = $('<div>', {'class': 'tags'})
            .append('tags: ');
          _.each(d.attributes.tags.split(' '), function(tag) {
            var tagElem = $('<a href="#' + tag + '" class="tag-filter">' +
              tag + '</a>').click(filterBy(tag))
              .append(' ');
            tags.append(tagElem);
          });
          desc.append(tags);
        }
        html.append(desc);
        return html.get(0);
      };
      $("#map").append(map.el);
      map.render();
      var summary = getSummary(dataset);
      showSummary(summary);
    });
  });
});

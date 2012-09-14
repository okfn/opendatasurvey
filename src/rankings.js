var data;

var map;

function rank(parameter) {
  $(".rankings .selector a").removeClass("active");
  $("#select-"+parameter).addClass("active");
  var options={};
  if (parameter=="datasets") {
    options.log=true;
    }
  options.log=true;  
  options.colorscale=new chroma.ColorScale ({
    })
  data.sort(function(a,b) { return b[parameter]-a[parameter]});
  var series=_.map(data,function(r) {
    return {label:r.name,value:r[parameter]};});
  var byIso={};
  _.each(series,function(r) {
    byIso[countryCodes[r.label]]={name:r.label,
      value:options.log?Math.log(r.value):r.value};
  });
  function get_max(series) {
    var r=series[0].value;
    _.each(series,function(s) {
      if (s.value>r) {
        r=s.value;
      }})
    return r}
  options.colorscale=new chroma.ColorScale ({
    colors: chroma.brewer.Blues,
    limits: [0,options.log?Math.log(get_max(series)):get_max(series)]
    })
  barplots($("#ranks"),series,options);

  function get_path_by_id(event) {
    var country=event.currentTarget.id.replace("bp-","");
    country=country.replace("-"," ");
    var cc=countryCodes[country];
    if (cc) {
      path=map.layers.regions.pathsById[cc][0].svgPath.id;
      return "path_"+path;
      };
    };
  $("#ranks tr").bind("mouseover", function(e) {
    $("#"+get_path_by_id(e)).trigger("mouseover");
    $("#"+get_path_by_id(e)).css("fill","#FF9900");
    })
  $("#ranks tr").bind("mouseout", function(e) {
    $("#"+get_path_by_id(e)).trigger("mouseout");
    var col=$("#"+e.currentTarget.id+" td.bpvalue > div").css("background");
    $("#"+get_path_by_id(e)).css("fill",col);
    });
  showMap(byIso,"value",options.colorscale,function(d) { console.log(d) });
  }


function showMap(data,key,colscale,callback) {
  var values={}
  _.each(_.keys(data), function(d) {
    values[d]=data[d][key]
    })
  $('#map').empty();
  map = $K.map('#map', 700);
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

        map.onLayerEvent('mouseenter', function(d) {
          $("#bp-"+idfy(data[d.iso2].name)).addClass("active");
        });
        map.onLayerEvent('mouseleave', function(d) {
          $("#bp-"+idfy(data[d.iso2].name)).removeClass("active");
        });
  });
  $("#map").show();
}


$(document).ready(function (){
 $.getJSON("../data/logd.json", function(d) {
  data=d;
  _.each(_.keys(data[0]), function(key) {
    if ((key !="name") && (key != "uri")) {
      $(".rankings .selector").append("<a href='#' onclick='rank(\""+
        key+"\")' class='btn' id='select-"+key+"'>"+key+"</a> ");
      }
    })
  rank("datasets");
  });
});

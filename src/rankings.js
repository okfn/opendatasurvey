var data;



function rank(parameter) {
  var options={};
  if (parameter=="datasets") {
    options.log=true;
    }
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
  showMap(byIso,"value",options.colorscale,function(d) { console.log(d) });
  }


function showMap(data,key,colscale,callback) {
  var values={}
  _.each(_.keys(data), function(d) {
    values[d]=data[d][key]
    })
  $('#map').empty();
  var map = $K.map('#map', 700);
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

        map.onLayerEvent('click', function(d) {
          callback(data[d.iso2]);
        });
  });
  $("#map").show();
}


$(document).ready(function (){
 $.getJSON("../data/logd.json", function(d) {
  data=d;
  rank("datasets");
  });
});

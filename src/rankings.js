var data;



function rank(parameter) {
  var options={};
  if (parameter=="datasets") {
    options.log=true;
    }
  data.sort(function(a,b) { return b[parameter]-a[parameter]});
  var series=_.map(data,function(r) {
    return {label:r.name,value:r[parameter]};});
  barplots($("#ranks"),series,options);
  }


$(document).ready(function (){
 $.getJSON("../data/logd.json", function(d) {
  data=d;
  rank("datasets");
  });
});

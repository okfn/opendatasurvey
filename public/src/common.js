var OpenDataCensus = OpenDataCensus || {};

OpenDataCensus.colorScale = {
  totalColorScale: new chroma.ColorScale({
    colors: ['#dd3d3a', '#8bdd3a'],
    limits: [0, 1000]
  })
};

OpenDataCensus.popoverBody = function(response) {
  // bulk: "Yes"
  // city: "London, Greater London, England, United Kingdom, European Union"
  // dataset: "budget"
  // date-available: "2010"
  // details: "Whatever"
  // digital: "Yes"
  // exists: "Yes"
  // machine-readable: "Yes"
  // open-license: "Yes"
  // public: "Yes"
  // submitter: "Rufus"
  // submitter-url: "http://rgrp.okfnlabs.org/"
  // up-to-date: "Unsure"
  // url: ""
  var makeNot = function(reply){
    var not;
    if (reply === 'Y'){
      not = '';
    } else if (reply === 'N'){
      not = 'not ';
    } else {
      not = 'unclear if it\'s ';
    }
    return '<b>' + not + '</b>';
  };

  var out = '', not;
  out += '<ul>';
  not = '';

  //This should match the order of fields in the model!
  if (response.exists === 'Y'){
    out += '<li>Data exists</li>';
    not = makeNot(response['digital']);
    out += '<li>It\'s ' + not + 'digital</li>';
    not = makeNot(response['public']);
    out += '<li>It\'s ' + not + 'publicly available</li>';
    not = makeNot(response['free']);
    out += '<li>It\'s ' + not + 'free of charge</li>';
    not = makeNot(response['online']);
    out += '<li>It\'s ' + not + 'online</li>';
    not = makeNot(response['machinereadable']);
    out += '<li>It\'s ' + not + 'machine readable</li>';
    not = makeNot(response['bulk']);
    out += '<li>It\'s ' + not + ' available in bulk</li>';
    not = makeNot(response['openlicense']);
    out += '<li>It\'s ' + not + 'openly licensed</li>';
    not = makeNot(response['uptodate']);
    out += '<li>It\'s ' + not + 'up-to-date</li>';

  } else {
    out += '<li>Data does not exist</li>';
  }
  out += '</ul>';
  if (response.url) {
    out += '<a href="' + response.url + '" target="_blank">Data Location Online</a>';
  }
  return out;
};

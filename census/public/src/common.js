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

  var truncate = function(s, l) {
    var o;
    if (l === null || typeof l === 'undefined') {
      l = 50;
    }
    o = s.slice(0, l);
    if (s.length > l) {
      o += "&hellip;";
    }
    return o;
  };

  var out = [], not = '';
  out.push('<ul>');

  // This should match the order of fields in the model!
  if (response.exists === 'Y'){
    out.push('<li>Data exists</li>');
    not = makeNot(response['digital']);
    out.push('<li>It\'s ' + not + 'digital</li>');
    not = makeNot(response['public']);
    out.push('<li>It\'s ' + not + 'publicly available</li>');
    not = makeNot(response['free']);
    out.push('<li>It\'s ' + not + 'free of charge</li>');
    not = makeNot(response['online']);
    out.push('<li>It\'s ' + not + 'online');
    if (response['online'] !== 'N' && response.url) {
      out.push(' (<a href="' + response.url + '" target="_blank">');
      out.push(truncate(response.url, 30));
      out.push('</a>)');
    }
    out.push('</li>');
    not = makeNot(response['machinereadable']);
    out.push('<li>It\'s ' + not + 'machine readable</li>');
    not = makeNot(response['bulk']);
    out.push('<li>It\'s ' + not + ' available in bulk</li>');
    not = makeNot(response['openlicense']);
    out.push('<li>It\'s ' + not + 'openly licensed</li>');
    not = makeNot(response['uptodate']);
    out.push('<li>It\'s ' + not + 'up-to-date</li>');

  } else {
    out.push('<li>Data does not exist</li>');
  }
  out.push('</ul>');
  if (response.details) {
    out.push('<p>' + truncate(response.details, 300));
    out.push(' <a href="' + response.details_url + '">Read more &raquo;</a>');
    out.push('</p>');
  } else {
    out.push('<p>');
    out.push('<a href="' + response.details_url + '">View details &raquo;</a>');
    out.push('</p>');
  }
  return out.join('');
};

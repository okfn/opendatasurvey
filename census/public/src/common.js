var OpenDataCensus = OpenDataCensus || {};

OpenDataCensus.colorScale = {
  totalColorScale: new chroma.ColorScale({
    colors: ['#dd3d3a', '#8bdd3a'],
    limits: [0, 1000]
  })
};

OpenDataCensus.popoverBody = function(answers, details, url, actionurl) {

  var makeNot = function(reply){
    var not;

    if (reply === true){
      not = '';
    } else if (reply === false){
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
  if (answers.exists === true){
    out.push('<li>Data exists</li>');
    not = makeNot(answers.digital);
    out.push('<li>It\'s ' + not + 'digital</li>');
    not = makeNot(answers.public);
    out.push('<li>It\'s ' + not + 'publicly available</li>');
    not = makeNot(answers.free);
    out.push('<li>It\'s ' + not + 'free of charge</li>');
    not = makeNot(answers.online);
    out.push('<li>It\'s ' + not + 'online');
    if (answers.online !== false && answers.url) {
      out.push(' (<a href="' + answers.url + '" target="_blank">');
      out.push(truncate(answers.url, 30));
      out.push('</a>)');
    }
    out.push('</li>');
    not = makeNot(answers.machinereadable);
    out.push('<li>It\'s ' + not + 'machine readable</li>');
    not = makeNot(answers.bulk);
    out.push('<li>It\'s ' + not + ' available in bulk</li>');
    not = makeNot(answers.openlicense);
    out.push('<li>It\'s ' + not + 'openly licensed</li>');
    not = makeNot(answers.uptodate);
    out.push('<li>It\'s ' + not + 'up-to-date</li>');

  } else {
    out.push('<li>Data does not exist</li>');
  }
  out.push('</ul>');
  if (details) {
    out.push('<p>' + truncate(details, 300));
    out.push(' <a href="' + url + '">Read more &raquo;</a>');
    out.push('</p>');
  } else {
    out.push('<p>');
    out.push('<a href="' + url + '">View details &raquo;</a>');
    out.push('</p>');
  }
  out.push('<a href="' + actionurl + '">TEST</a>');
  return out.join('');
};

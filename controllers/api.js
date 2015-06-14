'use strict';

var _ = require('underscore');
var model = require('../lib/model').OpenDataCensus;
var csv = require('csv');


var api = function (req, res) {
  var entries = model.data.entries.results;
  var headers = [];
  if (entries !== []) {
    // create a list of omitted keys
    var omissions = [];
    _.each(entries[0], function (v, k) {
      if (typeof v === 'function' || k[0] === '_' || _.contains(['content'], k)) {
        omissions.push(k);
      }
    });
    // remove omissions
    entries = _.map(entries, function (i) {
      return _.omit(i, omissions);
    });
    // get a list of headers
    headers = _.keys(entries[0]);
  }

  if (req.params.format === 'json') {
    return res.json(entries);
  } else if (req.params.format === 'csv') {
    return csv()
      .from.array(entries, {columns: headers})
      .to.stream(res, {header: true})
      ;
  } else {
    return res.send(404);
  }
};

module.exports = {
  api: api
}

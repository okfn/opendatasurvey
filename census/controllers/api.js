'use strict';

var csv = require('csv');


var api = function (req, res) {

  var format = req.params.format;
  var entries = req.app.get('models').Entry.findAll({
    where: {
      site: req.params.domain,
      is_current: true
    }
  });

  entries.then(function(results){

    if (format === 'json') {

      res.json(results);
      return;

    } else if (format === 'csv') {

      // TODO
      // return csv.generate();
      return;

    } else {

      res.send(404);
      return;

    }
  });

};

module.exports = {
  api: api
};

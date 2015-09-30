'use strict';

var csv = require('csv');
var lodash = require('lodash');
var moment = require('moment');

var api = function (req, res) {

  var format = req.params.format;
  var where = {
    site: req.params.domain,
    isCurrent: true
  };
  if (req.params.year) {
    where.year = req.params.year;
  }
  var entries = req.app.get('models').Entry.findAll({
    where: where
  });

  entries.then(function(results){
    if (format === 'json') {
      res.json(results);
    } else if (format === 'csv') {
      var columns = {
        censusid: 'Census ID',
        timestamp: 'Timestamp',
        year: 'Year',
        place: 'Place',
        dataset: 'Dataset',
        exists: 'Exists',
        digital: 'Digital',
        public: 'Public',
        online: 'Online',
        free: 'Free',
        machinereadable: 'Machine-readable',
        bulk: 'Bulk',
        openlicense: 'Open licence',
        uptodate: 'Up-to-date',
        url: 'URL',
        format: 'Format',
        licenseurl: 'Licence URL',
        dateavailable: 'Date available',
        officialtitle: 'Official title',
        publisher: 'Publisher',
        details: 'Details'
      };
      results = lodash.map(results, function(item) {
        var answers = item.answers || {};
        return {
          censusid: item.site,
          timestamp: moment(item.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
          year: item.year,
          place: item.place,
          dataset: item.dataset,
          exists: answers.exists ? 'Yes' : 'No',
          digital: answers.digital ? 'Yes' : 'No',
          public: answers.public ? 'Yes' : 'No',
          online: answers.online ? 'Yes' : 'No',
          free: answers.free ? 'Yes' : 'No',
          machinereadable: answers.machinereadable ? 'Yes' : 'No',
          bulk: answers.bulk ? 'Yes' : 'No',
          openlicense: answers.openlicense ? 'Yes' : 'No',
          uptodate: answers.uptodate ? 'Yes' : 'No',
          url: answers.url,
          format: answers.format,
          licenseurl: answers.licenseurl,
          dateavailable: answers.dateavailable,
          officialtitle: answers.officialtitle,
          publisher: answers.publisher,
          details: item.details
        };
      });
      var stringify = csv.stringify(results, {
        delimiter: ',',
        quote: '"',
        quoted: true,
        rowDelimiter: 'unix',
        header: true,
        columns: columns
      });
      res.header('Content-Type', 'text/csv');
      stringify.pipe(res);
    } else {
      res.send(404);
    }
  }).catch(console.trace.bind(console));
};

module.exports = {
  api: api
};

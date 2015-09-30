'use strict';

var csv = require('csv');
var lodash = require('lodash');
var moment = require('moment');

var outputItemsAsJson = function(response, items, mapper) {
  if (lodash.isFunction(mapper)) {
    items = lodash.map(items, mapper);
  }
  response.json(items);
};

var outputItemsAsCsv = function (response, items, mapper, columns) {
  var options = {
    delimiter: ',',
    quote: '"',
    quoted: true,
    rowDelimiter: 'unix'
  };
  if (lodash.isObject(columns)) {
    options.header = true;
    options.columns = columns;
  }
  if (lodash.isFunction(mapper)) {
    items = lodash.map(items, mapper);
  }
  var stringify = csv.stringify(items, options);
  response.header('Content-Type', 'text/csv');
  stringify.pipe(response);
};

var datasets = function (req, res) {
  var format = req.params.format;
  var entries = req.app.get('models').Dataset.findAll({
    where: {
      site: req.params.domain
    }
  });

  entries.then(function(results) {
    var columns = {
      id: 'ID',
      site: 'Census ID',
      name: 'Name',
      description: 'Description',
      category: 'Category',
      order: 'Order'
    };

    switch(format) {
      case 'json': {
        var mapper = function(item) {
          var result = {};
          for (var name in columns) {
            if (columns.hasOwnProperty(name)) {
              result[name] = item[name];
            }
          }
          return result;
        };
        outputItemsAsJson(res, results, mapper);
        break;
      }
      case 'csv': {
        outputItemsAsCsv(res, results, null, columns);
        break;
      }
      default: {
        res.send(404);
        break;
      }
    }
  }).catch(console.trace.bind(console));
};

var places = function (req, res) {
  var format = req.params.format;
  var entries = req.app.get('models').Place.findAll({
    where: {
      site: req.params.domain
    }
  });

  entries.then(function(results) {
    var columns = {
      id: 'ID',
      site: 'Census ID',
      name: 'Name',
      slug: 'Slug',
      region: 'Region',
      continent: 'Continent'
    };

    switch(format) {
      case 'json': {
        var mapper = function(item) {
          var result = {};
          for (var name in columns) {
            if (columns.hasOwnProperty(name)) {
              result[name] = item[name];
            }
          }
          return result;
        };
        outputItemsAsJson(res, results, mapper);
        break;
      }
      case 'csv': {
        outputItemsAsCsv(res, results, null, columns);
        break;
      }
      default: {
        res.send(404);
        break;
      }
    }
  }).catch(console.trace.bind(console));
};

var entries = function (req, res) {
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

  entries.then(function(results) {
    switch(format) {
      case 'json': {
        outputItemsAsJson(res, results);
        break;
      }
      case 'csv': {
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
        var mapper = function(item) {
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
        };
        outputItemsAsCsv(res, results, mapper, columns);
        break;
      }
      default: {
        res.send(404);
        break;
      }
    }
  }).catch(console.trace.bind(console));
};

module.exports = {
  entries: entries,
  datasets: datasets,
  places: places
};

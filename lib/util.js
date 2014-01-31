var request = require('request')
  , csv = require('csv')
  , config = require('./config.js')
  ;

exports.getCsvData = function(url, cb) {
  var data = [];
  // a simpler and better approach is to do 
  // csv().from.stream(request.get(url))
  // however we need to stub for tests and csv files are small so not a biggie
  request.get(url, function(err, res, body) {
    csv()
      .from.string(body,
          {columns: true})
      .on('record', function(record, idx) {
        // lower case all keys
        for (key in record) {
          record[key.toLowerCase()] = record[key];
          if (key.toLowerCase() != key) {
            delete record[key];
          }
        }
        // weird issues with google docs and newlines resulted in some records getting "wrapped"
        if (record.dataset && record.dataset.indexOf('http') != -1) {
          console.error('bad');
          console.error(record);
        }
        data.push(record);
      })
      .on('end', function() {
        cb(null, data);
      })
      ;
  });
}

exports.loadConfig = function(cb) {
  exports.getCsvData(config.configUrl, function(err, data) {
    if (err) {
      cb(err);
      return
    }
    data.forEach(function(record) {
      config.set(record.key, record.value);
    });
    cb(null);
  });
};


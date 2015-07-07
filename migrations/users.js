var _ = require('underscore');
var chalk = require('chalk');
var csv = require('csv');
var fs = require('fs');
var models = require('../census/models');
var moment = require('moment');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var fileData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});


csv.parse(fileData, {columns: true}, function(error, data) {

  Promise.each(data, function(obj){

    var providers = {};
    providers[obj.provider] = obj.providerid;

    return models.User.upsert({
      id: uuid.v4(),
      emails: [obj.email],
      providers: providers,
      firstName: obj.givenname,
      lastName: obj.familyname,
      homepage: obj.homepage,
      photo: obj.photo,
      anonymous: false
    })
      .then(function(result) {

        console.log('success on user migration');
        console.log(result);

      })
      .catch(function(error) {

        console.log('error on user migration:');
        console.log(error);

      });
  });

});

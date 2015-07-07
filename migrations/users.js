var _ = require('underscore');
var csv = require('csv');
var fs = require('fs');
var models = require('../census/models');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var fileData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});


csv.parse(fileData, {columns: true}, function(E, D) {

  Promise.each(D, function(R) {

    var providers = {};
    providers[R.provider] = R.providerid;

    return models.User.upsert({
      id: uuid.v4(),
      emails: [R.email],
      providers: providers,
      firstName: R.givenname,
      lastName: R.familyname,
      homepage: R.homepage,
      photo: R.photo,
      anonymous: false
    })
      .then(function(R) {

        console.log('success on user migration');
        console.log(R);

      })
      .catch(function(E) {

        console.log('error on user migration:');
        console.log(E);

      });
  });

});

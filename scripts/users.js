var csv = require('csv');
var fs = require('fs');
var models = require('../census/models');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var fileData;
var utils = require('./utils');

try {
  fileData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});
} catch (err) {
  fileData = '';
}

csv.parse(fileData, {columns: true}, function(E, D) {
  // Ensure we have our anonymous user.
  models.User.upsert({
    id: utils.anonymousUserId,
    emails: ['anonymous@example.com'],
    providers: {okfn: 'anonymous'},
    firstName: 'anonymous',
    lastName: 'anonymous',
    anonymous: false
  }).then(function(result) {
    Promise.each(D, function(R) {
      var providers = {};
      providers[R.provider] = R.providerid;

      return models.User.create({
        id: uuid.v4(),
        emails: [R.email],
        providers: providers,
        firstName: R.givenname,
        lastName: R.familyname,
        homePage: R.homepage,
        photo: R.photo,
        anonymous: false
      }).then(function(R) {
        console.log('success on user migration');
        console.log(R.emails);
      }).catch(console.trace.bind(console));
    });
  });
});

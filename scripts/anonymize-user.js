'use strict';

const Sequelize = require('sequelize');
const program = require('commander');
var Promise = require('bluebird');

var utils = require('./utils');
var models = require('../census/models');

var providerIdValue;

program
  .version('0.1.0')
  .arguments('<provider_id>')
  .option('-d, --dry-run',
          'print user and entries but don\'t anonymize them')
  .action(function (providerId) {
    providerIdValue = providerId;
  });

program.parse(process.argv);

if (typeof providerIdValue === 'undefined') {
   console.error('no provider id given!');
   process.exit(1);
}

if (program.dryRun) {
  console.log('Dry run. No users or entries will be changed.');
}

// get user id via provider id

models.User.findAll({
  attributes: ['id'],
  where:
    Sequelize.or(
      {'providers.provider': providerIdValue},
      {'providers.google': providerIdValue}
    )
})
  // For each user with providerIdValue (should only be one)
  .each(user => {
    console.log(`User: ${user.get('id')}`);

    var tasks = [];

    // Where submitter is user...
    if (program.dryRun) {
      var findSubmitterEntries = models.Entry.findAll({
        where: {
          submitterId: user.get('id')
        }
      })
        // For each entry for the user...
        .each(entry => {
          console.log(`Submitter for entry: ${entry.get('id')}`);
        });
      tasks.push(findSubmitterEntries);
    } else {
      var updateSubmitterEntries = models.Entry.update(
        {
          submitterId: utils.anonymousUserId
        },
        {
          where: {
            submitterId: user.get('id')
          }
        }
      )
        .spread((rowCount, rows) => {
          console.log(`${rowCount} entries affected, as submitter`);
        });
      tasks.push(updateSubmitterEntries);
    }

    // Where reviewer is user...
    if (program.dryRun) {
      var findReviewerEntries = models.Entry.findAll({
        where: {
          reviewerId: user.get('id')
        }
      })
        // For each entry for the user...
        .each(entry => {
          console.log(`Reviewer for entry: ${entry.get('id')}`);
        });
      tasks.push(findReviewerEntries);
    } else {
      var updateReviewerEntries = models.Entry.update(
        {
          reviewerId: utils.anonymousUserId
        },
        {
          where: {
            reviewerId: user.get('id')
          }
        }
      )
        .spread((rowCount, rows) => {
          console.log(`${rowCount} entries affected, as reviewer`);
        });
      tasks.push(updateReviewerEntries);
    }

    return Promise.all(tasks)
      .then(() => {
        console.log('');
        if (!program.dryRun) {
          user.destroy();
        }
      });
  })
    .then(() => {
      console.log('All done!');
    });

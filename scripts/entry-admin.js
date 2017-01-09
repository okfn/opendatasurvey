'use strict';

const util = require('util');

const _ = require('lodash');
const commandLineCommands = require('command-line-commands');
const commandLineArgs = require('command-line-args');

const validCommands = ['listbyyear', 'updatetoyear'];
const parsedCommand = commandLineCommands(validCommands);
const command = parsedCommand.command;
const argv = parsedCommand.argv;

const models = require('../census/models');

const optionDefinitions = {
  listbyyear: [
    {name: 'year', type: Number},
    {name: 'site', type: String}
  ],
  updatetoyear: [
    {name: 'year', type: Number},
    {name: 'entry', multiple: true, type: String}
  ]
};

const options = commandLineArgs(optionDefinitions[command], argv);

if (command === 'listbyyear') {
  if (!options.year) {
    console.log('Please supply a year');
  }
  if (!options.site) {
    console.log('Please supply a site');
  }
  if (options.year && options.site) {
    models.Entry.findAll({
      where: {
        year: options.year,
        site: options.site
      }
    })
    .then(entries => {
      _.each(entries, entry => {
        let msg = util.format('%s: %s/%s',
          entry.id, entry.place, entry.dataset);
        console.log(msg);
      });
      let msg = util.format('Total entries for %s in %s: %s',
        options.site, options.year, entries.length);
      console.log(msg);
    });
  } else {
    console.log('Could not proceed. Please fix supplied args.');
  }
} else

if (command === 'updatetoyear') {
  if (!options.year) {
    console.log('Please supply a year');
  }
  if (!options.entry) {
    console.log('Please supply one or more entry ids');
  }
  if (options.year && options.entry) {
    models.Entry.update({year: options.year}, {
      where: {id: {in: options.entry}}
    })
    .then((count, entries) => {
      let msg = util.format('Updated %s entries to %s',
        count, options.year);
      console.log(msg);
    });
  } else {
    console.log('Could not proceed. Please fix supplied args.');
  }
}

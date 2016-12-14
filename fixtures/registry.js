'use strict';

// configurl points to Test Site3 config.
var objects = [
  {
    model: 'Registry',
    data: {
      id: 'site1',
      settings: {
        adminemail: ['email1@example.com'],
        configurl: 'https://docs.google.com/spreadsheets/d/1zKHbPdR1lRTuxvNFR32L1pQRJMWmj8C5UoKvECLsqtk/edit#gid=0'
      }
    }
  },
  {
    model: 'Registry',
    data: {
      id: 'site2',
      settings: {
        adminemail: ['email2@example.com'],
        configurl: 'https://docs.google.com/spreadsheets/d/1zKHbPdR1lRTuxvNFR32L1pQRJMWmj8C5UoKvECLsqtk/edit#gid=0'
      }
    }
  }
];

module.exports = objects;

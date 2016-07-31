'use strict';

// configurl points to Test Site3 config.
var objects = [
  {
    model: 'Registry',
    data: {
      id: 'site1',
      settings: {
        adminemail: ['email1@example.com'],
        configurl: 'https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=1PoS2loqokUbwxMEFXb1Zoe3goLISGga9RumvNf-VxGo&usp=sharing#gid=0'
      }
    }
  },
  {
    model: 'Registry',
    data: {
      id: 'site2',
      settings: {
        adminemail: ['email2@example.com'],
        configurl: 'https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=1PoS2loqokUbwxMEFXb1Zoe3goLISGga9RumvNf-VxGo&usp=sharing#gid=0'
      }
    }
  }
];

module.exports = objects;

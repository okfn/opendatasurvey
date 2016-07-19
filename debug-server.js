'use strict';

const start = require('./census/app').start;
start().then(result => {
  console.log('SERVER STARTED');
});

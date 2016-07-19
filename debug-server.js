'use strict';

var start = require('./census/app').start;
start().then((result) => { console.log('SERVER STARTED'); });

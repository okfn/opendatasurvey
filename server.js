'use strict';

var throng = require('throng');
var start = require('./census/app').start;
var WORKERS = process.env.WEB_CONCURRENCY || 1;

throng(start, {
  workers: WORKERS,
  lifetime: Infinity
});

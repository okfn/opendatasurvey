'use strict';

const throng = require('throng');
const start = require('./census/app').start;
const WORKERS = process.env.WEB_CONCURRENCY || 1;

throng(start, {
  workers: WORKERS,
  lifetime: Infinity
});

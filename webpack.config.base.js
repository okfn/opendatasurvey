'use strict';

var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'census/static/scripts/compiled');
var APP_DIR = path.resolve(__dirname, 'census/ui_app');

module.exports = {
  entry: APP_DIR + '/entry.jsx',
  devtool: 'source-map',
  output: {
    path: BUILD_DIR,
    filename: 'entry.js'
  },
  module: {
    loaders: [
      {test: /\.jsx?/, include: APP_DIR, loaders: ['babel']}
    ]
  }
};

var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'census/static/scripts/compiled');
var APP_DIR = path.resolve(__dirname, 'census/ui_app');

var config = {
  entry: APP_DIR + '/entry.jsx',
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

module.exports = config;

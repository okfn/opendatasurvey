var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'census/public/src');
var APP_DIR = path.resolve(__dirname, 'census/ui_app');

var config = {
  entry: APP_DIR + '/entry.jsx',
  output: {
    path: BUILD_DIR,
    filename: 'entry.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        include: APP_DIR,
        loader: 'babel'
      }
    ]
  }
};

module.exports = config;

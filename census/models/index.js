var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var mixinsFile = path.basename('./mixins.js');
var utilsFile = path.basename('./utils.js');
var config = require('../config').get('database');
var utils = require('./utils');
var sequelize;
var testSequelize = new Sequelize(config.testDatabase, config.username, config.password, config);
var db = {test: {}};


if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if it exists, for Heroku.
  sequelize = new Sequelize(process.env.DATABASE_URL, config);
} else {
  // Fallback to normal config, for local development.
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file.slice(-1) !== '~') &&
      (file !== basename) && (file !== mixinsFile) &&
      (file !== utilsFile);
  })
  .forEach(function (file) {
    console.log(file);
    var model = sequelize['import'](path.join(__dirname, file));
    var testModel = testSequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
    db.test[testModel.name] = testModel;
  });

Object.keys(db).forEach(function (modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
    db.test[modelName].associate(db.test);
  }
});

db.utils = utils;
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.test.sequelize = testSequelize;
db.test.Sequelize = Sequelize;

module.exports = typeof IN_TESTING != 'undefined' && IN_TESTING ? db.test : db;

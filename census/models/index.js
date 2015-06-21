var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var mixinsFile = path.basename('./mixins.js');
var config = require('../config').get('database');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
var testSequelize = new Sequelize(config.testDatabase, config.username, config.password, config);
var db = {test: {}};

fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file.slice(-1) !== '~')
      && (file !== basename) && (file !== mixinsFile);
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

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.test.sequelize = testSequelize;
db.test.Sequelize = Sequelize;

module.exports = typeof IN_TESTING != 'undefined' && IN_TESTING ? db.test : db;

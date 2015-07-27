var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var Umzug = require('umzug');
var basename = path.basename(module.filename);
var mixinsFile = path.basename('./mixins.js');
var utilsFile = path.basename('./utils.js');
var migrationsDir = path.join(path.dirname(path.dirname(module.filename)), 'migrations');
var config = require('../config');
var dbConfig = config.get('database');
var utils = require('./utils');
var sequelize;
var umzug;
var db = {};

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if it exists, for Heroku.
  sequelize = new Sequelize(process.env.DATABASE_URL, dbConfig);
} else {
  // Fallback to normal config, for local development.
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}

umzug = new Umzug({
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize,
    modelName: 'sequelizemeta'
  },
  migrations: {
    params: [sequelize.getQueryInterface(), Sequelize],
    path: migrationsDir
  }
});

fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file.slice(-1) !== '~') &&
      (file !== basename) && (file !== mixinsFile) &&
      (file !== utilsFile);
  })
  .forEach(function (file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function (modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.Sequelize = Sequelize;
db.utils = utils;
db.sequelize = sequelize;
db.umzug = umzug;

module.exports = db;

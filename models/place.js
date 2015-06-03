'use strict';

var Sequelize = require('sequelize');
var Site = require('./site');


module.exports = function(sequelize, DataTypes) {

  var Place = sequelize.define('Place', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: "id of the place. Composite key with site."
    },
    site: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: "Site this place belongs to. Composite key with id."
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The name of the place."
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "A slug of this place name."
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "The region in which this place is located."
    },
    continent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "The continent in which this place is located."
    }
  },
  {
    tableName: 'place'
  });

  return Place;

};

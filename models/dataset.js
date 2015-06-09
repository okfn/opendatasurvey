'use strict';

var Sequelize = require('sequelize');
var Site = require('./site');


module.exports = function (sequelize, DataTypes) {

    var Dataset = sequelize.define('Dataset', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            comment: "id of the dataset. Composite key with site."
        },
        site: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            comment: "Site this dataset belongs to. Composite key with id."
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "The name of the dataset."
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: "A text description of this dataset."
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "The category for this dataset. Used in UI."
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "The icon class for this dataset. Used in UI."
        }
    },
    {
        tableName: 'dataset'
    });

    return Dataset;

};

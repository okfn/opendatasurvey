'use strict';

module.exports = function (sequelize, DataTypes) {

    var Registry = sequelize.define('Registry', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            comment: "Unique identifier for a site.\
                Is used as the subdomain name for the site."
        },
        settings: {
            type: DataTypes.JSONB,
            allowNull: false
        }
    },
    {
        tableName: 'registry'
    });

    return Registry;

};

'use strict';

module.exports = function(sequelize, DataTypes) {

  var Site = sequelize.define('Site', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: "Unique identifier for a site.\
                Must match an id in Registry. \
                Is used as the subdomain name for the site."
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  },
  {
    tableName: 'site'
  });

  return Site;

};

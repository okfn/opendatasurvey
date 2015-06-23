'use strict';
var bcrypt = require('bcrypt');

module.exports = function (sequelize, DataTypes) {

  var User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: "Unique identifier for a user."
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      },
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    anonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    authentication_hash: {
      type: DataTypes.STRING
    },
    authentication_salt: {
      type: DataTypes.STRING
    }
  },
  {
    instanceMethods: {
      setPassword: function(password) {
        var salt = bcrypt.genSaltSync(8);
        
        this.authentication_hash = bcrypt.hashSync(password, salt);
        this.authentication_salt = salt;
      }
    },

    tableName: 'user'
  });

  return User;

};

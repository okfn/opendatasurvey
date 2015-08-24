'use strict';


module.exports = function (sequelize, DataTypes) {

  var NotificationLog = sequelize.define('NotificationLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Notification type name'
    },

    lastAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Datetime notification last sent'
    }
  },
  {
    tableName: 'notification_log',
    timestamps: false
  });

  return NotificationLog;

};

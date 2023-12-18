const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalDates', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    openingDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'opening_date'
    },
    notificationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'notification_date'
    },
    festivalStart: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'festival_start'
    },
    festivalEnd: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'festival_end'
    },
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festivals',
        key: 'id'
      },
      field: 'festival_id'
    },
    currencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'currencies',
        key: 'id'
      },
      field: 'currency_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    tableName: 'festival_dates',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_dates_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

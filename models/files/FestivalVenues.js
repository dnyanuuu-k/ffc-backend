const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalVenues', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    country: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    postalCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'postal_code'
    },
    state: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    geolocation: {
      type: "POINT",
      allowNull: true
    },
    relativeOrder: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'festival_venues',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_venue_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

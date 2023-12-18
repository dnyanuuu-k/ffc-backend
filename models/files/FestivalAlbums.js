const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalAlbums', {
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
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    relativeOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'festival_albums',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "festival_albums_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

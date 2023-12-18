const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalOrganizers', {
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
      allowNull: false
    },
    designation: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    relativeOrder: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'festival_organizers',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_organizers_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

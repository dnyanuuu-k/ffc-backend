const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TinodeConfig', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: "tinode_config_user_id_key",
      field: 'user_id'
    },
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: "tinode_config_festival_id_key",
      field: 'festival_id'
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tinode_config',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "tinode_config_festival_id_key",
        unique: true,
        fields: [
          { name: "festival_id" },
        ]
      },
      {
        name: "tinode_config_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "tinode_config_user_id_key",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};

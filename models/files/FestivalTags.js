const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalTags', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalTagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_tag_list',
        key: 'id'
      },
      unique: "festival_tags_festival_tag_id_festival_id_key",
      field: 'festival_tag_id'
    },
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festivals',
        key: 'id'
      },
      unique: "festival_tags_festival_tag_id_festival_id_key",
      field: 'festival_id'
    }
  }, {
    sequelize,
    tableName: 'festival_tags',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_tags_festival_tag_id_festival_id_key",
        unique: true,
        fields: [
          { name: "festival_tag_id" },
          { name: "festival_id" },
        ]
      },
      {
        name: "festival_tags_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

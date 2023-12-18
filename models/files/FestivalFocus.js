const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalFocus', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalFocusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_focus_list',
        key: 'id'
      },
      unique: "festival_focus_festival_focus_id_festival_id_key",
      field: 'festival_focus_id'
    },
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festivals',
        key: 'id'
      },
      unique: "festival_focus_festival_focus_id_festival_id_key",
      field: 'festival_id'
    }
  }, {
    sequelize,
    tableName: 'festival_focus',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_focus_festival_focus_id_festival_id_key",
        unique: true,
        fields: [
          { name: "festival_focus_id" },
          { name: "festival_id" },
        ]
      },
      {
        name: "festival_focus_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

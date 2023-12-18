const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalFocusList', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: "festival_focus_list_title_key"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    tableName: 'festival_focus_list',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_focus_list_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "festival_focus_list_title_key",
        unique: true,
        fields: [
          { name: "title" },
        ]
      },
    ]
  });
};

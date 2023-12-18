const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalJudges', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'festivals',
        key: 'id'
      },
      field: 'festival_id'
    },
    accepted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'festival_judges',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "festival_judges_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

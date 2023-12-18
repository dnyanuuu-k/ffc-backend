const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ReviewTasks', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.SMALLINT,
      allowNull: true
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
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'review_tasks',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "review_tasks_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

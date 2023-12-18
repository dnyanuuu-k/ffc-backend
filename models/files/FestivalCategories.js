const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalCategories', {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    runtimeType: {
      type: DataTypes.ENUM("ANY","BETWEEN","OVER"),
      allowNull: true,
      defaultValue: "ANY",
      field: 'runtime_type'
    },
    runtimeStart: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'runtime_start'
    },
    runtimeEnd: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'runtime_end'
    },
    projectOrigins: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'project_origins'
    },
    relativeOrder: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'festival_categories',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_categories_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

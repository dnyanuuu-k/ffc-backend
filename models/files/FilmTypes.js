const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmTypes', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    filmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'films',
        key: 'id'
      },
      field: 'film_id'
    },
    filmTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'film_type_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_active'
    }
  }, {
    sequelize,
    tableName: 'film_types',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "film_types_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

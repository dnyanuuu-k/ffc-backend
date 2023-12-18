const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmGenreList', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    tableName: 'film_genre_list',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "film_genre_list_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

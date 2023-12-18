const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmGenres', {
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
    filmGenreId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'film_genre_list',
        key: 'id'
      },
      field: 'film_genre_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_active'
    }
  }, {
    sequelize,
    tableName: 'film_genres',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "film_genres_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

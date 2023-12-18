const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmLanguages', {
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
      unique: "film_languages_film_id_language_id_key",
      field: 'film_id'
    },
    languageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'languages',
        key: 'id'
      },
      unique: "film_languages_film_id_language_id_key",
      field: 'language_id'
    }
  }, {
    sequelize,
    tableName: 'film_languages',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "film_languages_film_id_language_id_key",
        unique: true,
        fields: [
          { name: "film_id" },
          { name: "language_id" },
        ]
      },
      {
        name: "film_languages_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

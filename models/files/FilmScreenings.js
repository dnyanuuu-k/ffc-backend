const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmScreenings', {
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
    festivalName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'festival_name'
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    country: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    screeningDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'screening_date'
    },
    premiere: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    awardSelection: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'award_selection'
    },
    relativeOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'film_screenings',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "film_screenings_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

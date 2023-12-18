const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmCreditSections', {
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
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    relativeOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 1,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'film_credit_sections',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "film_credit_sections_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

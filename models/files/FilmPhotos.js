const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FilmPhotos', {
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
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    hash: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    thumbUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'thumb_url'
    },
    width: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    height: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    format: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sizeInKb: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'size_in_kb'
    },
    relativeOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'film_photos',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "film_photos_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

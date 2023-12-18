const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FestivalAlbumPhotos', {
    id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    festivalAlbumId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_albums',
        key: 'id'
      },
      unique: "festival_album_photos_festival_album_id_festival_photo_id_key",
      field: 'festival_album_id'
    },
    festivalPhotoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'festival_photos',
        key: 'id'
      },
      unique: "festival_album_photos_festival_album_id_festival_photo_id_key",
      field: 'festival_photo_id'
    },
    relativeOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: 'relative_order'
    }
  }, {
    sequelize,
    tableName: 'festival_album_photos',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "festival_album_photos_festival_album_id_festival_photo_id_key",
        unique: true,
        fields: [
          { name: "festival_album_id" },
          { name: "festival_photo_id" },
        ]
      },
      {
        name: "festival_album_photos_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
